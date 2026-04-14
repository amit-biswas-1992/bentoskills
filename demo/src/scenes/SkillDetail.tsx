import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme, skills } from "../theme";
import { BrowserChrome } from "./BrowserChrome";

const skill = skills[0];

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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
    {children}
  </span>
);

const TagPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      fontSize: 11,
      padding: "4px 9px",
      borderRadius: 6,
      background: theme.muted,
      color: theme.mutedFg,
      fontFamily: theme.fontMono,
    }}
  >
    #{children}
  </span>
);

export const SkillDetail: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const enterY = interpolate(enter, [0, 1], [30, 0]);
  const exit = interpolate(frame, [80, 90], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: enter * exit,
        transform: `translateY(${enterY}px)`,
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
            }}
          >
            <Badge>{skill.category}</Badge>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                background: theme.muted,
                fontFamily: theme.fontMono,
                fontSize: 12,
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
                  color: theme.mutedFg,
                  border: `1px solid ${theme.border}`,
                }}
              >
                copy
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

            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {skill.tags.map((t) => (
                <TagPill key={t}>{t}</TagPill>
              ))}
            </div>
          </aside>
        </div>
      </BrowserChrome>
    </AbsoluteFill>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <span style={{ color: theme.mutedFg }}>{label}</span>
    <span style={{ color: theme.fg }}>{value}</span>
  </div>
);
