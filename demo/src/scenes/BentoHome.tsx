import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, skills } from "../theme";
import { BrowserChrome } from "./BrowserChrome";

const Tile: React.FC<{
  index: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ index, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 8 + index * 6;
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, mass: 0.7 },
  });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [30, 0]);
  const scale = interpolate(s, [0, 1], [0.94, 1]);

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${theme.border}`,
        background: "#0d0d11",
        padding: 20,
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      fontSize: 10,
      padding: "4px 8px",
      borderRadius: 999,
      border: `1px solid ${theme.border}`,
      color: theme.mutedFg,
      textTransform: "lowercase",
      fontWeight: 500,
    }}
  >
    {children}
  </span>
);

const TagPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      fontSize: 10,
      padding: "3px 8px",
      borderRadius: 6,
      background: theme.muted,
      color: theme.mutedFg,
      fontFamily: theme.fontMono,
    }}
  >
    #{children}
  </span>
);

export const BentoHome: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const enterY = interpolate(enter, [0, 1], [30, 0]);

  const exit = interpolate(frame, [105, 120], [1, 0], { extrapolateLeft: "clamp" });

  const featured = skills[0];
  const others = skills.slice(1);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: enter * exit,
        transform: `translateY(${enterY}px)`,
      }}
    >
      <BrowserChrome url="bentoskills.sh">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gridTemplateRows: "170px 170px",
            gap: 14,
            height: 354,
          }}
        >
          {/* Featured large tile */}
          <Tile
            index={0}
            style={{
              gridColumn: "1 / span 2",
              gridRow: "1 / span 2",
              background:
                "linear-gradient(135deg, rgba(124,92,255,0.14), rgba(13,13,17,1) 60%)",
              borderColor: "rgba(124,92,255,0.4)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  color: theme.accent,
                  fontWeight: 600,
                }}
              >
                Featured
              </span>
              <Badge>{featured.category}</Badge>
            </div>
            <div
              style={{
                marginTop: 18,
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: -0.5,
                color: theme.fg,
              }}
            >
              {featured.name}
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 14,
                color: theme.mutedFg,
                maxWidth: 340,
                lineHeight: 1.5,
              }}
            >
              {featured.tagline}
            </div>
            <div style={{ marginTop: 18, display: "flex", gap: 6 }}>
              {featured.tags.map((t) => (
                <TagPill key={t}>{t}</TagPill>
              ))}
            </div>
            <div
              style={{
                marginTop: 22,
                display: "flex",
                gap: 16,
                fontSize: 11,
                color: theme.mutedFg,
              }}
            >
              <span>{featured.installs.toLocaleString()} installs</span>
              <span>{featured.favorites} favorites</span>
            </div>
          </Tile>

          {others.map((s, i) => (
            <Tile key={s.slug} index={i + 1}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.fg }}>
                  {s.name}
                </div>
                <Badge>{s.category}</Badge>
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: theme.mutedFg,
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {s.tagline}
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
                {s.tags.slice(0, 2).map((t) => (
                  <TagPill key={t}>{t}</TagPill>
                ))}
              </div>
              <div
                style={{
                  marginTop: 16,
                  fontSize: 10,
                  color: theme.mutedFg,
                }}
              >
                {s.installs.toLocaleString()} installs
              </div>
            </Tile>
          ))}
        </div>
      </BrowserChrome>
    </AbsoluteFill>
  );
};
