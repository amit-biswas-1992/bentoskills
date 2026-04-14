import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, skills } from "../theme";
import { BrowserChrome } from "./BrowserChrome";

const skill = skills[0];

export const CopyInstall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [80, 90], [1, 0], { extrapolateLeft: "clamp" });

  // Click happens at frame ~40 (global ~340)
  const clickFrame = 40;
  const copied = frame >= clickFrame;

  // Toast slides in after click
  const toastSpring = spring({
    frame: frame - clickFrame - 2,
    fps,
    config: { damping: 18, mass: 0.6 },
  });
  const toastX = interpolate(toastSpring, [0, 1], [360, 0]);
  const toastOpacity = copied ? interpolate(toastSpring, [0, 1], [0, 1]) : 0;

  // Button flash
  const flashIntensity = copied
    ? interpolate(frame, [clickFrame, clickFrame + 8, clickFrame + 30], [0, 1, 0.3], {
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: enter * exit,
      }}
    >
      <BrowserChrome url={`bentoskills.sh/skills/${skill.slug}`}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 40,
            minHeight: 360,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 38,
                fontWeight: 600,
                letterSpacing: -1,
                margin: 0,
                color: theme.fg,
              }}
            >
              {skill.name}
            </h1>
            <p
              style={{
                marginTop: 10,
                fontSize: 16,
                color: theme.mutedFg,
                maxWidth: 560,
                lineHeight: 1.55,
              }}
            >
              {skill.tagline}
            </p>
            <div
              style={{
                marginTop: 28,
                padding: "18px 20px",
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                background: theme.muted,
                maxWidth: 560,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: theme.mutedFg,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 10,
                }}
              >
                Overview
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: theme.mutedFg,
                  lineHeight: 1.65,
                }}
              >
                Ask for opinionated feedback on any UI. Design Critique gives
                you structured, hierarchy-aware notes you can act on — scoped
                to the surface you care about.
              </div>
            </div>
          </div>

          <aside
            style={{
              padding: 20,
              borderRadius: 16,
              border: `1px solid ${theme.border}`,
              background: "#0d0d11",
              height: "fit-content",
              position: "relative",
            }}
          >
            <span
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${theme.border}`,
                color: theme.mutedFg,
                fontWeight: 500,
              }}
            >
              {skill.category}
            </span>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${copied ? theme.accent : theme.border}`,
                background: theme.muted,
                fontFamily: theme.fontMono,
                fontSize: 12,
                boxShadow: flashIntensity
                  ? `0 0 0 3px rgba(124,92,255,${0.25 * flashIntensity})`
                  : "none",
                transition: "all 0.2s",
              }}
            >
              <code
                style={{
                  color: theme.fg,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                npx bentoskills install {skill.slug}
              </code>
              <span
                style={{
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 6,
                  color: copied ? theme.accent : theme.mutedFg,
                  border: `1px solid ${copied ? theme.accent : theme.border}`,
                  fontWeight: copied ? 600 : 500,
                  background: copied ? "rgba(124,92,255,0.12)" : "transparent",
                }}
              >
                {copied ? "copied!" : "copy"}
              </span>
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 12,
              }}
            >
              <Row label="Version" value="1.0.0" />
              <Row label="Author" value={"alice"} />
              <Row label="Installs" value={skill.installs.toLocaleString()} />
              <Row label="Favorites" value={skill.favorites.toString()} />
            </div>
          </aside>
        </div>
      </BrowserChrome>

      {/* Toast */}
      <div
        style={{
          position: "absolute",
          right: 80,
          bottom: 80,
          padding: "14px 18px",
          borderRadius: 12,
          background: "#111116",
          border: `1px solid ${theme.accent}`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          transform: `translateX(${toastX}px)`,
          opacity: toastOpacity,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "rgba(124,92,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12 L10 17 L20 7"
              stroke={theme.accent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, color: theme.fg, fontWeight: 600 }}>
            Install command copied
          </div>
          <div style={{ fontSize: 11, color: theme.mutedFg, marginTop: 2 }}>
            Paste into your terminal to install
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <span style={{ color: theme.mutedFg }}>{label}</span>
    <span style={{ color: theme.fg }}>{value}</span>
  </div>
);
