import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 18, mass: 0.6 } });
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const taglineOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [20, 40], [18, 0], { extrapolateRight: "clamp" });

  const exitOpacity = interpolate(frame, [75, 90], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 2,
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
        }}
      >
        <span
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -3,
            color: theme.fg,
          }}
        >
          bentoskills
        </span>
        <span
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -3,
            color: theme.accent,
          }}
        >
          .sh
        </span>
      </div>
      <div
        style={{
          marginTop: 28,
          fontSize: 24,
          color: theme.mutedFg,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontWeight: 400,
        }}
      >
        A marketplace for Claude Code UI/UX skills
      </div>
      <div
        style={{
          marginTop: 40,
          width: 120,
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
          opacity: taglineOpacity,
        }}
      />
    </AbsoluteFill>
  );
};
