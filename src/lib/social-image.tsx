import "server-only";

import { ImageResponse } from "next/og";

export const socialImageSize = { width: 1200, height: 630 };

export function createSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          padding: "72px 82px",
          color: "#171717",
          background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 48%, #eff6ff 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: 180,
            background: "#ff5722",
            opacity: 0.1,
            right: -90,
            top: -110,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: 130,
            border: "42px solid rgba(37, 99, 235, 0.09)",
            right: 105,
            bottom: -125,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 860 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 34 }}>
            <div
              style={{
                width: 78,
                height: 78,
                borderRadius: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#ff5722",
                color: "white",
                fontSize: 42,
                fontWeight: 800,
                marginRight: 22,
              }}
            >
              R
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 44, lineHeight: 1, fontWeight: 800 }}>RoboEQ</span>
              <span style={{ marginTop: 8, fontSize: 18, letterSpacing: 3, color: "#6b7280" }}>
                HỌC QUA TRẢI NGHIỆM
              </span>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 62, lineHeight: 1.12, fontWeight: 800, letterSpacing: -2 }}>
            Khơi mở tư duy công nghệ cho trẻ
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 27, lineHeight: 1.4, color: "#4b5563" }}>
            Robot giáo dục, bộ kit STEM và đồ chơi tư duy được tuyển chọn cho từng độ tuổi.
          </div>
          <div style={{ display: "flex", marginTop: 40 }}>
            {["Robot giáo dục", "Bộ kit STEM", "Đồ chơi tư duy"].map((label, index) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 999,
                  padding: "12px 19px",
                  marginRight: index < 2 ? 12 : 0,
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid #e5e7eb",
                  color: "#374151",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    socialImageSize,
  );
}
