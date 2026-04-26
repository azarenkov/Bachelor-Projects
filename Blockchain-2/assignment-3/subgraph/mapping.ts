import { BigInt, Bytes, store } from "@graphprotocol/graph-ts";

import {
  TransferSingle as TransferSingleEvent,
  TransferBatch as TransferBatchEvent,
  ItemCrafted as ItemCraftedEvent,
} from "../generated/GameItems/GameItems";

import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  Harvested as HarvestedEvent,
} from "../generated/Vault/Vault";

import {
  Account,
  Token,
  TokenBalance,
  TransferSingle,
  TransferBatch,
  CraftEvent,
  User,
  VaultDeposit,
  VaultWithdrawal,
  HarvestEvent,
  LiquiditySnapshot,
  GlobalStats,
} from "../generated/schema";

// ----- helpers -----

function loadOrCreateAccount(addr: Bytes): Account {
  let id = addr.toHexString();
  let acc = Account.load(id);
  if (acc == null) {
    acc = new Account(id);
    acc.save();
  }
  return acc;
}

function loadOrCreateToken(tokenId: BigInt): Token {
  let id = tokenId.toString();
  let t = Token.load(id);
  if (t == null) {
    t = new Token(id);
    t.totalSupply = BigInt.zero();
    t.save();
  }
  return t;
}

function balanceId(account: string, token: string): string {
  return account + "-" + token;
}

function loadOrCreateBalance(accountId: string, tokenId: string): TokenBalance {
  let id = balanceId(accountId, tokenId);
  let b = TokenBalance.load(id);
  if (b == null) {
    b = new TokenBalance(id);
    b.account = accountId;
    b.token = tokenId;
    b.amount = BigInt.zero();
  }
  return b;
}

function loadOrCreateUser(addr: Bytes): User {
  let id = addr.toHexString();
  let u = User.load(id);
  if (u == null) {
    u = new User(id);
    u.totalShares = BigInt.zero();
    u.totalAssetsDeposited = BigInt.zero();
    u.save();
  }
  return u;
}

function loadOrCreateGlobal(): GlobalStats {
  let g = GlobalStats.load("global");
  if (g == null) {
    g = new GlobalStats("global");
    g.totalSwaps = BigInt.zero();
    g.totalCrafts = BigInt.zero();
    g.totalDeposits = BigInt.zero();
    g.totalWithdrawals = BigInt.zero();
  }
  return g;
}

const ZERO_ADDRESS = Bytes.fromHexString(
  "0x0000000000000000000000000000000000000000"
);

function applyTransfer(
  fromAddr: Bytes,
  toAddr: Bytes,
  tokenId: BigInt,
  amount: BigInt
): void {
  let token = loadOrCreateToken(tokenId);

  if (fromAddr.equals(ZERO_ADDRESS)) {
    // mint
    token.totalSupply = token.totalSupply.plus(amount);
  } else {
    let fromAcc = loadOrCreateAccount(fromAddr);
    let fromBal = loadOrCreateBalance(fromAcc.id, token.id);
    fromBal.amount = fromBal.amount.minus(amount);
    fromBal.save();
  }

  if (toAddr.equals(ZERO_ADDRESS)) {
    // burn
    token.totalSupply = token.totalSupply.minus(amount);
  } else {
    let toAcc = loadOrCreateAccount(toAddr);
    let toBal = loadOrCreateBalance(toAcc.id, token.id);
    toBal.amount = toBal.amount.plus(amount);
    toBal.save();
  }

  token.save();
}

// ----- ERC-1155 handlers -----

export function handleTransferSingle(event: TransferSingleEvent): void {
  let fromAcc = loadOrCreateAccount(event.params.from);
  let toAcc = loadOrCreateAccount(event.params.to);
  let token = loadOrCreateToken(event.params.id);

  applyTransfer(event.params.from, event.params.to, event.params.id, event.params.value);

  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let entity = new TransferSingle(id);
  entity.operator = event.params.operator;
  entity.from = fromAcc.id;
  entity.to = toAcc.id;
  entity.token = token.id;
  entity.amount = event.params.value;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.save();
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  let fromAcc = loadOrCreateAccount(event.params.from);
  let toAcc = loadOrCreateAccount(event.params.to);

  let ids = event.params.ids;
  let amounts = event.params.values;
  for (let i = 0; i < ids.length; i++) {
    applyTransfer(event.params.from, event.params.to, ids[i], amounts[i]);
  }

  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let entity = new TransferBatch(id);
  entity.operator = event.params.operator;
  entity.from = fromAcc.id;
  entity.to = toAcc.id;
  entity.tokenIds = ids;
  entity.amounts = amounts;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.save();
}

export function handleItemCrafted(event: ItemCraftedEvent): void {
  let player = loadOrCreateAccount(event.params.player);
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let entity = new CraftEvent(id);
  entity.player = player.id;
  entity.itemId = event.params.itemId;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.save();

  let g = loadOrCreateGlobal();
  g.totalCrafts = g.totalCrafts.plus(BigInt.fromI32(1));
  g.save();
}

// ----- ERC-4626 handlers -----

export function handleDeposit(event: DepositEvent): void {
  let owner = loadOrCreateUser(event.params.owner);
  owner.totalShares = owner.totalShares.plus(event.params.shares);
  owner.totalAssetsDeposited = owner.totalAssetsDeposited.plus(event.params.assets);
  owner.save();

  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let entity = new VaultDeposit(id);
  entity.caller = event.params.sender;
  entity.owner = owner.id;
  entity.assets = event.params.assets;
  entity.shares = event.params.shares;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.save();

  // snapshot
  let snap = new LiquiditySnapshot(event.block.timestamp.toString());
  let g = loadOrCreateGlobal();
  g.totalDeposits = g.totalDeposits.plus(BigInt.fromI32(1));
  g.save();

  snap.totalAssets = owner.totalAssetsDeposited; // simplified — full version reads totalAssets()
  snap.totalShares = owner.totalShares;
  snap.blockTimestamp = event.block.timestamp;
  snap.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  let owner = loadOrCreateUser(event.params.owner);
  owner.totalShares = owner.totalShares.minus(event.params.shares);
  owner.save();

  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let entity = new VaultWithdrawal(id);
  entity.caller = event.params.sender;
  entity.receiver = event.params.receiver;
  entity.owner = owner.id;
  entity.assets = event.params.assets;
  entity.shares = event.params.shares;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.save();

  let g = loadOrCreateGlobal();
  g.totalWithdrawals = g.totalWithdrawals.plus(BigInt.fromI32(1));
  g.save();
}

export function handleHarvested(event: HarvestedEvent): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let entity = new HarvestEvent(id);
  entity.yield_ = event.params.yield;
  entity.totalAssetsAfter = event.params.totalAssetsAfter;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.save();
}
