// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title LendingPool — simplified single-asset collateral/borrow protocol
///
/// Design
/// ──────
/// • Single collateral token, single borrow token (can be the same for testing).
/// • Max LTV: 75 % (borrow up to 75 % of deposited collateral value at 1:1 price).
/// • Health Factor = (deposited * 1e18) / (borrowed * LTV_DENOM / LTV_NUM)
///   HF < 1e18  ⟹ undercollateralised ⟹ can be liquidated.
/// • Linear interest rate: BASE_RATE + SLOPE * utilisation
///   (utilisation = totalBorrowed / totalDeposited)
/// • Interest accrues on every borrow/repay/deposit/withdraw via _accrueInterest().
/// • Liquidator repays the full debt and receives the collateral with a 5 % bonus.
contract LendingPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Constants ──────────────────────────────────────────────────────────────

    uint256 public constant LTV_NUM = 75;           // 75 %
    uint256 public constant LTV_DENOM = 100;
    uint256 public constant LIQUIDATION_BONUS = 5;  // 5 % bonus for liquidators

    // Linear interest rate model  (per-second, scaled 1e18)
    // BASE  = 1 % / year  →  1e16 / 365 days
    // SLOPE = 20 % / year at 100 % utilisation
    uint256 public constant BASE_RATE  = 317097919837;   // ~1 % APR in 1e18/s
    uint256 public constant SLOPE_RATE = 6341958396752;  // ~20 % APR in 1e18/s

    uint256 public constant PRECISION = 1e18;

    // ── State ──────────────────────────────────────────────────────────────────

    IERC20 public immutable collateralToken;
    IERC20 public immutable borrowToken;

    struct UserPosition {
        uint256 deposited;      // collateral balance
        uint256 borrowed;       // debt principal
        uint256 interestIndex;  // snapshot of globalInterestIndex at last update
    }

    mapping(address => UserPosition) public positions;

    uint256 public totalDeposited;
    uint256 public totalBorrowed;

    // Interest index starts at 1e18; grows multiplicatively with each accrual
    uint256 public globalInterestIndex = PRECISION;
    uint256 public lastAccrualTimestamp;

    // ── Events ─────────────────────────────────────────────────────────────────

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Liquidated(
        address indexed liquidator,
        address indexed borrower,
        uint256 debtRepaid,
        uint256 collateralSeized
    );

    // ── Errors ─────────────────────────────────────────────────────────────────

    error ZeroAmount();
    error ExceedsLTV();
    error HealthFactorOk();
    error InsufficientCollateral();
    error OutstandingDebt();
    error NothingToRepay();

    // ── Constructor ────────────────────────────────────────────────────────────

    constructor(address _collateral, address _borrow) {
        require(_collateral != address(0) && _borrow != address(0));
        collateralToken = IERC20(_collateral);
        borrowToken = IERC20(_borrow);
        lastAccrualTimestamp = block.timestamp;
    }

    // ── External ───────────────────────────────────────────────────────────────

    /// @notice Deposit collateral.
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _accrueInterest();
        _updateUserDebt(msg.sender);

        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        positions[msg.sender].deposited += amount;
        totalDeposited += amount;

        emit Deposited(msg.sender, amount);
    }

    /// @notice Withdraw collateral (health factor must remain ≥ 1 after withdrawal).
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _accrueInterest();
        _updateUserDebt(msg.sender);

        UserPosition storage pos = positions[msg.sender];
        if (amount > pos.deposited) revert InsufficientCollateral();

        pos.deposited -= amount;
        totalDeposited -= amount;

        if (pos.borrowed > 0 && healthFactor(msg.sender) < PRECISION) {
            revert OutstandingDebt();
        }

        collateralToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Borrow against deposited collateral (max 75 % LTV).
    function borrow(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _accrueInterest();
        _updateUserDebt(msg.sender);

        UserPosition storage pos = positions[msg.sender];
        uint256 maxBorrow = (pos.deposited * LTV_NUM) / LTV_DENOM;
        if (pos.borrowed + amount > maxBorrow) revert ExceedsLTV();

        pos.borrowed += amount;
        totalBorrowed += amount;

        borrowToken.safeTransfer(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    /// @notice Repay debt (partial or full).
    function repay(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _accrueInterest();
        _updateUserDebt(msg.sender);

        UserPosition storage pos = positions[msg.sender];
        if (pos.borrowed == 0) revert NothingToRepay();

        uint256 repayAmount = amount > pos.borrowed ? pos.borrowed : amount;
        pos.borrowed -= repayAmount;
        totalBorrowed -= repayAmount;

        borrowToken.safeTransferFrom(msg.sender, address(this), repayAmount);
        emit Repaid(msg.sender, repayAmount);
    }

    /// @notice Liquidate an undercollateralised position.
    ///         Liquidator repays all debt and receives collateral + 5 % bonus.
    function liquidate(address borrower) external nonReentrant {
        _accrueInterest();
        _updateUserDebt(borrower);

        if (healthFactor(borrower) >= PRECISION) revert HealthFactorOk();

        UserPosition storage pos = positions[borrower];
        uint256 debt = pos.borrowed;
        if (debt == 0) revert NothingToRepay();

        uint256 collateralSeized = (debt * (100 + LIQUIDATION_BONUS)) / 100;
        if (collateralSeized > pos.deposited) {
            collateralSeized = pos.deposited;
        }

        pos.borrowed = 0;
        pos.deposited -= collateralSeized;
        totalBorrowed -= debt;
        totalDeposited -= collateralSeized;

        borrowToken.safeTransferFrom(msg.sender, address(this), debt);
        collateralToken.safeTransfer(msg.sender, collateralSeized);

        emit Liquidated(msg.sender, borrower, debt, collateralSeized);
    }

    // ── Views ──────────────────────────────────────────────────────────────────

    /// @notice Returns health factor scaled by 1e18. Values < 1e18 are liquidatable.
    function healthFactor(address user) public view returns (uint256) {
        UserPosition storage pos = positions[user];
        if (pos.borrowed == 0) return type(uint256).max;
        // max_borrow = deposited * 75 / 100
        // HF = (deposited * 75 / 100) / borrowed  →  scale by 1e18
        return (pos.deposited * LTV_NUM * PRECISION) / (pos.borrowed * LTV_DENOM);
    }

    /// @notice Current borrow APR in basis points (for display purposes).
    function currentBorrowRate() public view returns (uint256) {
        if (totalDeposited == 0) return BASE_RATE;
        uint256 utilisation = (totalBorrowed * PRECISION) / totalDeposited;
        return BASE_RATE + (SLOPE_RATE * utilisation) / PRECISION;
    }

    // ── Internal ───────────────────────────────────────────────────────────────

    /// @dev Compound interest: index *= (1 + rate * dt)
    function _accrueInterest() internal {
        uint256 dt = block.timestamp - lastAccrualTimestamp;
        if (dt == 0) return;

        uint256 rate = currentBorrowRate();
        uint256 factor = PRECISION + rate * dt;  // 1 + r*dt (linear approx)
        globalInterestIndex = (globalInterestIndex * factor) / PRECISION;
        lastAccrualTimestamp = block.timestamp;
    }

    /// @dev Scale user's debt by how much the global index has grown since their snapshot.
    function _updateUserDebt(address user) internal {
        UserPosition storage pos = positions[user];
        if (pos.borrowed > 0 && pos.interestIndex > 0) {
            pos.borrowed = (pos.borrowed * globalInterestIndex) / pos.interestIndex;
        }
        pos.interestIndex = globalInterestIndex;
    }
}
