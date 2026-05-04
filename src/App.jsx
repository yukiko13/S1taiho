import { useState, useEffect } from "react";

const STORAGE_KEY = "s1taiho-log";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getJPDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function getDayOfWeek(dateStr) {
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return days[new Date(dateStr + "T00:00:00").getDay()];
}

function getLast14Days() {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function App() {
  const [log, setLog] = useState({});
  const [today] = useState(getTodayKey());
  const [view, setView] = useState("today");
  const [justTook, setJustTook] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLog(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (newLog) => {
    setLog(newLog);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLog));
    } catch {}
  };

  const toggle = (date, slot) => {
    const current = log[date] || {};
    const newVal = !current[slot];
    const newLog = { ...log, [date]: { ...current, [slot]: newVal } };
    save(newLog);
    if (newVal) {
      setJustTook(slot);
      setTimeout(() => setJustTook(null), 1800);
    }
  };

  const todayData = log[today] || {};
  const morningDone = !!todayData.morning;
  const nightDone = !!todayData.night;
  const bothDone = morningDone && nightDone;

  const days = getLast14Days();
  const streak = (() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      const d = days[i];
      const dd = log[d] || {};
      if (dd.morning && dd.night) s++;
      else break;
    }
    return s;
  })();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1117",
        fontFamily: "'Hiragino Sans','Yu Gothic',sans-serif",
        color: "#e8e6f0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 0 60px",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "32px 24px 20px",
          borderBottom: "1px solid #1e2030",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#7a7a9a" }}>
          服薬記録
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
          エスワンタイホウ
        </div>
        {streak > 0 && (
          <div
            style={{
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#1e2235",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 12,
              color: "#a0c4ff",
              width: "fit-content",
            }}
          >
            🔥 {streak}日連続で完了中
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          gap: 0,
          marginTop: 20,
          background: "#1a1c2a",
          borderRadius: 12,
          padding: 4,
          width: "calc(100% - 48px)",
          maxWidth: 400,
        }}
      >
        {["today", "history"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 9,
              border: "none",
              background: view === v ? "#2e3150" : "transparent",
              color: view === v ? "#fff" : "#606080",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {v === "today" ? "今日" : "履歴"}
          </button>
        ))}
      </div>
      {view === "today" && (
        <div style={{ width: "100%", maxWidth: 400, padding: "24px 24px 0" }}>
          <div style={{ fontSize: 13, color: "#606080", marginBottom: 20 }}>
            {getJPDate(today)}（{getDayOfWeek(today)}）
          </div>
          <DoseCard
            label="朝食後"
            icon="🌅"
            done={morningDone}
            flash={justTook === "morning"}
            onToggle={() => toggle(today, "morning")}
          />
          <div style={{ height: 12 }} />
          <DoseCard
            label="夕食後"
            icon="🌙"
            done={nightDone}
            flash={justTook === "night"}
            onToggle={() => toggle(today, "night")}
          />
          {bothDone && (
            <div
              style={{
                marginTop: 24,
                background: "linear-gradient(135deg,#1e3a2a,#152d22)",
                borderRadius: 16,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: "1px solid #2d6040",
              }}
            >
              <span style={{ fontSize: 28 }}>✓</span>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#6be0a0",
                    fontSize: 15,
                  }}
                >
                  今日の服薬完了！
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#4a7a60",
                    marginTop: 2,
                  }}
                >
                  お疲れさまでした
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {view === "history" && (
        <div style={{ width: "100%", maxWidth: 400, padding: "24px 24px 0" }}>
          <div style={{ fontSize: 12, color: "#606080", marginBottom: 16 }}>
            過去14日間
          </div>
          {[...days].reverse().map((date) => {
            const d = log[date] || {};
            const m = !!d.morning;
            const n = !!d.night;
            return (
              <div
                key={date}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 16px",
                  marginBottom: 6,
                  borderRadius: 12,
                  background: m && n ? "#152d22" : "#141620",
                  border: `1px solid ${m && n ? "#2d6040" : "#1a1a2a"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: date === today ? "#a0c4ff" : "#9090b0",
                    }}
                  >
                    {getJPDate(date)}
                  </div>
                  <div style={{ fontSize: 11, color: "#505065" }}>
                    {getDayOfWeek(date)}
                  </div>
                  {date === today && (
                    <span
                      style={{
                        fontSize: 10,
                        background: "#2e3150",
                        color: "#a0c4ff",
                        padding: "2px 7px",
                        borderRadius: 10,
                      }}
                    >
                      今日
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Dot done={m} label="朝" />
                  <Dot done={n} label="夕" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DoseCard({ label, icon, done, flash, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        padding: "20px",
        borderRadius: 18,
        border: `2px solid ${done ? "#2d6040" : "#252535"}`,
        background: done
          ? "linear-gradient(135deg,#162b1e,#111d17)"
          : "#141620",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: done ? "#1e4030" : "#1a1c2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: done ? "#6be0a0" : "#c0c0d8",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 12,
            color: done ? "#4a9060" : "#505065",
            marginTop: 3,
          }}
        >
          {done ? "服用済み ✓" : "タップして記録"}
        </div>
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: `2px solid ${done ? "#3a8060" : "#303050"}`,
          background: done ? "#3a8060" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {done ? "✓" : ""}
      </div>
    </button>
  );
}

function Dot({ done, label }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: done ? "#4a9060" : "#2a2a3a",
          border: `1px solid ${done ? "#6be0a0" : "#353545"}`,
        }}
      />
      <div style={{ fontSize: 9, color: "#404055" }}>{label}</div>
    </div>
  );
}
