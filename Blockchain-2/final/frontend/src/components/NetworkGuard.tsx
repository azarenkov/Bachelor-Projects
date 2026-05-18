import { ReactNode } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SUPPORTED_CHAIN_ID } from "../config/wagmi";
import layout from "../styles/layout.module.css";
import comp from "../styles/components.module.css";

export function NetworkGuard({ children }: { children: ReactNode }) {
    const { isConnected, chain } = useAccount();
    const { switchChain, isPending } = useSwitchChain();

    if (!isConnected) {
        return (
            <div className={layout.guard}>
                <h2 className={layout.guardTitle}>
                    A connected wallet <em style={{ fontStyle: "italic" }}>required</em>
                </h2>
                <p className={layout.guardBody}>
                    All read flows pull on-chain state from the Arbitrum Sepolia RPC. Connect a wallet to
                    proceed.
                </p>
                <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                        <button className={`${comp.btn} ${comp.btnPrimary}`} onClick={openConnectModal}>
                            Connect Wallet
                        </button>
                    )}
                </ConnectButton.Custom>
            </div>
        );
    }

    if (chain && chain.id !== SUPPORTED_CHAIN_ID) {
        return (
            <div className={layout.guard}>
                <h2 className={layout.guardTitle}>
                    Wrong <em style={{ fontStyle: "italic" }}>network</em>
                </h2>
                <p className={layout.guardBody}>
                    You're on <b>{chain.name}</b>, but this protocol runs on Arbitrum Sepolia (chain id{" "}
                    {SUPPORTED_CHAIN_ID}).
                </p>
                <button
                    className={`${comp.btn} ${comp.btnPrimary}`}
                    onClick={() => switchChain({ chainId: SUPPORTED_CHAIN_ID })}
                    disabled={isPending}
                >
                    {isPending ? "Switching…" : "Switch to Arbitrum Sepolia"}
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
