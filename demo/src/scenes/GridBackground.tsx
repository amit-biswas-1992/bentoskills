import { AbsoluteFill } from "remotion";
import { theme } from "../theme";

export const GridBackground: React.FC = () => {
  const cell = 48;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
        backgroundSize: `${cell}px ${cell}px`,
        opacity: 0.18,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(124,92,255,0.12), transparent 60%)",
        }}
      />
    </AbsoluteFill>
  );
};
