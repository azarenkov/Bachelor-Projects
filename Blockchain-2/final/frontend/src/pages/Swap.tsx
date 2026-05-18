import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { erc20Abi } from "viem";
import { useAccount, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { ADDRESSES } from "../config/addresses";
import { TxButton } from "../components/TxButton";
import { AddressChip } from "../components/AddressChip";
import layout from "../styles/layout.module.css";
import comp from "../styles/components.module.css";

const ammAbi = [
    {
        type: "function",
        name: "swapExactIn",
        stateMutability: "nonpayable",
        inputs: [
            { name: "tokenIn", type: "address" },
            { name: "amountIn", type: "uint256" },
            { name: "amountOutMin", type: "uint256" },
            { name: "to", type: "address" },
        ],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "quoteAmountOut",
        stateMutability: "view",
        inputs: [
            { name: "tokenIn", type: "address" },
            { name: "amountIn", type: "uint256" },
        ],
        outputs: [{ type: "uint256" }],
    },
] as const;

type Side = "usdc-to-weth" | "weth-to-usdc";

const tokens = {
    dUSDC: { address: ADDRESSES.demoUsdc, symbol: "dUSDC", decimals: 18 },
    dWETH: { address: ADDRESSES.demoWeth, symbol: "dWETH", decimals: 18 },
} as const;

export function Swap() {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();

    const [side, setSide] = useState<Side>("usdc-to-weth");
    const [amount, setAmount] = useState("100");
    const [slippageBps, setSlippageBps] = useState(50); // 0.5%

    const inToken = side === "usdc-to-weth" ? tokens.dUSDC : tokens.dWETH;
    const outToken = side === "usdc-to-weth" ? tokens.dWETH : tokens.dUSDC;

    const amountInWei = useMemo(() => {
        try {
            return parseUnits(amount || "0", inToken.decimals);
        } catch {
            return 0n;
        }
    }, [amount, inToken.decimals]);

    const { data: quote } = useReadContract({
        address: ADDRESSES.amm,
        abi: ammAbi,
        functionName: "quoteAmountOut",
        args: [inToken.address, amountInWei],
        query: { enabled: amountInWei > 0n, refetchInterval: 6_000 },
    });

    const { data: reads } = useReadContracts({
        contracts: address
            ? [
                  { address: inToken.address, abi: erc20Abi, functionName: "balanceOf", args: [address] },
                  {
                      address: inToken.address,
                      abi: erc20Abi,
                      functionName: "allowance",
                      args: [address, ADDRESSES.amm],
                  },
              ]
            : [],
        query: { enabled: !!address, refetchInterval: 12_000 },
    });

    const inBalance = reads?.[0]?.result as bigint | undefined;
    const allowance = reads?.[1]?.result as bigint | undefined;
    const needsApproval = (allowance ?? 0n) < amountInWei;

    const minOut = useMemo(() => {
        if (!quote) return 0n;
        return ((quote as bigint) * BigInt(10_000 - slippageBps)) / 10_000n;
    }, [quote, slippageBps]);

    return (
        <div className="fade-up">
            <header className={layout.pageHeader}>
                <div className={`eyebrow ${layout.pageEyebrow}`}>AMM · x · y = k</div>
                <h1 className={layout.pageTitle}>
                    Swap <em>tokens</em>
                </h1>
                <p className={layout.pageLede}>
                    Constant-product pool, 0.3% fee, slippage-protected. The pair was seeded at deploy with
                    100,000 dUSDC / 50 dWETH.
                </p>
            </header>

            <div className={comp.twoCol}>
                <div className={comp.card}>
                    <div className={comp.cardHeader}>
                        <span className={comp.cardLabel}>Swap interface</span>
                        <span className={comp.cardCorner}>
                            slippage · <input
                                style={{
                                    width: 50,
                                    background: "transparent",
                                    color: "var(--accent)",
                                    border: 0,
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 12,
                                    textAlign: "right",
                                }}
                                value={slippageBps / 100}
                                onChange={(e) =>
                                    setSlippageBps(Math.max(0, Math.min(5_000, Math.round(parseFloat(e.target.value || "0") * 100))))
                                }
                            />
                            %
                        </span>
                    </div>

                    <div className={comp.tokenBox}>
                        <div className={comp.tokenBoxRow}>
                            <input
                                className={comp.tokenAmount}
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                type="number"
                                min={0}
                            />
                            <span className={comp.tokenSelect}>{inToken.symbol}</span>
                        </div>
                        <div className={comp.tokenMeta}>
                            <span>Pay</span>
                            <span>
                                Balance · {inBalance ? formatUnits(inBalance, inToken.decimals) : "—"}{" "}
                                <button
                                    onClick={() => inBalance && setAmount(formatUnits(inBalance, inToken.decimals))}
                                    style={{
                                        background: "transparent",
                                        border: 0,
                                        color: "var(--accent)",
                                        marginLeft: 4,
                                        cursor: "pointer",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: 11,
                                    }}
                                >
                                    MAX
                                </button>
                            </span>
                        </div>
                    </div>

                    <div className={comp.swapArrow}>
                        <button
                            className={comp.swapArrowInner}
                            onClick={() =>
                                setSide(side === "usdc-to-weth" ? "weth-to-usdc" : "usdc-to-weth")
                            }
                            title="Flip direction"
                        >
                            ↓
                        </button>
                    </div>

                    <div className={comp.tokenBox}>
                        <div className={comp.tokenBoxRow}>
                            <div className={comp.tokenAmount} style={{ color: "var(--text-secondary)" }}>
                                {quote ? formatUnits(quote as bigint, outToken.decimals) : "0.00"}
                            </div>
                            <span className={comp.tokenSelect}>{outToken.symbol}</span>
                        </div>
                        <div className={comp.tokenMeta}>
                            <span>Receive (estimated)</span>
                            <span>Min · {formatUnits(minOut, outToken.decimals)}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: 24 }}>
                        {needsApproval ? (
                            <TxButton
                                block
                                label={`Approve ${inToken.symbol}`}
                                disabled={!address || amountInWei === 0n}
                                onClick={async () =>
                                    writeContractAsync({
                                        address: inToken.address,
                                        abi: erc20Abi,
                                        functionName: "approve",
                                        args: [ADDRESSES.amm, 2n ** 256n - 1n],
                                    })
                                }
                            />
                        ) : (
                            <TxButton
                                block
                                label={`Swap ${inToken.symbol} → ${outToken.symbol}`}
                                disabled={!address || amountInWei === 0n}
                                onClick={async () =>
                                    writeContractAsync({
                                        address: ADDRESSES.amm,
                                        abi: ammAbi,
                                        functionName: "swapExactIn",
                                        args: [inToken.address, amountInWei, minOut, address!],
                                    })
                                }
                            />
                        )}
                    </div>
                </div>

                <aside className={comp.aside}>
                    <div className={comp.asideRow}>
                        <span className={comp.asideKey}>Pair</span>
                        <AddressChip address={ADDRESSES.amm} />
                    </div>
                    <div className={comp.asideRow}>
                        <span className={comp.asideKey}>Fee</span>
                        <span className={comp.asideValue}>0.30%</span>
                    </div>
                    <div className={comp.asideRow}>
                        <span className={comp.asideKey}>Quote</span>
                        <span className={comp.asideValue}>
                            {quote ? formatUnits(quote as bigint, outToken.decimals) : "—"} {outToken.symbol}
                        </span>
                    </div>
                    <div className={comp.asideRow}>
                        <span className={comp.asideKey}>Min received</span>
                        <span className={comp.asideValue}>
                            {formatUnits(minOut, outToken.decimals)} {outToken.symbol}
                        </span>
                    </div>
                    <div className={comp.asideRow}>
                        <span className={comp.asideKey}>Approval</span>
                        <span className={comp.asideValue}>{needsApproval ? "Required" : "✓ Granted"}</span>
                    </div>
                </aside>
            </div>
        </div>
    );
}
