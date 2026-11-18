import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background: "linear-gradient(135deg, #a78bfa 0%, #e879f9 50%, #38bdf8 100%)",
          color: "#0a0a0a",
          fontSize: 44,
          fontWeight: 800,
        }}
      >
        l
      </div>
    ),
    size,
  );
}
