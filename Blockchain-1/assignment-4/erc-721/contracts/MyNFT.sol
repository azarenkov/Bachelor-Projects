// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;

    string private _baseTokenURI;

    mapping(address => uint256[]) private _ownedTokens;

    event NFTMinted(
        address indexed to,
        uint256 indexed tokenId,
        string tokenURI
    );
    event BaseURIUpdated(string newBaseURI);

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _nextTokenId = 1; // Start token IDs from 1
    }

    function mint(
        address to,
        string memory uri
    ) public onlyOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(uri).length > 0, "URI cannot be empty");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        _ownedTokens[to].push(tokenId);

        emit NFTMinted(to, tokenId, uri);
        return tokenId;
    }

    function batchMint(address to, string[] memory uris) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(uris.length > 0, "Must mint at least one token");

        for (uint256 i = 0; i < uris.length; i++) {
            mint(to, uris[i]);
        }
    }

    function tokensOfOwner(
        address owner
    ) public view returns (uint256[] memory) {
        require(owner != address(0), "Cannot query zero address");

        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        uint256 index = 0;

        for (uint256 i = 0; i < _ownedTokens[owner].length; i++) {
            uint256 tokenId = _ownedTokens[owner][i];
            if (_ownerOf(tokenId) == owner) {
                tokens[index] = tokenId;
                index++;
            }
        }

        return tokens;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
