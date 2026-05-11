const fs = require("fs");
const path = require("path");

const slices = [
  { label: "Team (vested 12mo)", value: 40, color: "#2563eb" },
  { label: "Treasury",           value: 30, color: "#16a34a" },
  { label: "Community Airdrop",  value: 20, color: "#f59e0b" },
  { label: "Liquidity",          value: 10, color: "#dc2626" },
];

const W = 600, H = 360, cx = 180, cy = 180, r = 130;

function polar(deg, rad) { const a = (deg - 90) * Math.PI / 180; return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]; }

function arc(startDeg, endDeg) {
  const [x1, y1] = polar(startDeg, r);
  const [x2, y2] = polar(endDeg, r);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

let cursor = 0;
const paths = slices.map((s) => {
  const start = cursor;
  cursor += (s.value / 100) * 360;
  const end = cursor;
  const mid = (start + end) / 2;
  const [lx, ly] = polar(mid, r * 0.65);
  return `<path d="${arc(start, end)}" fill="${s.color}" stroke="#0f172a" stroke-width="2"/>
          <text x="${lx}" y="${ly}" fill="white" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="middle" dominant-baseline="middle">${s.value}%</text>`;
});

let legendY = 70;
const legend = slices.map((s) => {
  const item = `
    <rect x="370" y="${legendY}" width="18" height="18" fill="${s.color}" rx="3"/>
    <text x="396" y="${legendY + 14}" fill="#e2e8f0" font-family="sans-serif" font-size="14">${s.label}</text>
  `;
  legendY += 32;
  return item;
});

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0f172a"/>
  <text x="${W / 2}" y="30" fill="#e2e8f0" font-family="sans-serif" font-size="18" font-weight="700" text-anchor="middle">GOV — Initial Token Distribution (1,000,000 GOV)</text>
  ${paths.join("\n  ")}
  ${legend.join("\n  ")}
</svg>`;

const out = path.join(__dirname, "..", "docs", "token-distribution.svg");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);
console.log("Wrote", out);
