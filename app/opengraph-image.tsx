import { ImageResponse } from "next/og";

export const alt = "Listiq — everything you watch, read and play, in one library";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MEDIA = ["Movies", "Series", "Anime", "Manga", "Games", "Books", "Comics"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background:
            "radial-gradient(circle at 15% 0%, rgba(139,92,246,0.55) 0%, transparent 45%), radial-gradient(circle at 100% 100%, rgba(56,189,248,0.35) 0%, transparent 45%), #050507",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              background: "linear-gradient(135deg, #a78bfa 0%, #e879f9 50%, #38bdf8 100%)",
              color: "#0a0a0a",
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            l
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>listiq</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 86, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 }}>Everything you watch,</div>
          <div style={{ fontSize: 86, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, color: "#d8b4fe" }}>read &amp; play.</div>
          <div style={{ marginTop: 28, fontSize: 30, color: "rgba(255,255,255,0.6)" }}>
            Track, rate and review in one beautiful library. Try the live demo — no signup.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {MEDIA.map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                fontSize: 24,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
