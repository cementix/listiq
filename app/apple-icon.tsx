import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 30% 20%, #1e1b4b 0%, #000 70%)",
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 36,
            background: "linear-gradient(135deg, #a78bfa 0%, #e879f9 50%, #38bdf8 100%)",
            color: "#0a0a0a",
            fontSize: 92,
            fontWeight: 800,
          }}
        >
          l
        </div>
      </div>
    ),
    size,
  );
}
