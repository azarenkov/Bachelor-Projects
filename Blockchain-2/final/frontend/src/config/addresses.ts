// Deployed addresses on Arbitrum Sepolia.
// Filled in after `forge script script/Deploy.s.sol --rpc-url arbitrum_sepolia --broadcast`.
// Source of truth: deployments/421614.json.

export const ADDRESSES = {
    govToken: "0xf3F1C682b47AfF5c16CcC709D36bCABcE411F908" as `0x${string}`,
    timelock: "0x1B83B63087fFcf0eAF69443A2e8Ee53Cda8517A2" as `0x${string}`,
    governor: "0xe4aD6080604EAA6b8eF30A61868dC48EBD71f732" as `0x${string}`,
    treasury: "0xeCFda998447D4b1545583CdABcf24A5E012902AD" as `0x${string}`,
    oracle: "0x997fc09AC5686d68Ac872D9561e4d3869010160B" as `0x${string}`,
    factory: "0x953FeC985064516279B9bA117048614fC24460CA" as `0x${string}`,
    amm: "0xD66bEaf12306c72d0Ef7b3a3Ee657CbECb9BdEe3" as `0x${string}`,
    vault: "0xEaDA38C8Ff73BFfE91e8a1be89f1fFBE626E2D18" as `0x${string}`,
    demoUsdc: "0xD17b9F08818E5E290c557727787b3337Bd381851" as `0x${string}`,
    demoWeth: "0xabD16093647b1519680065BdD8382A398a2D81b4" as `0x${string}`,
} as const;

export const SUBGRAPH_URL =
    import.meta.env.VITE_SUBGRAPH_URL ??
    "https://api.goldsky.com/api/public/project_cmpahaxnnajch01umfz5rhk3y/subgraphs/protocol-arb-sepolia/1.0.0/gn";
