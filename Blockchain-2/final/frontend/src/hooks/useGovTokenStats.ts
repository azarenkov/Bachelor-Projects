import { useAccount, useReadContracts } from "wagmi";
import { erc20Abi, getAddress } from "viem";
import { ADDRESSES } from "../config/addresses";

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

export function useGovTokenStats() {
    const { address } = useAccount();
    const enabled = !!address;

    const { data, isLoading, error } = useReadContracts({
        contracts: enabled
            ? [
                  { address: ADDRESSES.govToken, abi: erc20Abi, functionName: "balanceOf", args: [getAddress(address!)] },
                  { address: ADDRESSES.govToken, abi: votesAbi, functionName: "getVotes", args: [getAddress(address!)] },
                  { address: ADDRESSES.govToken, abi: votesAbi, functionName: "delegates", args: [getAddress(address!)] },
              ]
            : [],
        query: { enabled },
    });

    return {
        balance: data?.[0]?.result as bigint | undefined,
        votes: data?.[1]?.result as bigint | undefined,
        delegate: data?.[2]?.result as `0x${string}` | undefined,
        isLoading,
        error: error?.message ?? null,
    };
}
