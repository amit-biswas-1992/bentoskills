import { ReactNode } from "react";
import { theme } from "../theme";

export const BrowserChrome: React.FC<{
  url: string;
  children: ReactNode;
  style?: React.CSSProperties;
}> = ({ url, children, style }) => {
  return (
    <div
      style={{
        width: 1120,
        borderRadius: 20,
        border: `1px solid ${theme.border}`,
        background: "#0b0b0e",
        overflow: "hidden",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        ...style,
      }}
    >
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 16px",
          borderBottom: `1px solid ${theme.border}`,
          background: "#101014",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ff5f57" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#febc2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#28c840" }} />
        </div>
        <div
          style={{
            marginLeft: 16,
            flex: 1,
            height: 26,
            borderRadius: 6,
            background: theme.muted,
            border: `1px solid ${theme.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            color: theme.mutedFg,
            fontSize: 12,
            fontFamily: theme.fontMono,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ padding: 28 }}>{children}</div>
    </div>
  );
};
