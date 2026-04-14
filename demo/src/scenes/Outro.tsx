import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const titleSpring = spring({ frame, fps, config: { damping: 16, mass: 0.6 } });
  const y = interpolate(titleSpring, [0, 1], [20, 0]);

  const starSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, mass: 0.5 },
  });
  const starScale = interpolate(starSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeIn,
        background: "#0A0A0B",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 2,
          transform: `translateY(${y}px)`,
        }}
      >
        <span
          style={{
            fontSize: 60,
            fontWeight: 700,
            letterSpacing: -2,
            color: theme.fg,
          }}
        >
          bentoskills
        </span>
        <span
          style={{
            fontSize: 60,
            fontWeight: 700,
            letterSpacing: -2,
            color: theme.accent,
          }}
        >
          .sh
        </span>
      </div>

      <div
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 22px",
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          background: "#0d0d11",
          fontFamily: theme.fontMono,
          fontSize: 18,
          color: theme.fg,
        }}
      >
        <div style={{ transform: `scale(${starScale})` }}>
          <svg width={22} height={22} viewBox="0 0 24 24">
            <path
              d="M12 2 L14.6 8.6 L21.6 9.2 L16.2 13.8 L17.8 20.8 L12 17 L6.2 20.8 L7.8 13.8 L2.4 9.2 L9.4 8.6 Z"
              fill={theme.accent}
              stroke={theme.accent}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span>github.com/amit-biswas-1992/bentoskills</span>
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: 13,
          color: theme.mutedFg,
          letterSpacing: 0.5,
        }}
      >
        Star the repo and build better UIs with Claude Code
      </div>
    </AbsoluteFill>
  );
};
