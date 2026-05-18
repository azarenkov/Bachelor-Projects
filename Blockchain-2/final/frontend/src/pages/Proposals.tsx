import { useAccount, useWriteContract } from "wagmi";
import { useProposals } from "../hooks/useProposals";
import { ADDRESSES } from "../config/addresses";
import { TxButton } from "../components/TxButton";
import layout from "../styles/layout.module.css";
import comp from "../styles/components.module.css";

const governorAbi = [
    {
        type: "function",
        name: "castVote",
        stateMutability: "nonpayable",
        inputs: [
            { name: "proposalId", type: "uint256" },
            { name: "support", type: "uint8" },
        ],
        outputs: [{ type: "uint256" }],
    },
] as const;

function badgeClassFor(state: string) {
    const s = state.toLowerCase();
    if (s === "active" || s === "succeeded") return comp.badgeActive;
    if (s === "queued" || s === "pending") return comp.badgeWarning;
    if (s === "defeated" || s === "canceled" || s === "expired") return comp.badgeDanger;
    if (s === "executed") return comp.badgeInfo;
    return "";
}

export function Proposals() {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const { data, isLoading, error } = useProposals();

    return (
        <div className="fade-up">
            <header className={layout.pageHeader}>
                <div className={`eyebrow ${layout.pageEyebrow}`}>Governor · 1d delay · 1w voting · 4% quorum</div>
                <h1 className={layout.pageTitle}>
                    Live <em>proposals</em>
                </h1>
                <p className={layout.pageLede}>
                    Indexed via The Graph (Goldsky). Each proposal goes through Pending → Active → Succeeded
                    → Queued → Executed, with a 2-day timelock between approval and on-chain execution.
                </p>
            </header>

            {isLoading && (
                <div className={comp.empty}>
                    <span className="mono">Loading from the subgraph…</span>
                </div>
            )}

            {error && (
                <div className={comp.empty}>
                    <h3 className={comp.emptyTitle}>Subgraph unreachable</h3>
                    <p className="mono" style={{ color: "var(--status-danger)" }}>
                        {String(error)}
                    </p>
                </div>
            )}

            {!isLoading && !error && (!data || data.length === 0) && (
                <div className={comp.empty}>
                    <h3 className={comp.emptyTitle}>No proposals yet</h3>
                    <p>
                        Once a holder with ≥1% supply (1M PGOV) calls{" "}
                        <code className="mono">propose(...)</code> on the Governor, the proposal will be
                        indexed and appear here.
                    </p>
                </div>
            )}

            <div style={{ display: "grid", gap: 16 }}>
                {data?.map((p) => (
                    <article key={p.id} className={comp.proposal}>
                        <div className={comp.proposalTop}>
                            <div>
                                <div className={comp.proposalId}>
                                    PROPOSAL #{p.proposalId.slice(0, 10)}…
                                </div>
                                <h3 className={comp.proposalDesc}>{p.description || "Untitled proposal"}</h3>
                            </div>
                            <span className={`${comp.badge} ${badgeClassFor(p.state)}`}>{p.state}</span>
                        </div>
                        <div className={comp.voteBars}>
                            <div className={comp.voteBar}>
                                <div className={comp.voteBarLabel}>For</div>
                                <div className={comp.voteBarValue}>{p.forVotes}</div>
                            </div>
                            <div className={comp.voteBar}>
                                <div className={comp.voteBarLabel}>Against</div>
                                <div className={comp.voteBarValue}>{p.againstVotes}</div>
                            </div>
                            <div className={comp.voteBar}>
                                <div className={comp.voteBarLabel}>Abstain</div>
                                <div className={comp.voteBarValue}>{p.abstainVotes}</div>
                            </div>
                        </div>
                        <div className={comp.proposalActions}>
                            <TxButton
                                label="Vote For"
                                disabled={!address || p.executed || p.canceled || p.state.toLowerCase() !== "active"}
                                onClick={async () =>
                                    writeContractAsync({
                                        address: ADDRESSES.governor,
                                        abi: governorAbi,
                                        functionName: "castVote",
                                        args: [BigInt(p.proposalId), 1],
                                    })
                                }
                            />
                            <TxButton
                                label="Vote Against"
                                disabled={!address || p.executed || p.canceled || p.state.toLowerCase() !== "active"}
                                onClick={async () =>
                                    writeContractAsync({
                                        address: ADDRESSES.governor,
                                        abi: governorAbi,
                                        functionName: "castVote",
                                        args: [BigInt(p.proposalId), 0],
                                    })
                                }
                            />
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
