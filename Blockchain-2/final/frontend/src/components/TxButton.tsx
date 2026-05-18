import { ReactNode, useState } from "react";
import { BaseError } from "viem";
import comp from "../styles/components.module.css";

interface Props {
    label: string;
    onClick: () => Promise<unknown>;
    disabled?: boolean;
    block?: boolean;
    children?: ReactNode;
}

export function TxButton({ label, onClick, disabled, block }: Props) {
    const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
    const [error, setError] = useState<string | null>(null);

    async function handleClick() {
        setStatus("pending");
        setError(null);
        try {
            await onClick();
            setStatus("success");
        } catch (err) {
            setStatus("error");
            if (err instanceof BaseError) setError(err.shortMessage);
            else if (err instanceof Error) {
                setError(err.message.toLowerCase().includes("user rejected") ? "Transaction rejected in wallet" : err.message);
            } else setError("Unknown error");
        }
    }

    const cls = [comp.btn, comp.btnPrimary, block ? comp.btnBlock : ""].join(" ");

    return (
        <div>
            <button className={cls} onClick={handleClick} disabled={disabled || status === "pending"}>
                {status === "pending" ? "Submitting…" : label}
            </button>
            {status === "success" && <p className={`${comp.txStatus} ${comp.txStatusSuccess}`}>✓ Transaction confirmed</p>}
            {status === "error" && error && <p className={`${comp.txStatus} ${comp.txStatusError}`}>✗ {error}</p>}
        </div>
    );
}
