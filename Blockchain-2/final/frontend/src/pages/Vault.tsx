import { useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { erc4626Abi, erc20Abi } from "viem";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { ADDRESSES } from "../config/addresses";
import { TxButton } from "../components/TxButton";
import { AddressChip } from "../components/AddressChip";
import layout from "../styles/layout.module.css";
import comp from "../styles/components.module.css";

const ASSET_DECIMALS = 18;

export function Vault() {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
    const [amount, setAmount] = useState("100");

    const amountWei = useMemo(() => {
        try {
            return parseUnits(amount || "0", ASSET_DECIMALS);
        } catch {
            return 0n;
        }
    }, [amount]);

    const { data: reads } = useReadContracts({
        contracts: address
            ? [
                  { address: ADDRESSES.vault, abi: erc4626Abi, functionName: "totalAssets" },
                  { address: ADDRESSES.vault, abi: erc4626Abi, functionName: "totalSupply" },
                  { address: ADDRESSES.vault, abi: erc4626Abi, functionName: "balanceOf", args: [address] },
                  {
                      address: ADDRESSES.demoUsdc,
                      abi: erc20Abi,
                      functionName: "balanceOf",
                      args: [address],
                  },
                  {
                      address: ADDRESSES.demoUsdc,
                      abi: erc20Abi,
                      functionName: "allowance",
                      args: [address, ADDRESSES.vault],
                  },
              ]
            : [],
        query: { enabled: !!address, refetchInterval: 12_000 },
    });

    const totalAssets = reads?.[0]?.result as bigint | undefined;
    const totalSupply = reads?.[1]?.result as bigint | undefined;
    const myShares = reads?.[2]?.result as bigint | undefined;
    const myUsdc = reads?.[3]?.result as bigint | undefined;
    const allowance = reads?.[4]?.result as bigint | undefined;
    const needsApproval = tab === "deposit" && (allowance ?? 0n) < amountWei;

    const pricePerShare = useMemo(() => {
        if (!totalAssets || !totalSupply || totalSupply === 0n) return 1;
        return Number(formatUnits(totalAssets, ASSET_DECIMALS)) /
            Number(formatUnits(totalSupply, ASSET_DECIMALS));
    }, [totalAssets, totalSupply]);

    return (
        <div className="fade-up">
            <header className={layout.pageHeader}>
                <div className={`eyebrow ${layout.pageEyebrow}`}>ERC-4626 yield vault</div>
                <h1 className={layout.pageTitle}>
                    Vault <em>vdUSDC</em>
                </h1>
                <p className={layout.pageLede}>
                    Tokenized share vault, 10% performance fee skim to the Timelock-owned Treasury.
                    Decimal-offset of 6 to harden the first-depositor inflation attack.
                </p>
            </header>

            <div className={comp.statRow}>
                <div className={comp.stat}>
                    <div className={comp.statLabel}>Total Assets</div>
                    <div className={comp.statValue}>
                        {totalAssets ? Number(formatUnits(totalAssets, ASSET_DECIMALS)).toLocaleString() : "—"}
                    </div>
                    <div className={comp.statSub}>dUSDC held by the vault</div>
                </div>
                <div className={comp.stat}>
                    <div className={comp.statLabel}>Total Shares</div>
                    <div className={comp.statValue}>
                        {totalSupply ? Number(formatUnits(totalSupply, ASSET_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
                    </div>
                    <div className={comp.statSub}>Outstanding vdUSDC</div>
                </div>
                <div className={comp.stat}>
                    <div className={comp.statLabel}>Your Shares</div>
                    <div className={comp.statValue}>
                        {myShares ? Number(formatUnits(myShares, ASSET_DECIMALS)).toLocaleString() : "—"}
                    </div>
                    <div className={comp.statSub}>vdUSDC</div>
                </div>
                <div className={comp.stat}>
                    <div className={comp.statLabel}>Price per Share</div>
                    <div className={comp.statValue}>{pricePerShare.toFixed(6)}</div>
                    <div className={comp.statSub}>convertToAssets(1e18)</div>
                </div>
            </div>

            <div className={comp.twoCol}>
                <div className={comp.card}>
                    <div className={comp.cardHeader}>
                        <span className={comp.cardLabel}>Position management</span>
                        <span className={comp.cardCorner}>{tab.toUpperCase()}</span>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                        <button
                            onClick={() => setTab("deposit")}
                            className={`${comp.btn} ${tab === "deposit" ? comp.btnPrimary : comp.btnGhost}`}
                        >
                            Deposit
                        </button>
                        <button
                            onClick={() => setTab("withdraw")}
                            className={`${comp.btn} ${tab === "withdraw" ? comp.btnPrimary : comp.btnGhost}`}
                        >
                            Withdraw
                        </button>
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
                            <span className={comp.tokenSelect}>{tab === "deposit" ? "dUSDC" : "vdUSDC"}</span>
                        </div>
                        <div className={comp.tokenMeta}>
                            <span>{tab === "deposit" ? "Wallet balance" : "Vault position"}</span>
                            <span>
                                {tab === "deposit"
                                    ? myUsdc ? formatUnits(myUsdc, ASSET_DECIMALS) : "—"
                                    : myShares ? formatUnits(myShares, ASSET_DECIMALS) : "—"}{" "}
                                <button
                                    onClick={() => {
                                        const v = tab === "deposit" ? myUsdc : myShares;
                                        if (v) setAmount(formatUnits(v, ASSET_DECIMALS));
                                    }}
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

                    <div style={{ marginTop: 24 }}>
                        {tab === "deposit" && needsApproval ? (
                            <TxButton
                                block
                                label="Approve dUSDC"
                                disabled={!address || amountWei === 0n}
                                onClick={async () =>
                                    writeContractAsync({
                                        address: ADDRESSES.demoUsdc,
                                        abi: erc20Abi,
                                        functionName: "approve",
                                        args: [ADDRESSES.vault, 2n ** 256n - 1n],
                                    })
                                }
                            />
                        ) : (
                            <TxButton
                                block
                                label={tab === "deposit" ? "Deposit dUSDC" : "Redeem vdUSDC"}
                                disabled={!address || amountWei === 0n}
                                onClick={async () =>
                                    tab === "deposit"
                                        ? writeContractAsync({
                                              address: ADDRESSES.vault,
                                              abi: erc4626Abi,
                                              functionName: "deposit",
                                              args: [amountWei, address!],
                                          })
                                        : writeContractAsync({
                                              address: ADDRESSES.vault,
                                              abi: erc4626Abi,
                                              functionName: "redeem",
                                              args: [amountWei, address!, address!],
                                          })
                                }
                            />
                        )}
                    </div>
                </div>

                <aside className={comp.aside}>
                    <div className={comp.asideRow}>
                        <span className={comp.asideKey}>Vault</span>
                        <AddressChip address={ADDRESSES.vault} />
                    </div>
                    <div className={comp.asideRow}>
                        <span className={comp.asideKey}>Asset</span>
                        <AddressChip address={ADDRESSES.demoUsdc} />
                    </div>
                    <div className={comp.asideRow}>
                        <span className={comp.asideKey}>Performance fee</span>
                        <span className={comp.asideValue}>10.00%</span>
                    </div>
                    <div className={comp.asideRow}>
                        <span className={comp.asideKey}>Decimal offset</span>
                        <span className={comp.asideValue}>6</span>
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
