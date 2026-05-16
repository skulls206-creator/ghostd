import { cn } from "@/lib/utils";

const COIN_COLORS: Record<string, [string, string]> = {
  btc: ["#F7931A", "#E8850F"],
  eth: ["#627EEA", "#4A67D2"],
  crp: ["#06B6D4", "#0891B2"],
  usdt: ["#26A17B", "#1E8A68"],
  ltc: ["#BFBBBB", "#A0A0A0"],
  xmr: ["#FF6600", "#E05800"],
  trx: ["#FF0013", "#CC000F"],
  dash: ["#008CE7", "#006DBF"],
  xrp: ["#23292F", "#4A5568"],
  bnb: ["#F3BA2F", "#D4A22A"],
  sol: ["#9945FF", "#14F195"],
  ada: ["#0033AD", "#0047E0"],
  dot: ["#E6007A", "#C40067"],
  doge: ["#C3A634", "#A38D2C"],
  avax: ["#E84142", "#CC3838"],
  matic: ["#8247E5", "#6B3CC4"],
  link: ["#2A5ADA", "#1E4BC0"],
  uni: ["#FF007A", "#D40066"],
  atom: ["#2E3148", "#6F7390"],
  near: ["#00EC97", "#00C47E"],
};

function getColors(coin: string): [string, string] {
  const key = coin.toLowerCase().replace(/[^a-z]/g, "");
  if (COIN_COLORS[key]) return COIN_COLORS[key]!;

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return [`hsl(${h}, 65%, 55%)`, `hsl(${(h + 20) % 360}, 60%, 45%)`];
}

interface CoinIconProps {
  coin: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "w-5 h-5 text-[8px]",
  md: "w-7 h-7 text-[10px]",
  lg: "w-9 h-9 text-xs",
};

export function CoinIcon({ coin, size = "md", className }: CoinIconProps) {
  const [from, to] = getColors(coin);
  const label = coin.toUpperCase().slice(0, 3);

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold font-mono shrink-0 select-none",
        SIZES[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        color: "rgba(255,255,255,0.9)",
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      {label}
    </div>
  );
}
