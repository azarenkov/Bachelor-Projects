// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title GameItems — ERC-1155 multi-token contract for an on-chain game.
/// @notice Holds three fungible resources (GOLD, WOOD, IRON) and two non-fungible
///         items (LEGENDARY_SWORD, DRAGON_SHIELD). Players can craft NFTs by
///         burning a fixed recipe of fungible resources.
contract GameItems is ERC1155, ERC1155Burnable, ERC1155Supply, Ownable {
    uint256 public constant GOLD = 0;
    uint256 public constant WOOD = 1;
    uint256 public constant IRON = 2;
    uint256 public constant LEGENDARY_SWORD = 100;
    uint256 public constant DRAGON_SHIELD = 101;

    uint256 private constant FUNGIBLE_THRESHOLD = 100;

    struct Recipe {
        uint256[] resourceIds;
        uint256[] amounts;
        bool exists;
    }

    mapping(uint256 itemId => Recipe) private _recipes;

    event ItemCrafted(address indexed player, uint256 indexed itemId);
    event RecipeSet(uint256 indexed itemId);

    error UnknownRecipe(uint256 itemId);
    error NotAnNFT(uint256 itemId);
    error InvalidRecipe();

    constructor(string memory baseURI) ERC1155(baseURI) Ownable(msg.sender) {
        uint256[] memory swordIds = new uint256[](2);
        uint256[] memory swordAmounts = new uint256[](2);
        swordIds[0] = IRON;
        swordIds[1] = GOLD;
        swordAmounts[0] = 5;
        swordAmounts[1] = 2;
        _setRecipe(LEGENDARY_SWORD, swordIds, swordAmounts);

        uint256[] memory shieldIds = new uint256[](2);
        uint256[] memory shieldAmounts = new uint256[](2);
        shieldIds[0] = WOOD;
        shieldIds[1] = IRON;
        shieldAmounts[0] = 4;
        shieldAmounts[1] = 3;
        _setRecipe(DRAGON_SHIELD, shieldIds, shieldAmounts);
    }

    function setURI(string memory newURI) external onlyOwner {
        _setURI(newURI);
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data) external onlyOwner {
        _mint(to, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        external
        onlyOwner
    {
        _mintBatch(to, ids, amounts, data);
    }

    /// @notice Crafts an NFT for the caller by burning the recipe inputs from the caller's balance.
    function craft(uint256 itemId) external {
        if (itemId < FUNGIBLE_THRESHOLD) revert NotAnNFT(itemId);
        Recipe memory recipe = _recipes[itemId];
        if (!recipe.exists) revert UnknownRecipe(itemId);

        _burnBatch(msg.sender, recipe.resourceIds, recipe.amounts);
        _mint(msg.sender, itemId, 1, "");
        emit ItemCrafted(msg.sender, itemId);
    }

    function setRecipe(uint256 itemId, uint256[] memory resourceIds, uint256[] memory amounts) external onlyOwner {
        if (itemId < FUNGIBLE_THRESHOLD) revert NotAnNFT(itemId);
        _setRecipe(itemId, resourceIds, amounts);
    }

    function getRecipe(uint256 itemId) external view returns (uint256[] memory, uint256[] memory) {
        Recipe memory recipe = _recipes[itemId];
        if (!recipe.exists) revert UnknownRecipe(itemId);
        return (recipe.resourceIds, recipe.amounts);
    }

    /// @inheritdoc ERC1155
    /// @dev Returns the configured base URI; clients substitute {id} per the ERC-1155 spec.
    function uri(uint256) public view override returns (string memory) {
        return super.uri(0);
    }

    function _setRecipe(uint256 itemId, uint256[] memory resourceIds, uint256[] memory amounts) internal {
        if (resourceIds.length == 0 || resourceIds.length != amounts.length) revert InvalidRecipe();
        _recipes[itemId] = Recipe({resourceIds: resourceIds, amounts: amounts, exists: true});
        emit RecipeSet(itemId);
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}
