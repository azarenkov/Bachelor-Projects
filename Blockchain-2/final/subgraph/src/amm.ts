import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { LiquidityAdded, LiquidityRemoved, Swap as SwapEvent, Sync } from "../generated/SimpleAMM/SimpleAMM";
import { LiquidityChange, Pool, Swap } from "../generated/schema";

function loadOrCreatePool(address: Bytes): Pool {
    let pool = Pool.load(address);
    if (pool == null) {
        pool = new Pool(address);
        pool.token0 = Bytes.empty();
        pool.token1 = Bytes.empty();
        pool.reserve0 = BigInt.zero();
        pool.reserve1 = BigInt.zero();
        pool.totalSwapVolume0 = BigInt.zero();
        pool.totalSwapVolume1 = BigInt.zero();
        pool.swapCount = BigInt.zero();
    }
    return pool;
}

export function handleSwap(event: SwapEvent): void {
    const pool = loadOrCreatePool(event.address);
    pool.swapCount = pool.swapCount.plus(BigInt.fromI32(1));
    pool.save();

    const swap = new Swap(event.transaction.hash.concatI32(event.logIndex.toI32()));
    swap.pool = pool.id;
    swap.sender = event.params.sender;
    swap.to = event.params.to;
    swap.tokenIn = event.params.tokenIn;
    swap.amountIn = event.params.amountIn;
    swap.amountOut = event.params.amountOut;
    swap.timestamp = event.block.timestamp;
    swap.block = event.block.number;
    swap.txHash = event.transaction.hash;
    swap.save();
}

export function handleLiquidityAdded(event: LiquidityAdded): void {
    const pool = loadOrCreatePool(event.address);
    pool.save();

    const lc = new LiquidityChange(event.transaction.hash.concatI32(event.logIndex.toI32()));
    lc.pool = pool.id;
    lc.provider = event.params.provider;
    lc.amount0 = event.params.amount0;
    lc.amount1 = event.params.amount1;
    lc.shares = event.params.sharesMinted;
    lc.isAdd = true;
    lc.timestamp = event.block.timestamp;
    lc.txHash = event.transaction.hash;
    lc.save();
}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {
    const pool = loadOrCreatePool(event.address);
    pool.save();

    const lc = new LiquidityChange(event.transaction.hash.concatI32(event.logIndex.toI32()));
    lc.pool = pool.id;
    lc.provider = event.params.provider;
    lc.amount0 = event.params.amount0;
    lc.amount1 = event.params.amount1;
    lc.shares = event.params.sharesBurned;
    lc.isAdd = false;
    lc.timestamp = event.block.timestamp;
    lc.txHash = event.transaction.hash;
    lc.save();
}

export function handleSync(event: Sync): void {
    const pool = loadOrCreatePool(event.address);
    pool.reserve0 = event.params.reserve0;
    pool.reserve1 = event.params.reserve1;
    pool.save();
}
