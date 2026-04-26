// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {GameItems} from "../src/GameItems.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC1155Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract NonReceiver {}

contract Receiver is ERC1155Holder {}

contract GameItemsTest is Test {
    GameItems internal game;

    address internal owner = address(this);
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    string internal constant BASE_URI = "ipfs://bafy/{id}.json";

    uint256 internal GOLD;
    uint256 internal WOOD;
    uint256 internal IRON;
    uint256 internal SWORD;
    uint256 internal SHIELD;

    function setUp() public {
        game = new GameItems(BASE_URI);
        GOLD = game.GOLD();
        WOOD = game.WOOD();
        IRON = game.IRON();
        SWORD = game.LEGENDARY_SWORD();
        SHIELD = game.DRAGON_SHIELD();
    }

    function _seedAlice() internal {
        game.mint(alice, GOLD, 100, "");
        game.mint(alice, WOOD, 100, "");
        game.mint(alice, IRON, 100, "");
    }

    function test_MintFungibleAndCheckBalance() public {
        game.mint(alice, GOLD, 50, "");
        assertEq(game.balanceOf(alice, GOLD), 50);
        assertEq(game.totalSupply(GOLD), 50);
    }

    function test_MintBatch() public {
        uint256[] memory ids = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);
        ids[0] = GOLD;
        ids[1] = WOOD;
        ids[2] = IRON;
        amounts[0] = 10;
        amounts[1] = 20;
        amounts[2] = 30;

        game.mintBatch(alice, ids, amounts, "");

        address[] memory accounts = new address[](3);
        accounts[0] = alice;
        accounts[1] = alice;
        accounts[2] = alice;
        uint256[] memory balances = game.balanceOfBatch(accounts, ids);
        assertEq(balances[0], 10);
        assertEq(balances[1], 20);
        assertEq(balances[2], 30);
    }

    function test_OnlyOwnerCanMint() public {
        vm.prank(alice);
        vm.expectRevert();
        game.mint(alice, GOLD, 1, "");
    }

    function test_SafeTransferFrom() public {
        _seedAlice();
        vm.prank(alice);
        game.safeTransferFrom(alice, bob, GOLD, 25, "");
        assertEq(game.balanceOf(alice, GOLD), 75);
        assertEq(game.balanceOf(bob, GOLD), 25);
    }

    function test_SafeBatchTransferFrom() public {
        _seedAlice();
        uint256[] memory ids = new uint256[](2);
        uint256[] memory amounts = new uint256[](2);
        ids[0] = GOLD;
        ids[1] = WOOD;
        amounts[0] = 10;
        amounts[1] = 15;

        vm.prank(alice);
        game.safeBatchTransferFrom(alice, bob, ids, amounts, "");
        assertEq(game.balanceOf(bob, GOLD), 10);
        assertEq(game.balanceOf(bob, WOOD), 15);
    }

    function test_TransferToNonReceiverReverts() public {
        _seedAlice();
        NonReceiver nr = new NonReceiver();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(IERC1155Errors.ERC1155InvalidReceiver.selector, address(nr))
        );
        game.safeTransferFrom(alice, address(nr), GOLD, 1, "");
    }

    function test_CraftLegendarySwordBurnsResources() public {
        _seedAlice();
        uint256 goldBefore = game.balanceOf(alice, GOLD);
        uint256 ironBefore = game.balanceOf(alice, IRON);

        vm.prank(alice);
        game.craft(SWORD);

        assertEq(game.balanceOf(alice, SWORD), 1);
        assertEq(game.balanceOf(alice, GOLD), goldBefore - 2);
        assertEq(game.balanceOf(alice, IRON), ironBefore - 5);
        assertEq(game.totalSupply(SWORD), 1);
    }

    function test_CraftDragonShield() public {
        _seedAlice();
        vm.prank(alice);
        game.craft(SHIELD);
        assertEq(game.balanceOf(alice, SHIELD), 1);
        assertEq(game.balanceOf(alice, WOOD), 96);
        assertEq(game.balanceOf(alice, IRON), 97);
    }

    function test_CraftRevertsWithoutResources() public {
        vm.prank(alice);
        vm.expectRevert();
        game.craft(SWORD);
    }

    function test_CraftFungibleIdReverts() public {
        _seedAlice();
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(GameItems.NotAnNFT.selector, GOLD));
        game.craft(GOLD);
    }

    function test_UriReturnsBaseURI() public view {
        assertEq(game.uri(0), BASE_URI);
        assertEq(game.uri(SWORD), BASE_URI);
    }

    function test_BurnFungibles() public {
        _seedAlice();
        vm.prank(alice);
        game.burn(alice, GOLD, 10);
        assertEq(game.balanceOf(alice, GOLD), 90);
        assertEq(game.totalSupply(GOLD), 90);
    }

    function test_TransferToReceiverContract() public {
        _seedAlice();
        Receiver r = new Receiver();
        vm.prank(alice);
        game.safeTransferFrom(alice, address(r), WOOD, 5, "");
        assertEq(game.balanceOf(address(r), WOOD), 5);
    }
}
