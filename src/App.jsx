import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

const STORAGE_KEY = "s1taiho-log";
const DEFAULT_CYCLE_START = "2026-05-01";
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

function getAllDaysSinceStart(cycleStart) {
  const days = [];
  const start = new Date(cycleStart + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(start);
  while (d <= today) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function getCycleStatus(dateStr, cycleStart) {
  const targetDate = new Date(dateStr + "T00:00:00");
  const startDate = new Date(cycleStart + "T00:00:00");
  const diffDays = Math.floor((targetDate - startDate) / 86400000);

  if (diffDays < 0) return { phase: "before", label: "開始前" };

  const dayInCycle = diffDays % CYCLE_DAYS;
  if (dayInCycle < MEDICATION_DAYS) {
    return { phase: "medication", dayNumber: dayInCycle + 1, label: "服薬期間" };
  }
  return { phase: "break", remainingDays: CYCLE_DAYS - dayInCycle, label: "休薬期間" };
}

// ─── Auth Screen ───────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const inputStyle = {
    width: "100%",
    background: "#f5f7fa",
    border: "1px solid #e0e4ed",
    borderRadius: 10,
    color: "#2d2d3a",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("確認メールを送りました。メールのリンクをクリックしてからログインしてください。");
        setMode("login");
        setLoading(false);
        return;
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        fontFamily: "'Hiragino Sans','Yu Gothic',sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
      }}
    >
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#9096ab", marginBottom: 6 }}>
          服薬記録
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#2d2d3a" }}>
          エスワンタイホウ
        </div>
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          borderRadius: 18,
          padding: 28,
          border: "1px solid #e0e4ed",
        }}
      >
        <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#e8ecf5", borderRadius: 10, padding: 3 }}>
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setMessage(""); }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#2d2d3a" : "#9096ab",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {m === "login" ? "ログイン" : "新規登録"}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 6 }}>メールアドレス</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 6 }}>パスワード</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>
          {error && (
            <div style={{ fontSize: 12, color: "#c0392b", background: "#fdf0ee", borderRadius: 8, padding: "8px 12px" }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ fontSize: 12, color: "#2a9060", background: "#edfaf3", borderRadius: 8, padding: "8px 12px" }}>
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "13px 0",
              borderRadius: 12,
              border: "none",
              background: loading ? "#b8e8d0" : "#2a9060",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              marginTop: 4,
            }}
          >
            {loading ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [log, setLog] = useState({});
  const [cycleStart, setCycleStart] = useState(DEFAULT_CYCLE_START);
  const [today] = useState(getTodayKey());
  const [view, setView] = useState("today");
  const [justTook, setJustTook] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [notifyMorning, setNotifyMorning] = useState("");
  const [notifyEvening, setNotifyEvening] = useState("");
  const logRef = useRef(log);

  // Auth listener — INITIAL_SESSION fires on mount with the persisted session (or null)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load data when session changes
  useEffect(() => {
    if (!session) {
      // Fall back to localStorage when logged out
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setLog(JSON.parse(saved));
      } catch {}
      setCycleStart(DEFAULT_CYCLE_START);
      return;
    }
    loadFromSupabase(session.user.id);
  }, [session]);

  const loadFromSupabase = async (userId) => {
    setSyncing(true);
    try {
      // Load settings
      const { data: settings } = await supabase
        .from("sltaiho_user_settings")
        .select("cycle_start_date,notify_morning,notify_evening")
        .eq("user_id", userId)
        .maybeSingle();
      if (settings?.cycle_start_date) setCycleStart(settings.cycle_start_date);
      if (settings?.notify_morning) setNotifyMorning(settings.notify_morning.slice(0, 5));
      if (settings?.notify_evening) setNotifyEvening(settings.notify_evening.slice(0, 5));

      // Load all logs
      const { data: logs } = await supabase
        .from("sltaiho_logs")
        .select("date,morning,night,temperature,meal_amount,note")
        .eq("user_id", userId);
      if (logs) {
        const mapped = {};
        for (const row of logs) {
          mapped[row.date] = {
            morning: row.morning,
            night: row.night,
            temperature: row.temperature ?? "",
            mealAmount: row.meal_amount ?? "",
            note: row.note ?? "",
          };
        }
        setLog(mapped);
      }
    } finally {
      setSyncing(false);
    }
  };

  const upsertLog = useCallback(async (date, data) => {
    if (!session) return;
    await supabase.from("sltaiho_logs").upsert({
      user_id: session.user.id,
      date,
      morning: data.morning ?? false,
      night: data.night ?? false,
      temperature: data.temperature !== "" ? data.temperature : null,
      meal_amount: data.mealAmount || null,
      note: data.note || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,date" });
  }, [session]);

  const saveLocal = (newLog) => {
    setLog(newLog);
    if (!session) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newLog)); } catch {}
    }
  };

  const toggle = async (date, slot) => {
    const current = log[date] || {};
    const newVal = !current[slot];
    const updated = { ...current, [slot]: newVal };
    const newLog = { ...log, [date]: updated };
    saveLocal(newLog);
    if (newVal) {
      setJustTook(slot);
      setTimeout(() => setJustTook(null), 1800);
    }
    await upsertLog(date, updated);
  };

  const updateTodayRecord = async (field, value) => {
    const current = log[today] || {};
    const updated = { ...current, [field]: value };
    const newLog = { ...log, [today]: updated };
    saveLocal(newLog);
    await upsertLog(today, updated);
  };

  // Keep logRef in sync so the notification interval can read latest log without stale closure
  useEffect(() => { logRef.current = log; }, [log]);

  const upsertSettings = useCallback(async (fields) => {
    if (!session) return;
    await supabase.from("sltaiho_user_settings").upsert(
      { user_id: session.user.id, updated_at: new Date().toISOString(), ...fields },
      { onConflict: "user_id" }
    );
  }, [session]);

  const saveCycleStart = async (dateStr) => {
    setCycleStart(dateStr);
    await upsertSettings({ cycle_start_date: dateStr });
  };

  const saveNotifyTimes = async (morning, evening) => {
    setNotifyMorning(morning);
    setNotifyEvening(evening);
    await upsertSettings({
      notify_morning: morning || null,
      notify_evening: evening || null,
    });
  };

  // Service Worker registration
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Notification scheduler — checks every minute
  useEffect(() => {
    if (!notifyMorning && !notifyEvening) return;

    const sendNotification = async (slot, title, body, icon) => {
      if (Notification.permission !== "granted") return;
      const todayLog = logRef.current[getTodayKey()] || {};
      if (todayLog[slot]) return; // already taken

      const reg = await navigator.serviceWorker?.ready.catch(() => null);
      if (reg) {
        reg.active?.postMessage({ type: "NOTIFY", title, body, icon, tag: slot });
      } else {
        new Notification(title, { body, icon });
      }
    };

    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (notifyMorning && hhmm === notifyMorning) {
        sendNotification("morning", "朝の服薬時間です", "朝食後にエスワンタイホウを飲みましょう", "/morning.png");
      }
      if (notifyEvening && hhmm === notifyEvening) {
        sendNotification("night", "夕の服薬時間です", "夕食後にエスワンタイホウを飲みましょう", "/evening.png");
      }
    };

    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [notifyMorning, notifyEvening]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLog({});
    setCycleStart(DEFAULT_CYCLE_START);
  };

  // Loading state
  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Hiragino Sans','Yu Gothic',sans-serif", color: "#9096ab" }}>
        読み込み中...
      </div>
    );
  }

  if (!session) return <AuthScreen onAuth={() => {}} />;

  const todayData = log[today] || {};
  const morningDone = !!todayData.morning;
  const nightDone = !!todayData.night;
  const bothDone = morningDone && nightDone;

  const days = getAllDaysSinceStart(cycleStart);
  const todayCycle = getCycleStatus(today, cycleStart);
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
      {/* Header */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#9096ab" }}>服薬記録</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#2d2d3a" }}>エスワンタイホウ</div>
          </div>
          <button
            onClick={handleSignOut}
            style={{ fontSize: 11, color: "#9096ab", background: "none", border: "1px solid #e0e4ed", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}
          >
            ログアウト
          </button>
        </div>
        {syncing && <div style={{ fontSize: 11, color: "#9096ab" }}>同期中...</div>}
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

      {/* Tab bar */}
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
        {["today", "schedule", "history", "record", "settings"].map((v) => (
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
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {v === "today" ? "今日" : v === "schedule" ? "予定" : v === "history" ? "履歴" : v === "record" ? "記録" : "設定"}
          </button>
        ))}
      </div>

      {/* Today tab */}
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
          {todayCycle.phase === "break" ? (
            <div
              style={{
                marginTop: 8,
                background: "#fff",
                borderRadius: 18,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                border: "1px solid #ccd9f5",
                boxShadow: "0 2px 12px rgba(74,111,212,0.08)",
              }}
            >
              <img src="/rest.png" alt="休薬中" style={{ width: 80, height: 80, objectFit: "contain" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: "#4a6fd4", fontSize: 18 }}>休薬中</div>
                <div style={{ fontSize: 13, color: "#9096ab", marginTop: 6 }}>
                  あと{todayCycle.remainingDays}日でお薬が再開します
                </div>
              </div>
            </div>
          ) : (
            <>
              <DoseCard label="朝食後" image="/morning.png" done={morningDone} onToggle={() => toggle(today, "morning")} />
              <div style={{ height: 12 }} />
              <DoseCard label="夕食後" image="/evening.png" done={nightDone} onToggle={() => toggle(today, "night")} />
            </>
          )}
          {justTook && !bothDone && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 24,
                  padding: "32px 40px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
                  border: "1px solid #b8e8d0",
                  animation: "popIn 0.2s ease",
                }}
              >
                <img src="/medicine.png" alt="服用" style={{ width: 80, height: 80, objectFit: "contain" }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, color: "#2a9060", fontSize: 17 }}>
                    {justTook === "morning" ? "朝の服薬" : "夕の服薬"}を記録しました
                  </div>
                  <div style={{ fontSize: 13, color: "#9096ab", marginTop: 4 }}>よくできました！</div>
                </div>
              </div>
            </div>
          )}
          {bothDone && todayCycle.phase !== "break" && (
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
              <img src="/happy.png" alt="完了" style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: "#2a9060", fontSize: 15 }}>今日の服薬完了！</div>
                <div style={{ fontSize: 12, color: "#7abfa0", marginTop: 2 }}>お疲れさまでした</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule tab */}
      {view === "schedule" && <ScheduleView today={today} cycleStart={cycleStart} />}

      {/* History tab */}
      {view === "history" && (
        <div style={{ width: "100%", maxWidth: 400, padding: "24px 24px 0" }}>
          <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 16 }}>
            {cycleStart}から（全{days.length}日）
          </div>
          {[...days].reverse().map((date) => {
            const d = log[date] || {};
            const m = !!d.morning;
            const n = !!d.night;
            const cycle = getCycleStatus(date, cycleStart);
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
                    <div style={{ fontSize: 13, color: date === today ? "#4a6fd4" : "#5a5a70" }}>
                      {getJPDate(date)}
                    </div>
                    <div style={{ fontSize: 11, color: "#aab0c0" }}>{getDayOfWeek(date)}</div>
                    <span
                      style={{
                        fontSize: 10,
                        background: cycle.phase === "medication" ? "#edfaf3" : cycle.phase === "break" ? "#eef3ff" : "#f4f4f8",
                        color: cycle.phase === "medication" ? "#2a9060" : cycle.phase === "break" ? "#4a6fd4" : "#9096ab",
                        padding: "2px 7px",
                        borderRadius: 10,
                        border: `1px solid ${cycle.phase === "medication" ? "#b8e8d0" : cycle.phase === "break" ? "#ccd9f5" : "#e0e4ed"}`,
                      }}
                    >
                      {cycle.label}
                    </span>
                    {date === today && (
                      <span style={{ fontSize: 10, background: "#eef3ff", color: "#4a6fd4", padding: "2px 7px", borderRadius: 10, border: "1px solid #ccd9f5" }}>
                        今日
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 10, color: "#9096ab" }}>体温: {temperature !== "" ? `${temperature}℃` : "-"}</div>
                    <div style={{ fontSize: 10, color: "#9096ab" }}>食事: {mealAmount || "-"}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#b0b5c8", marginTop: -2 }}>その他: {note || "-"}</div>
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

      {/* Record tab */}
      {view === "record" && (
        <div style={{ width: "100%", maxWidth: 400, padding: "24px 24px 0" }}>
          <div style={{ fontSize: 13, color: "#9096ab", marginBottom: 16 }}>
            {getJPDate(today)}（{getDayOfWeek(today)}）の記録
          </div>
          <div style={{ background: "#fff", border: "1px solid #e0e4ed", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 8 }}>体温</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="例: 36.8"
                value={todayData.temperature ?? ""}
                onChange={(e) => updateTodayRecord("temperature", e.target.value)}
                style={{ flex: 1, background: "#f5f7fa", border: "1px solid #e0e4ed", borderRadius: 10, color: "#2d2d3a", padding: "10px 12px", fontSize: 14, outline: "none" }}
              />
              <span style={{ fontSize: 13, color: "#9096ab" }}>℃</span>
            </div>
            <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 8 }}>食事の量</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 16 }}>
              {MEAL_OPTIONS.map((option) => {
                const selected = todayData.mealAmount === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateTodayRecord("mealAmount", option)}
                    style={{
                      border: `1px solid ${selected ? "#ccd9f5" : "#e0e4ed"}`,
                      borderRadius: 10, padding: "10px 8px", fontSize: 12, fontWeight: 600,
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
            <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 8 }}>その他</div>
            <textarea
              placeholder="メモを入力"
              value={todayData.note ?? ""}
              onChange={(e) => updateTodayRecord("note", e.target.value)}
              rows={4}
              style={{
                width: "100%", resize: "vertical",
                background: "#f5f7fa", border: "1px solid #e0e4ed", borderRadius: 10,
                color: "#2d2d3a", padding: "10px 12px", fontSize: 13, lineHeight: 1.6,
                boxSizing: "border-box", outline: "none",
              }}
            />
          </div>
        </div>
      )}

      {/* Settings tab */}
      {view === "settings" && (
        <SettingsView
          session={session}
          cycleStart={cycleStart}
          onSaveCycleStart={saveCycleStart}
          notifyMorning={notifyMorning}
          notifyEvening={notifyEvening}
          onSaveNotifyTimes={saveNotifyTimes}
        />
      )}
    </div>
  );
}

// ─── Settings View ─────────────────────────────────────────────────────────

function SettingsView({ session, cycleStart, onSaveCycleStart, notifyMorning, notifyEvening, onSaveNotifyTimes }) {
  const [dateInput, setDateInput] = useState(cycleStart);
  const [savedCycle, setSavedCycle] = useState(false);
  const [morningInput, setMorningInput] = useState(notifyMorning);
  const [eveningInput, setEveningInput] = useState(notifyEvening);
  const [savedNotify, setSavedNotify] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const handleSaveCycle = async () => {
    await onSaveCycleStart(dateInput);
    setSavedCycle(true);
    setTimeout(() => setSavedCycle(false), 2000);
  };

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const handleSaveNotify = async () => {
    await onSaveNotifyTimes(morningInput, eveningInput);
    setSavedNotify(true);
    setTimeout(() => setSavedNotify(false), 2000);
  };

  const inputStyle = {
    flex: 1,
    background: "#f5f7fa",
    border: "1px solid #e0e4ed",
    borderRadius: 10,
    color: "#2d2d3a",
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const permissionLabel = { granted: "許可済み ✓", denied: "拒否されています", default: "未設定", unsupported: "非対応" };
  const permissionColor = { granted: "#2a9060", denied: "#c0392b", default: "#9096ab", unsupported: "#9096ab" };

  return (
    <div style={{ width: "100%", maxWidth: 400, padding: "24px 24px 0" }}>
      {/* Account */}
      <div style={{ background: "#fff", border: "1px solid #e0e4ed", borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2d2d3a", marginBottom: 4 }}>アカウント</div>
        <div style={{ fontSize: 12, color: "#9096ab" }}>{session.user.email}</div>
      </div>

      {/* Cycle start date */}
      <div style={{ background: "#fff", border: "1px solid #e0e4ed", borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2d2d3a", marginBottom: 8 }}>服薬開始日</div>
        <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 8 }}>
          この日を起点に2週間服薬→1週間休薬のサイクルを計算します
        </div>
        <input
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          style={{ ...inputStyle, flex: "none", width: "100%", marginBottom: 12 }}
        />
        <button
          onClick={handleSaveCycle}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
            background: savedCycle ? "#b8e8d0" : "#2a9060",
            color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          {savedCycle ? "保存しました ✓" : "保存する"}
        </button>
      </div>

      {/* Notification settings */}
      <div style={{ background: "#fff", border: "1px solid #e0e4ed", borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2d2d3a", marginBottom: 4 }}>服薬リマインダー</div>
        <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 14 }}>
          服薬がまだの場合のみ通知します
        </div>

        {/* Permission status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#5a5a70" }}>
            通知許可：
            <span style={{ color: permissionColor[permission], fontWeight: 600 }}>
              {permissionLabel[permission]}
            </span>
          </div>
          {permission === "default" && (
            <button
              onClick={requestPermission}
              style={{
                fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid #ccd9f5",
                background: "#eef3ff", color: "#4a6fd4", cursor: "pointer", fontWeight: 600,
              }}
            >
              許可する
            </button>
          )}
        </div>

        {/* Morning time */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <img src="/morning.png" style={{ width: 16, height: 16, objectFit: "contain" }} alt="" />
            朝の通知時間
          </div>
          <input
            type="time"
            value={morningInput}
            onChange={(e) => setMorningInput(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Evening time */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#9096ab", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <img src="/evening.png" style={{ width: 16, height: 16, objectFit: "contain" }} alt="" />
            夕の通知時間
          </div>
          <input
            type="time"
            value={eveningInput}
            onChange={(e) => setEveningInput(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleSaveNotify}
          disabled={permission === "denied" || permission === "unsupported"}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
            background: permission === "denied" || permission === "unsupported"
              ? "#e0e4ed"
              : savedNotify ? "#b8e8d0" : "#2a9060",
            color: permission === "denied" || permission === "unsupported" ? "#9096ab" : "#fff",
            fontSize: 14, fontWeight: 700,
            cursor: permission === "denied" || permission === "unsupported" ? "default" : "pointer",
          }}
        >
          {permission === "denied" ? "通知が拒否されています" : savedNotify ? "保存しました ✓" : "通知時間を保存する"}
        </button>
        {permission === "denied" && (
          <div style={{ fontSize: 11, color: "#9096ab", marginTop: 8, textAlign: "center" }}>
            ブラウザの設定から通知を許可してください
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Schedule View ──────────────────────────────────────────────────────────

function ScheduleView({ today, cycleStart }) {
  const DOW = ["日", "月", "火", "水", "木", "金", "土"];

  const schedDays = [];
  const start = new Date(today + "T00:00:00");
  for (let i = 0; i <= 365; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    schedDays.push(d.toISOString().slice(0, 10));
  }
  const schedSet = new Set(schedDays);

  const byMonth = {};
  for (const dateStr of schedDays) {
    const key = dateStr.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(dateStr);
  }

  return (
    <div style={{ width: "100%", maxWidth: 400, padding: "24px 24px 0" }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, fontSize: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "#2a9060" }} />
          <span style={{ color: "#5a5a70" }}>服薬日</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "#c8ccd8" }} />
          <span style={{ color: "#5a5a70" }}>休薬日</span>
        </div>
      </div>
      {Object.entries(byMonth).map(([monthKey, dates]) => {
        const [year, month] = monthKey.split("-").map(Number);
        const firstDate = new Date(year, month - 1, 1);
        const startDow = firstDate.getDay();
        const lastDay = new Date(year, month, 0).getDate();

        const cells = [];
        for (let i = 0; i < startDow; i++) cells.push(null);
        for (let d = 1; d <= lastDay; d++) {
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          cells.push(dateStr);
        }

        return (
          <div key={monthKey} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2d2d3a", marginBottom: 12 }}>
              {year}年{month}月
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
              {DOW.map((d, i) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center", fontSize: 11, fontWeight: 600,
                    color: i === 0 ? "#e05050" : i === 6 ? "#4a6fd4" : "#9096ab",
                    paddingBottom: 4,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {cells.map((dateStr, idx) => {
                if (!dateStr) return <div key={`empty-${idx}`} />;
                const inRange = schedSet.has(dateStr);
                const cycle = getCycleStatus(dateStr, cycleStart);
                const isToday = dateStr === today;
                const isMed = cycle.phase === "medication";
                const isBreak = cycle.phase === "break";
                const dow = new Date(dateStr + "T00:00:00").getDay();
                const dayNum = parseInt(dateStr.slice(8), 10);

                let bg = "#f0f2f8";
                let color = "#c0c4d0";
                if (inRange) {
                  if (isMed) { bg = "#edfaf3"; color = "#2a9060"; }
                  else if (isBreak) { bg = "#e8eaf0"; color = "#8890a8"; }
                }
                if (!inRange) { bg = "transparent"; color = "#d0d4de"; }

                return (
                  <div
                    key={dateStr}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 8,
                      background: isToday ? (isMed ? "#2a9060" : "#7a88c0") : bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      gap: 2,
                      border: isToday ? "none" : inRange ? `1px solid ${isMed ? "#b8e8d0" : "#d8dae8"}` : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13, fontWeight: isToday ? 700 : 500,
                        color: isToday ? "#fff" : inRange ? (dow === 0 ? "#e05050" : dow === 6 ? "#4a6fd4" : color) : "#d0d4de",
                        lineHeight: 1,
                      }}
                    >
                      {dayNum}
                    </span>
                    {inRange && (
                      <span style={{ fontSize: 8, color: isToday ? "rgba(255,255,255,0.8)" : isMed ? "#7abfa0" : "#b0b4c8", lineHeight: 1 }}>
                        {isMed ? `服${cycle.dayNumber}` : "休"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DoseCard ───────────────────────────────────────────────────────────────

function DoseCard({ label, image, done, onToggle }) {
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
          width: 52, height: 52, borderRadius: 14,
          background: done ? "#d4f4e6" : "#f0f2f8",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, overflow: "hidden",
        }}
      >
        <img src={image} alt={label} style={{ width: 36, height: 36, objectFit: "contain" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: done ? "#2a9060" : "#2d2d3a" }}>{label}</div>
        <div style={{ fontSize: 12, color: done ? "#7abfa0" : "#aab0c0", marginTop: 3 }}>
          {done ? "服用済み ✓" : "タップして記録"}
        </div>
      </div>
      <div
        style={{
          width: 28, height: 28, borderRadius: 8,
          border: `2px solid ${done ? "#2a9060" : "#d0d5e8"}`,
          background: done ? "#2a9060" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "#fff", flexShrink: 0,
        }}
      >
        {done ? "✓" : ""}
      </div>
    </button>
  );
}

// ─── Dot ────────────────────────────────────────────────────────────────────

function Dot({ done, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div
        style={{
          width: 10, height: 10, borderRadius: "50%",
          background: done ? "#2a9060" : "#e0e4ed",
          border: `1px solid ${done ? "#6be0a0" : "#d0d5e8"}`,
        }}
      />
      <div style={{ fontSize: 9, color: "#aab0c0" }}>{label}</div>
    </div>
  );
}
