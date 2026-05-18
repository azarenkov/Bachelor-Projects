import { formatUnits } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { erc20Abi } from "viem";
import { useAccount } from "wagmi";
import { ADDRESSES } from "../config/addresses";
import { AddressChip } from "../components/AddressChip";
import layout from "../styles/layout.module.css";
import comp from "../styles/components.module.css";

const ammAbi = [
    {
        type: "function",
        name: "getReserves",
        stateMutability: "view",
        inputs: [],
        outputs: [
            { name: "reserve0", type: "uint112" },
            { name: "reserve1", type: "uint112" },
            { name: "blockTimestampLast", type: "uint32" },
        ],
    },
    {
        type: "function",
        name: "token0",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "address" }],
    },
] as const;

const votesAbi = [
    {
        type: "function",
        name: "getVotes",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "delegates",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ type: "address" }],
    },
] as const;

function formatPretty(value: bigint | undefined, decimals = 18, maxFractionDigits = 2) {
    if (value == null) return "—";
    const s = formatUnits(value, decimals);
    const [whole, frac = ""] = s.split(".");
    const wholeFormatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (maxFractionDigits === 0) return wholeFormatted;
    return frac ? `${wholeFormatted}.${frac.slice(0, maxFractionDigits).padEnd(maxFractionDigits, "0")}` : wholeFormatted;
}

export function Dashboard() {
    const { address } = useAccount();
    const enabled = !!address;

    const { data: balances } = useReadContracts({
        contracts: enabled
            ? [
                  { address: ADDRESSES.govToken, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
                  { address: ADDRESSES.govToken, abi: votesAbi, functionName: "getVotes", args: [address!] },
                  { address: ADDRESSES.govToken, abi: votesAbi, functionName: "delegates", args: [address!] },
                  { address: ADDRESSES.demoUsdc, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
                  { address: ADDRESSES.demoWeth, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
                  { address: ADDRESSES.vault, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
              ]
            : [],
        query: { enabled, refetchInterval: 12_000 },
    });

    const { data: reserves } = useReadContract({
        address: ADDRESSES.amm,
        abi: ammAbi,
        functionName: "getReserves",
        query: { refetchInterval: 12_000 },
    });

    const { data: token0 } = useReadContract({ address: ADDRESSES.amm, abi: ammAbi, functionName: "token0" });

    const gov = balances?.[0]?.result as bigint | undefined;
    const votes = balances?.[1]?.result as bigint | undefined;
    const delegate = balances?.[2]?.result as `0x${string}` | undefined;
    const usdcBal = balances?.[3]?.result as bigint | undefined;
    const wethBal = balances?.[4]?.result as bigint | undefined;
    const vaultBal = balances?.[5]?.result as bigint | undefined;

    // Reserve mapping: AMM sorted token0/token1 by address. Whichever is dUSDC is reserve0 of the pair.
    let usdcReserve: bigint | undefined;
    let wethReserve: bigint | undefined;
    if (reserves && token0) {
        const isUsdcToken0 = (token0 as string).toLowerCase() === ADDRESSES.demoUsdc.toLowerCase();
        usdcReserve = isUsdcToken0 ? reserves[0] : reserves[1];
        wethReserve = isUsdcToken0 ? reserves[1] : reserves[0];
    }

    return (
        <div className="fade-up">
            <header className={layout.pageHeader}>
                <div className={`eyebrow ${layout.pageEyebrow}`}>Overview / 421614</div>
                <h1 className={layout.pageTitle}>
                    Position <em>at a glance</em>
                </h1>
                <p className={layout.pageLede}>
                    A live snapshot of your governance position, AMM pool reserves, and vault holdings —
                    refreshed every 12 seconds against the Arbitrum Sepolia rollup.
                </p>
            </header>

            <div className={comp.statRow}>
                <div className={comp.stat}>
                    <div className={comp.statLabel}>PGOV Balance</div>
                    <div className={comp.statValue}>{formatPretty(gov)}</div>
                    <div className={comp.statSub}>Voting power · {formatPretty(votes)}</div>
                </div>
                <div className={comp.stat}>
                    <div className={comp.statLabel}>Delegate</div>
                    <div className={comp.statValue} style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 400 }}>
                        {delegate && delegate !== "0x0000000000000000000000000000000000000000"
                            ? `${delegate.slice(0, 6)}…${delegate.slice(-4)}`
                            : "—"}
                    </div>
                    <div className={comp.statSub}>{delegate && delegate.toLowerCase() === address?.toLowerCase() ? "Self-delegated" : "External"}</div>
                </div>
                <div className={comp.stat}>
                    <div className={comp.statLabel}>Demo USDC</div>
                    <div className={comp.statValue}>{formatPretty(usdcBal)}</div>
                    <div className={comp.statSub}>dUSDC on Arb Sepolia</div>
                </div>
                <div className={comp.stat}>
                    <div className={comp.statLabel}>Vault Shares</div>
                    <div className={comp.statValue}>{formatPretty(vaultBal)}</div>
                    <div className={comp.statSub}>vdUSDC ERC-4626</div>
                </div>
            </div>

            <section className={comp.section}>
                <header className={comp.sectionHeader}>
                    <h2 className={comp.sectionTitle}>
                        AMM <em>pool reserves</em>
                    </h2>
                    <AddressChip address={ADDRESSES.amm} label="pair" />
                </header>
                <div className={comp.statRow}>
                    <div className={comp.stat}>
                        <div className={comp.statLabel}>Reserve · dUSDC</div>
                        <div className={comp.statValue}>{formatPretty(usdcReserve)}</div>
                        <div className={comp.statSub}>Constant-product x·y=k</div>
                    </div>
                    <div className={comp.stat}>
                        <div className={comp.statLabel}>Reserve · dWETH</div>
                        <div className={comp.statValue}>{formatPretty(wethReserve, 18, 4)}</div>
                        <div className={comp.statSub}>0.3% pool fee</div>
                    </div>
                    <div className={comp.stat}>
                        <div className={comp.statLabel}>Mid Price</div>
                        <div className={comp.statValue}>
                            {usdcReserve && wethReserve
                                ? formatPretty((usdcReserve * 10n ** 18n) / wethReserve, 18, 0)
                                : "—"}
                            <span className={comp.statUnit}>dUSDC / dWETH</span>
                        </div>
                        <div className={comp.statSub}>Spot, no slippage</div>
                    </div>
                </div>
            </section>

            <section className={comp.section}>
                <header className={comp.sectionHeader}>
                    <h2 className={comp.sectionTitle}>
                        Protocol <em>topology</em>
                    </h2>
                    <span className="eyebrow">12 contracts</span>
                </header>
                <div className={comp.aside}>
                    {Object.entries({
                        "Governance Token": ADDRESSES.govToken,
                        "Governor": ADDRESSES.governor,
                        "Timelock (2-day delay)": ADDRESSES.timelock,
                        "Treasury Proxy (UUPS)": ADDRESSES.treasury,
                        "Price Oracle (Chainlink)": ADDRESSES.oracle,
                        "Vault Factory": ADDRESSES.factory,
                        "Vault — vdUSDC": ADDRESSES.vault,
                        "AMM — dUSDC/dWETH": ADDRESSES.amm,
                    }).map(([k, v]) => (
                        <div key={k} className={comp.asideRow}>
                            <span className={comp.asideKey}>{k}</span>
                            <AddressChip address={v} />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
