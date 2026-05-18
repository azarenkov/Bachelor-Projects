import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useBlockNumber } from "wagmi";
import { Dashboard } from "./pages/Dashboard";
import { Swap } from "./pages/Swap";
import { Vault } from "./pages/Vault";
import { Proposals } from "./pages/Proposals";
import { NetworkGuard } from "./components/NetworkGuard";
import layout from "./styles/layout.module.css";

function Header() {
    const { data: block } = useBlockNumber({ watch: true });
    return (
        <header className={layout.header}>
            <div className={layout.headerInner}>
                <Link to="/" className={layout.brand}>
                    <span className={layout.brandMark}>
                        Protocol<em>°</em>
                    </span>
                    <span className={layout.brandTag}>Arb · Sepolia</span>
                </Link>
                <nav className={layout.nav}>
                    {[
                        { to: "/", label: "Overview" },
                        { to: "/swap", label: "Swap" },
                        { to: "/vault", label: "Vault" },
                        { to: "/proposals", label: "Proposals" },
                    ].map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end
                            className={({ isActive }) =>
                                `${layout.navLink} ${isActive ? layout.navLinkActive : ""}`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>
                <div className={layout.headerRight}>
                    <span className={layout.liveBlock}>
                        <span className={layout.liveDot} />
                        BLOCK {block ? block.toString() : "—"}
                    </span>
                    <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
                </div>
            </div>
        </header>
    );
}

function Footer() {
    const loc = useLocation();
    return (
        <footer className={layout.footer}>
            <span>PROTOCOL.LABS · CAPSTONE · {new Date().getFullYear()}</span>
            <span>{loc.pathname.toUpperCase()}</span>
            <span>
                <a
                    href="https://sepolia.arbiscan.io/address/0xf3F1C682b47AfF5c16CcC709D36bCABcE411F908"
                    target="_blank"
                    rel="noreferrer"
                >
                    contracts on arbiscan ↗
                </a>
            </span>
        </footer>
    );
}

export function App() {
    return (
        <div className={layout.shell}>
            <Header />
            <main className={layout.main}>
                <NetworkGuard>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/swap" element={<Swap />} />
                        <Route path="/vault" element={<Vault />} />
                        <Route path="/proposals" element={<Proposals />} />
                    </Routes>
                </NetworkGuard>
            </main>
            <Footer />
        </div>
    );
}
