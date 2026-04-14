import { interpolate, useCurrentFrame } from "remotion";

type Waypoint = { f: number; x: number; y: number; visible?: boolean };

// Global cursor path across the whole video (0-450 frames)
const waypoints: Waypoint[] = [
  // Logo reveal: hidden
  { f: 0, x: 640, y: 720, visible: false },
  { f: 85, x: 640, y: 720, visible: false },
  // Bento home (frame 90-210): cursor enters, moves onto Featured tile
  { f: 95, x: 200, y: 620, visible: true },
  { f: 150, x: 520, y: 340, visible: true },
  { f: 205, x: 520, y: 340, visible: true },
  // Skill detail (210-300): cursor moves to install block
  { f: 215, x: 520, y: 340, visible: true },
  { f: 260, x: 780, y: 420, visible: true },
  { f: 295, x: 780, y: 420, visible: true },
  // Copy install (300-390): move to copy button and click
  { f: 305, x: 780, y: 420, visible: true },
  { f: 335, x: 900, y: 420, visible: true },
  { f: 389, x: 900, y: 420, visible: true },
  // Outro: hide
  { f: 395, x: 900, y: 420, visible: false },
  { f: 450, x: 900, y: 420, visible: false },
];

const getPos = (frame: number) => {
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (frame >= a.f && frame <= b.f) {
      const x = interpolate(frame, [a.f, b.f], [a.x, b.x]);
      const y = interpolate(frame, [a.f, b.f], [a.y, b.y]);
      const visible = a.visible || b.visible;
      return { x, y, visible };
    }
  }
  const last = waypoints[waypoints.length - 1];
  return { x: last.x, y: last.y, visible: last.visible };
};

export const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  const { x, y, visible } = getPos(frame);

  if (!visible) return null;

  // Click pulse during copy action around frame 340
  const clickScale =
    frame >= 338 && frame <= 348
      ? 1 + Math.sin(((frame - 338) / 10) * Math.PI) * 0.6
      : 0;

  return (
    <>
      {clickScale > 0 && (
        <div
          style={{
            position: "absolute",
            left: x - 24,
            top: y - 24,
            width: 48,
            height: 48,
            borderRadius: 24,
            border: "2px solid #7C5CFF",
            opacity: 1 - (frame - 338) / 10,
            transform: `scale(${clickScale})`,
            pointerEvents: "none",
          }}
        />
      )}
      <svg
        width={28}
        height={28}
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: x,
          top: y,
          pointerEvents: "none",
          filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))",
        }}
      >
        <path
          d="M3 2 L3 20 L8 15 L11 21 L14 20 L11 14 L18 14 Z"
          fill="#ffffff"
          stroke="#0A0A0B"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};
