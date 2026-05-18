import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrumSepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
    appName: "Protocol",
    // Fill in your WalletConnect projectId from https://cloud.walletconnect.com .
    projectId: import.meta.env.VITE_WC_PROJECT_ID ?? "00000000000000000000000000000000",
    chains: [arbitrumSepolia],
    ssr: false,
});

export const SUPPORTED_CHAIN_ID = arbitrumSepolia.id;
