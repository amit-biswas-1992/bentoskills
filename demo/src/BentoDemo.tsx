import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { GridBackground } from "./scenes/GridBackground";
import { LogoReveal } from "./scenes/LogoReveal";
import { BentoHome } from "./scenes/BentoHome";
import { SkillDetail } from "./scenes/SkillDetail";
import { CopyInstall } from "./scenes/CopyInstall";
import { Outro } from "./scenes/Outro";
import { Cursor } from "./scenes/Cursor";

// Scene timings (fps = 30)
// 0-3s  (0-90)     Logo reveal
// 3-7s  (90-210)   Bento home
// 7-10s (210-300)  Skill detail
// 10-13s (300-390) Copy install
// 13-15s (390-450) Outro

export const BentoDemo: React.FC = () => {
  useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        fontFamily: theme.fontSans,
        color: theme.fg,
      }}
    >
      <GridBackground />

      <Sequence from={0} durationInFrames={90}>
        <LogoReveal />
      </Sequence>

      <Sequence from={90} durationInFrames={120}>
        <BentoHome />
      </Sequence>

      <Sequence from={210} durationInFrames={90}>
        <SkillDetail />
      </Sequence>

      <Sequence from={300} durationInFrames={90}>
        <CopyInstall />
      </Sequence>

      <Sequence from={390} durationInFrames={60}>
        <Outro />
      </Sequence>

      {/* Cursor overlay runs across all scenes */}
      <Cursor />
    </AbsoluteFill>
  );
};
