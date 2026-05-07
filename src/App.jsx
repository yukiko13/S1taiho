import { useState, useEffect } from "react";

const STORAGE_KEY = "s1taiho-log";
const CYCLE_START_DATE = "2026-05-01";
const MEDICATION_DAYS = 14;
const BREAK_DAYS = 7;
const CYCLE_DAYS = MEDICATION_DAYS + BREAK_DAYS;
const MEAL_OPTIONS = ["多め", "普通", "少なめ", "食べられない"];

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

function getCycleStatus(dateStr) {
  const targetDate = new Date(dateStr + "T00:00:00");
  const startDate = new Date(CYCLE_START_DATE + "T00:00:00");
  const diffDays = Math.floor((targetDate - startDate) / 86400000);

  if (diffDays < 0) {
    return { phase: "before", label: "開始前" };
  }

  const dayInCycle = diffDays % CYCLE_DAYS;

  if (dayInCycle < MEDICATION_DAYS) {
    return {
      phase: "medication",
      dayNumber: dayInCycle + 1,
      label: "服薬期間",
    };
  }

  return {
    phase: "break",
    remainingDays: CYCLE_DAYS - dayInCycle,
    label: "休薬期間",
  };
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

  const updateTodayRecord = (field, value) => {
    const current = log[today] || {};
    const newLog = { ...log, [today]: { ...current, [field]: value } };
    save(newLog);
  };

  const todayData = log[today] || {};
  const morningDone = !!todayData.morning;
  const nightDone = !!todayData.night;
  const bothDone = morningDone && nightDone;

  const days = getLast14Days();
  const todayCycle = getCycleStatus(today);
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
        background: "#f5f7fa",
        fontFamily: "'Hiragino Sans','Yu Gothic',sans-serif",
        color: "#2d2d3a",
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
          borderBottom: "1px solid #e0e4ed",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          background: "#fff",
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#9096ab" }}>
          服薬記録
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#2d2d3a" }}>
          エスワンタイホウ
        </div>
        {streak > 0 && (
          <div
            style={{
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#eef3ff",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 12,
              color: "#4a6fd4",
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
          background: "#e8ecf5",
          borderRadius: 12,
          padding: 4,
          width: "calc(100% - 48px)",
          maxWidth: 400,
        }}
      >
        {["today", "history", "record"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 9,
              border: "none",
              background: view === v ? "#fff" : "transparent",
              color: view === v ? "#2d2d3a" : "#9096ab",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {v === "today" ? "今日" : v === "history" ? "履歴" : "記録"}
          </button>
        ))}
      </div>
      {view === "today" && (
        <div style={{ width: "100%", maxWidth: 400, padding: "24px 24px 0" }}>
          <div style={{ fontSize: 13, color: "#9096ab", marginBottom: 20 }}>
            {getJPDate(today)}（{getDayOfWeek(today)}）
          </div>
          <div
            style={{
              marginBottom: 14,
              fontSize: 12,
              color: todayCycle.phase === "medication" ? "#2a9060" : "#4a6fd4",
              background: todayCycle.phase === "medication" ? "#edfaf3" : "#eef3ff",
              border: `1px solid ${todayCycle.phase === "medication" ? "#b8e8d0" : "#ccd9f5"}`,
              borderRadius: 10,
              padding: "7px 10px",
              width: "fit-content",
            }}
          >
            {todayCycle.phase === "medication"
              ? `服薬${todayCycle.dayNumber}日目`
              : todayCycle.phase === "break"
                ? `休薬中（あと${todayCycle.remainingDays}日）`
                : "服薬開始前"}
          </div>
          <DoseCard
            label="朝食後"
            image="/morning.png"
            done={morningDone}
            flash={justTook === "morning"}
            onToggle={() => toggle(today, "morning")}
          />
          <div style={{ height: 12 }} />
          <DoseCard
            label="夕食後"
            image="/evening.png"
            done={nightDone}
            flash={justTook === "night"}
            onToggle={() => toggle(today, "night")}
          />
          {bothDone && (
            <div
              style={{
                marginTop: 24,
                background: "#fff",
                borderRadius: 16,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                border: "1px solid #b8e8d0",
                boxShadow: "0 2px 12px rgba(42,144,96,0.10)",
              }}
            >
              <img
                src="/happy.png"
                alt="完了"
                style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0 }}
              />
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#2a9060",
                    fontSize: 15,
                  }}
                >
                  今日の服薬完了！
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#7abfa0",
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
          <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 16 }}>
            過去14日間
          </div>
          {[...days].reverse().map((date) => {
            const d = log[date] || {};
            const m = !!d.morning;
            const n = !!d.night;
            const cycle = getCycleStatus(date);
            const temperature = d.temperature ?? "";
            const mealAmount = d.mealAmount ?? "";
            const note = (d.note ?? "").trim();
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
                  background: m && n ? "#edfaf3" : "#fff",
                  border: `1px solid ${m && n ? "#b8e8d0" : "#e0e4ed"}`,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: date === today ? "#4a6fd4" : "#5a5a70",
                      }}
                    >
                      {getJPDate(date)}
                    </div>
                    <div style={{ fontSize: 11, color: "#aab0c0" }}>
                      {getDayOfWeek(date)}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        background:
                          cycle.phase === "medication"
                            ? "#edfaf3"
                            : cycle.phase === "break"
                              ? "#eef3ff"
                              : "#f4f4f8",
                        color:
                          cycle.phase === "medication"
                            ? "#2a9060"
                            : cycle.phase === "break"
                              ? "#4a6fd4"
                              : "#9096ab",
                        padding: "2px 7px",
                        borderRadius: 10,
                        border: `1px solid ${cycle.phase === "medication" ? "#b8e8d0" : cycle.phase === "break" ? "#ccd9f5" : "#e0e4ed"}`,
                      }}
                    >
                      {cycle.label}
                    </span>
                    {date === today && (
                      <span
                        style={{
                          fontSize: 10,
                          background: "#eef3ff",
                          color: "#4a6fd4",
                          padding: "2px 7px",
                          borderRadius: 10,
                          border: "1px solid #ccd9f5",
                        }}
                      >
                        今日
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 10, color: "#9096ab" }}>
                      体温: {temperature !== "" ? `${temperature}℃` : "-"}
                    </div>
                    <div style={{ fontSize: 10, color: "#9096ab" }}>
                      食事: {mealAmount || "-"}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#b0b5c8", marginTop: -2 }}>
                    その他: {note || "-"}
                  </div>
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
      {view === "record" && (
        <div style={{ width: "100%", maxWidth: 400, padding: "24px 24px 0" }}>
          <div style={{ fontSize: 13, color: "#9096ab", marginBottom: 16 }}>
            {getJPDate(today)}（{getDayOfWeek(today)}）の記録
          </div>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e0e4ed",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 8 }}>
              体温
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="例: 36.8"
                value={todayData.temperature ?? ""}
                onChange={(e) => updateTodayRecord("temperature", e.target.value)}
                style={{
                  flex: 1,
                  background: "#f5f7fa",
                  border: "1px solid #e0e4ed",
                  borderRadius: 10,
                  color: "#2d2d3a",
                  padding: "10px 12px",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 13, color: "#9096ab" }}>℃</span>
            </div>

            <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 8 }}>
              食事の量
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {MEAL_OPTIONS.map((option) => {
                const selected = todayData.mealAmount === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateTodayRecord("mealAmount", option)}
                    style={{
                      border: `1px solid ${selected ? "#ccd9f5" : "#e0e4ed"}`,
                      borderRadius: 10,
                      padding: "10px 8px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: selected ? "#eef3ff" : "#f5f7fa",
                      color: selected ? "#4a6fd4" : "#9096ab",
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 8 }}>
              その他
            </div>
            <textarea
              placeholder="メモを入力"
              value={todayData.note ?? ""}
              onChange={(e) => updateTodayRecord("note", e.target.value)}
              rows={4}
              style={{
                width: "100%",
                resize: "vertical",
                background: "#f5f7fa",
                border: "1px solid #e0e4ed",
                borderRadius: 10,
                color: "#2d2d3a",
                padding: "10px 12px",
                fontSize: 13,
                lineHeight: 1.6,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DoseCard({ label, image, done, flash, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        padding: "20px",
        borderRadius: 18,
        border: `2px solid ${done ? "#b8e8d0" : "#e0e4ed"}`,
        background: done ? "#edfaf3" : "#fff",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        textAlign: "left",
        boxShadow: done ? "0 2px 10px rgba(42,144,96,0.08)" : "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: done ? "#d4f4e6" : "#f0f2f8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <img
          src={image}
          alt={label}
          style={{ width: 36, height: 36, objectFit: "contain" }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: done ? "#2a9060" : "#2d2d3a",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 12,
            color: done ? "#7abfa0" : "#aab0c0",
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
          border: `2px solid ${done ? "#2a9060" : "#d0d5e8"}`,
          background: done ? "#2a9060" : "transparent",
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
          background: done ? "#2a9060" : "#e0e4ed",
          border: `1px solid ${done ? "#6be0a0" : "#d0d5e8"}`,
        }}
      />
      <div style={{ fontSize: 9, color: "#aab0c0" }}>{label}</div>
    </div>
  );
}
