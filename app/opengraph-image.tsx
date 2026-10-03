import { ImageResponse } from "next/og";

export const alt =
  "RuFact — проверка русскоязычных текстов на признаки недостоверной информации";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const colors = {
  ink: "#102f50",
  inkDeep: "#082744",
  orange: "#cf4824",
  orangeSoft: "#efb080",
  paper: "#f7f2e9",
  paleBlue: "#dce9ef",
  green: "#457458",
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background:
            "linear-gradient(118deg, #fbfaf7 0%, #f6efe5 54%, #e8eef1 100%)",
          color: colors.ink,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -165,
            right: -110,
            display: "flex",
            width: 520,
            height: 520,
            borderRadius: 999,
            background:
              "linear-gradient(145deg, rgba(16,47,80,0.17), rgba(79,130,206,0.05))",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 155,
            bottom: -220,
            display: "flex",
            width: 520,
            height: 420,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(239,176,128,0.62), rgba(207,72,36,0.08))",
            transform: "rotate(-12deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            display: "flex",
            width: 14,
            height: "100%",
            background: colors.orange,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 735,
            height: "100%",
            padding: "58px 0 50px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                position: "relative",
                display: "flex",
                width: 60,
                height: 58,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 3,
                  top: 3,
                  display: "flex",
                  width: 26,
                  height: 48,
                  borderRadius: "72% 34% 68% 32%",
                  background: colors.inkDeep,
                  transform: "rotate(13deg)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 3,
                  bottom: 1,
                  display: "flex",
                  width: 27,
                  height: 45,
                  borderRadius: "38% 70% 35% 68%",
                  background: colors.orangeSoft,
                  transform: "rotate(20deg)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 45,
                fontWeight: 800,
                letterSpacing: -1.5,
              }}
            >
              RuFact
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: 8,
                padding: "10px 17px",
                border: "1px solid rgba(16,47,80,0.16)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.55)",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 1.8,
              }}
            >
              АНАЛИЗ ТЕКСТОВ
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 1.03,
                letterSpacing: -2.5,
              }}
            >
              <div style={{ display: "flex" }}>Проверяйте факты.</div>
              <div style={{ display: "flex", color: colors.orange }}>
                Читайте осознанно.
              </div>
            </div>
            <div
              style={{
                display: "flex",
                width: 650,
                marginTop: 24,
                color: "#526a80",
                fontSize: 25,
                lineHeight: 1.4,
              }}
            >
              Вероятностная оценка русскоязычных текстов с понятным объяснением
              результата.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {[
              ["ML", "модель"],
              ["AI", "второе мнение"],
              ["RU", "русский язык"],
            ].map(([mark, label]) => (
              <div
                key={mark}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "10px 15px 10px 11px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.68)",
                  border: "1px solid rgba(16,47,80,0.11)",
                  fontSize: 15,
                  fontWeight: 650,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 31,
                    height: 31,
                    borderRadius: 999,
                    background: mark === "AI" ? "#e9efe5" : colors.paleBlue,
                    color: mark === "AI" ? colors.green : colors.ink,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {mark}
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 70,
            top: 104,
            display: "flex",
            flexDirection: "column",
            width: 350,
            height: 420,
            padding: 27,
            border: "1px solid rgba(16,47,80,0.13)",
            borderRadius: 34,
            background: "rgba(255,255,255,0.76)",
            boxShadow: "0 28px 70px rgba(16,47,80,0.15)",
            transform: "rotate(2.5deg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 16,
              fontWeight: 750,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span
                style={{
                  display: "flex",
                  width: 11,
                  height: 11,
                  borderRadius: 999,
                  background: colors.orange,
                }}
              />
              Результат анализа
            </div>
            <span style={{ color: "#82909d", fontSize: 13 }}>RuFact</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 214,
              marginTop: 22,
              borderRadius: 24,
              background:
                "linear-gradient(135deg, rgba(207,72,36,0.12), rgba(239,176,128,0.22))",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 146,
                height: 146,
                border: `12px solid ${colors.orange}`,
                borderRadius: 999,
                background: "rgba(255,255,255,0.82)",
              }}
            >
              <span
                style={{
                  display: "flex",
                  color: colors.ink,
                  fontSize: 40,
                  fontWeight: 850,
                  lineHeight: 1,
                }}
              >
                ML
              </span>
              <span
                style={{
                  display: "flex",
                  marginTop: 8,
                  color: "#728394",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                вероятностно
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              marginTop: 20,
              padding: "15px 17px",
              borderRadius: 18,
              background: "#edf3f6",
              color: "#46647c",
              fontSize: 15,
              lineHeight: 1.35,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 11,
                background: "#cfe3eb",
                color: colors.ink,
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              i
            </span>
            Объясняет признаки, а не выносит окончательный вердикт
          </div>
        </div>
      </div>
    ),
    size,
  );
}
