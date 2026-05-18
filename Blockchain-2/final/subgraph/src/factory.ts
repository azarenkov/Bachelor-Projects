import { VaultDeployed } from "../generated/VaultFactory/VaultFactory";
import { Vault } from "../generated/schema";

export function handleVaultDeployed(event: VaultDeployed): void {
    const vault = new Vault(event.params.vault);
    vault.asset = event.params.asset;
    vault.deployer = event.params.deployer;
    vault.deterministic = event.params.deterministic;
    vault.salt = event.params.salt;
    vault.createdAt = event.block.timestamp;
    vault.save();
}
