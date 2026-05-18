import { useState } from "react";
import comp from "../styles/components.module.css";

export function AddressChip({ address, label }: { address: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

    function copy() {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    }

    return (
        <span className={comp.address} onClick={copy} title={address}>
            {label ? `${label} ` : ""}
            {copied ? "copied" : short}
        </span>
    );
}
