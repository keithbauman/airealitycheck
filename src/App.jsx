import { useState, useEffect, useRef } from "react";

const QUESTIONS = [
  {
    id: 1,
    text: "Your most repetitive weekly task takes how long?",
    options: ["Under 30 min", "1–2 hours", "3–5 hours", "5+ hours"],
  },
  {
    id: 2,
    text: "How often do you use AI without someone else prompting you to?",
    options: ["Never", "Occasionally", "Several times a week", "It's built into how I work"],
  },
  {
    id: 3,
    text: "When you finish a project, what do you have?",
    options: ["Memories", "Rough notes", "A documented process", "A reusable system I can hand off or repeat"],
  },
  {
    id: 4,
    text: "When AI gives you a bad output, you:",
    options: ["Give up", "Rephrase and try again", "Have a structured iteration process", "Rarely get bad outputs — my prompts are dialed in"],
  },
  {
    id: 5,
    text: "Do you know how many hours/week you spend on tasks AI could handle?",
    options: ["No idea", "Vague sense", "Rough estimate", "Yes, and I track it"],
  },
  {
    id: 6,
    text: "Your current AI use is best described as:",
    options: ["I've tried it a few times", "I use it for specific things when I remember", "I reach for it proactively", "It's embedded in my workflows and runs without me"],
  },
  {
    id: 7,
    text: "When you learn a new AI capability, you:",
    options: ["Find it interesting", "Think about how I might use it", "Test it within a week", "Immediately map it to a current workflow"],
  },
  {
    id: 8,
    text: "How much of your AI use would survive if you got busy for two weeks?",
    options: ["None — I'd stop using it", "Some", "Most", "All of it — it runs whether I think about it or not"],
  },
  {
    id: 9,
    text: "The biggest thing stopping you from using AI more is:",
    options: ["Don't know where to start", "Not sure it applies to my work", "Time to set it up", "Nothing — I'm already building"],
  },
  {
    id: 10,
    text: "What best describes your ROI from AI so far?",
    options: ["Hard to tell", "Saves me some time", "Noticeably more output", "It's changed how my work operates"],
  },
];

const STAGES = [
  {
    label: "The Informed Bystander",
    range: [10, 17],
    tagline: "You're learning about the pool while other people are swimming laps.",
    action: "Pick one task you do every week. Spend 25 minutes this week testing whether AI can do a first draft of it.",
  },
  {
    label: "The Occasional Visitor",
    range: [18, 25],
    tagline: "You use AI like a vending machine — only when you're standing right in front of it.",
    action: "The task you're using AI for reactively — set it up as a saved prompt or template this week so it runs the same way every time.",
  },
  {
    label: "The Active Builder",
    range: [26, 33],
    tagline: "You're building real capability. The gap between you and Stage 4 is systems, not skill.",
    action: "Identify the one workflow that still requires you to start from scratch each time. That's your next system to build.",
  },
  {
    label: "The Systems Operator",
    range: [34, 40],
    tagline: "You're operating in a different category. Most people don't realize the gap is this wide.",
    action: "You already know what to do. The question is what you're building next.",
  },
];

const SALARY_RANGES = [
  { label: "$50k", value: 50000 },
  { label: "$75k", value: 75000 },
  { label: "$100k", value: 100000 },
  { label: "$125k", value: 125000 },
  { label: "$150k", value: 150000 },
  { label: "$200k+", value: 200000 },
];

function getStage(score) {
  for (let i = 0; i < STAGES.length; i++) {
    if (score >= STAGES[i].range[0] && score <= STAGES[i].range[1]) return i;
  }
  return 0;
}

function getTimeLeak(answers) {
  const q1 = answers[0] ?? 0;
  const q5 = answers[4] ?? 0;
  const hourMap = [0.5, 1.5, 4, 7];
  const awarenessMultiplier = [2.5, 2.0, 1.5, 1.0];
  const baseHours = hourMap[q1];
  const weekly = Math.round(baseHours * awarenessMultiplier[q5] * 10) / 10;
  const yearly = Math.round((weekly * 52) / 40 * 10) / 10;
  return { weekly, yearly };
}

function getDollarCost(weeklyHours, salary) {
  const hourlyRate = salary / 2080;
  return Math.round(weeklyHours * 52 * hourlyRate);
}

// --- Animated number ---
function AnimNum({ value, duration = 1200, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(id); }
      else setDisplay(Math.round(start * 10) / 10);
    }, 16);
    return () => clearInterval(id);
  }, [value, duration]);
  const formatted = value > 100 ? Math.round(display).toLocaleString("en-US") : display;
  return <>{prefix}{formatted}{suffix}</>;
}

// --- Fade-in wrapper ---
function FadeIn({ children, delay = 0, style = {} }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(18px)",
      transition: "opacity 0.6s ease, transform 0.6s ease",
      ...style,
    }}>
      {children}
    </div>
  );
}

// --- Week Comparison Visual ---
function WeekComparison({ stage, timeLeak }) {
  const totalWork = 40;
  const redHours = timeLeak.weekly;
  const yellowHours = Math.round(Math.max(0, Math.min(totalWork - redHours, (4 - stage) * 3)) * 10) / 10;
  const greenHours = Math.round((totalWork - redHours - yellowHours) * 10) / 10;
  const s4Green = Math.round((greenHours + redHours * 0.85 + yellowHours * 0.5) * 10) / 10;
  const s4Yellow = Math.round(Math.max(0, yellowHours * 0.5) * 10) / 10;
  const s4Recovered = Math.round((totalWork - s4Green - s4Yellow) * 10) / 10;

  const Bar = ({ color, label, hours, pattern }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <div style={{
        width: `${Math.max(4, (hours / totalWork) * 100)}%`,
        height: 28, borderRadius: 4,
        background: pattern || color,
        minWidth: 4, transition: "width 1s ease",
      }} />
      <span style={{ fontSize: 13, color: "#888", whiteSpace: "nowrap" }}>
        {label} <span style={{ color: "#ccc" }}>{hours}h</span>
      </span>
    </div>
  );

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
      background: "#141414", borderRadius: 12, padding: 20, marginTop: 20,
      border: "1px solid #1e1e1e",
    }}>
      <div>
        <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>Your Current Week</div>
        <Bar color="#ef4444" label="AI could handle" hours={redHours} />
        <Bar color="#eab308" label="AI could assist" hours={yellowHours} />
        <Bar color="#22c55e" label="Only you" hours={greenHours} />
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #222", fontSize: 13, color: "#888" }}>
          Hours on high-leverage work: <span style={{ color: "#fff", fontWeight: 600 }}>{greenHours}h/week</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>Stage 4's Week</div>
        <Bar color="transparent" label="Recovered" hours={s4Recovered} pattern="repeating-linear-gradient(135deg, #1a1a2e 0px, #1a1a2e 4px, #0f0f1a 4px, #0f0f1a 8px)" />
        <Bar color="#b8860b" label="AI-assisted" hours={s4Yellow} />
        <Bar color="#22c55e" label="Deep work" hours={s4Green} />
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #222", fontSize: 13, color: "#888" }}>
          Hours on high-leverage work: <span style={{ color: "#b8860b", fontWeight: 600 }}>{s4Green}h/week</span>
        </div>
      </div>
    </div>
  );
}

// --- Stage Progress Bar ---
function StageBar({ currentStage }) {
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 24, marginBottom: 8 }}>
      {STAGES.map((s, i) => (
        <div key={i} style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            height: 6, borderRadius: 3,
            background: i <= currentStage ? "#b8860b" : "#1e1e1e",
            transition: "background 0.5s ease",
            position: "relative",
          }}>
            {i === currentStage && (
              <div style={{
                position: "absolute", top: -3, right: -2,
                width: 12, height: 12, borderRadius: "50%",
                background: "#b8860b",
                boxShadow: "0 0 12px #b8860baa",
              }} />
            )}
          </div>
          <div style={{
            fontSize: 12, marginTop: 8,
            color: i === currentStage ? "#b8860b" : "#444",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 0.5,
          }}>
            Stage {i + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- #1: Dollar Cost Card ---
function DollarCostCard({ timeLeak }) {
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [showCost, setShowCost] = useState(false);
  const dollarCost = selectedSalary ? getDollarCost(timeLeak.weekly, selectedSalary) : 0;

  const handleSelect = (val) => {
    setSelectedSalary(val);
    setShowCost(false);
    setTimeout(() => setShowCost(true), 100);
  };

  return (
    <div style={{
      background: "#141414", borderRadius: 14, padding: 24, marginTop: 16,
      border: "1px solid #1e1e1e",
    }}>
      <div style={{
        fontSize: 13, textTransform: "uppercase", letterSpacing: 2,
        color: "#555", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace",
      }}>
        What That Costs You
      </div>
      <div style={{ fontSize: 14, color: "#888", marginBottom: 16, lineHeight: 1.5 }}>
        Select your approximate annual compensation to see what {timeLeak.weekly} lost hours/week actually costs.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {SALARY_RANGES.map((s) => (
          <button
            key={s.value}
            onClick={() => handleSelect(s.value)}
            style={{
              padding: "8px 16px", borderRadius: 6,
              border: `1px solid ${selectedSalary === s.value ? "#b8860b" : "#262626"}`,
              background: selectedSalary === s.value ? "#b8860b18" : "transparent",
              color: selectedSalary === s.value ? "#b8860b" : "#777",
              fontSize: 14, cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              transition: "all 0.2s ease",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      {showCost && selectedSalary && (
        <div style={{
          paddingTop: 20, borderTop: "1px solid #1e1e1e",
          animation: "fadeUp 0.5s ease forwards",
        }}>
          <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{
              fontSize: 48, fontWeight: 700, color: "#ef4444",
              fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
            }}>
              <AnimNum value={dollarCost} prefix="$" duration={1000} />
            </span>
            <span style={{ fontSize: 16, color: "#666" }}>/year</span>
          </div>
          <div style={{ fontSize: 14, color: "#888", marginTop: 10, lineHeight: 1.6 }}>
            That's the value of the time you're spending on work AI could handle — gone.
            Not in mistakes or bad hires. In hours you didn't realize you were losing.
          </div>
        </div>
      )}
    </div>
  );
}

// --- #7: Email Capture ---
function EmailCapture({ stageIdx }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);
  const valid = email.includes("@") && email.includes(".");

  const handleSubmit = () => {
    if (valid) {
      // In production: POST to your backend / email service / webhook
      console.log("Captured:", { email, stage: stageIdx + 1 });
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div style={{
        background: "#11100d", borderRadius: 14, padding: 28, marginTop: 24,
        border: "1px solid #2a2010", textAlign: "center",
      }}>
        <div style={{ fontSize: 28, marginBottom: 10, color: "#b8860b" }}>&#10003;</div>
        <div style={{ fontSize: 17, color: "#ccc", fontWeight: 600 }}>You're in.</div>
        <div style={{ fontSize: 14, color: "#777", marginTop: 8, lineHeight: 1.5 }}>
          Your Stage {stageIdx + 1} action plan hits your inbox shortly.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#11100d", borderRadius: 14, padding: 28, marginTop: 24,
      border: "1px solid #2a2010",
    }}>
      <div style={{
        fontSize: 13, textTransform: "uppercase", letterSpacing: 2,
        color: "#b8860b", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace",
      }}>
        Go Further
      </div>
      <div style={{ fontSize: 18, color: "#eee", fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>
        Get your Stage {stageIdx + 1} action plan — 5 days, one move per day.
      </div>
      <div style={{ fontSize: 14, color: "#777", marginBottom: 20, lineHeight: 1.5 }}>
        Specific to where you actually are. Not a newsletter. Not a course pitch.
        Five concrete actions calibrated to your score.
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          style={{
            flex: 1, minWidth: 200,
            padding: "14px 18px", borderRadius: 8,
            border: `1px solid ${focused ? "#b8860b" : "#262626"}`,
            background: "#0f0f0f", color: "#fff",
            fontSize: 15, fontFamily: "'DM Sans', sans-serif",
            outline: "none",
            transition: "border-color 0.2s ease",
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            padding: "14px 28px", borderRadius: 8,
            background: valid ? "#b8860b" : "#333",
            color: "#fff", border: "none",
            fontSize: 15, fontWeight: 600,
            cursor: valid ? "pointer" : "default",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s ease",
            opacity: valid ? 1 : 0.5,
          }}
        >
          Send It
        </button>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [screen, setScreen] = useState("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef(null);

  const handleAnswer = (idx) => {
    setSelected(idx);
    setTimeout(() => {
      const next = [...answers];
      next[current] = idx;
      setAnswers(next);
      setSelected(null);
      if (current < QUESTIONS.length - 1) setCurrent(current + 1);
      else setScreen("results");
    }, 350);
  };

  const score = answers.reduce((a, b) => a + (b + 1), 0);
  const stageIdx = getStage(score);
  const stage = STAGES[stageIdx];
  const timeLeak = getTimeLeak(answers);

  const reset = () => {
    setScreen("intro");
    setCurrent(0);
    setAnswers([]);
    setSelected(null);
    setCopied(false);
  };

  // --- #5: Challenge share text ---
  const shareText = `I'm losing ~${timeLeak.weekly} hrs/week to unused AI. Stage ${stageIdx + 1}: "${stage.label}." 10 questions, one number. What's yours?`;

  const copyResults = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const fontLink = (
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif&display=swap" rel="stylesheet" />
  );

  // ---- INTRO SCREEN ----
  if (screen === "intro") {
    return (
      <div style={{
        minHeight: "100vh", background: "#0f0f0f", color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: "'DM Sans', sans-serif",
      }}>
        {fontLink}
        <FadeIn>
          <div style={{
            fontSize: 16, textTransform: "uppercase", letterSpacing: 5,
            color: "#b8860b", marginBottom: 28, fontFamily: "'JetBrains Mono', monospace",
            textAlign: "center",
          }}>
            Reality Check
          </div>
        </FadeIn>
        <FadeIn delay={150}>
          <h1 style={{
            fontSize: "clamp(32px, 7vw, 56px)", fontWeight: 700, lineHeight: 1.1,
            textAlign: "center", maxWidth: 600, margin: 0,
            fontFamily: "'Instrument Serif', serif", letterSpacing: -1,
          }}>
            Money Lost to<br />
            <span style={{ color: "#b8860b" }}>Unused AI</span>
          </h1>
        </FadeIn>
        <FadeIn delay={300}>
          <p style={{
            color: "#999", fontSize: 17, maxWidth: 420, textAlign: "center",
            lineHeight: 1.6, marginTop: 20, marginBottom: 36,
          }}>
            10 questions. One number.
          </p>
        </FadeIn>
        <FadeIn delay={450}>
          <button
            onClick={() => setScreen("quiz")}
            style={{
              background: "#b8860b", color: "#fff", border: "none",
              padding: "14px 40px", borderRadius: 8, fontSize: 15,
              fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              boxShadow: "0 0 30px #b8860b20",
            }}
            onMouseEnter={e => { e.target.style.transform = "scale(1.04)"; e.target.style.boxShadow = "0 0 40px #b8860b40"; }}
            onMouseLeave={e => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "0 0 30px #b8860b20"; }}
          >
            Start Diagnostic
          </button>
        </FadeIn>
        <FadeIn delay={550}>
          <div style={{ fontSize: 15, color: "#888", marginTop: 48, fontFamily: "'JetBrains Mono', monospace" }}>
            Takes about 2 minutes
          </div>
        </FadeIn>
      </div>
    );
  }

  // ---- QUIZ SCREEN ----
  if (screen === "quiz") {
    const q = QUESTIONS[current];
    return (
      <div style={{
        minHeight: "100vh", background: "#0f0f0f", color: "#fff",
        display: "flex", flexDirection: "column",
        padding: 24, fontFamily: "'DM Sans', sans-serif",
      }}>
        {fontLink}
        <div style={{ maxWidth: 520, width: "100%", margin: "0 auto", marginBottom: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "#555", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
              {current + 1} / {QUESTIONS.length}
            </span>
          </div>
          <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2 }}>
            <div style={{
              height: "100%", borderRadius: 2, background: "#b8860b",
              width: `${((current + 1) / QUESTIONS.length) * 100}%`,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
        <div style={{ maxWidth: 520, width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
          <FadeIn key={current}>
            <h2 style={{
              fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 600, lineHeight: 1.35,
              marginBottom: 36, color: "#eee",
            }}>
              {q.text}
            </h2>
          </FadeIn>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.options.map((opt, i) => (
              <FadeIn key={`${current}-${i}`} delay={80 + i * 60}>
                <button
                  onClick={() => handleAnswer(i)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "16px 20px", borderRadius: 10,
                    border: `1px solid ${selected === i ? "#b8860b" : "#1e1e1e"}`,
                    background: selected === i ? "#b8860b15" : "#141414",
                    color: selected === i ? "#b8860b" : "#bbb",
                    fontSize: 15, lineHeight: 1.4, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => { if (selected === null) { e.target.style.borderColor = "#333"; e.target.style.color = "#fff"; }}}
                  onMouseLeave={e => { if (selected !== i) { e.target.style.borderColor = "#1e1e1e"; e.target.style.color = "#bbb"; }}}
                >
                  {opt}
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- RESULTS SCREEN ----
  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f0f", color: "#fff",
      padding: "32px 16px", fontFamily: "'DM Sans', sans-serif",
    }}>
      {fontLink}
      <div ref={resultsRef} style={{ maxWidth: 600, margin: "0 auto" }}>

        <FadeIn>
          <div style={{
            fontSize: 13, textTransform: "uppercase", letterSpacing: 4,
            color: "#b8860b", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace",
          }}>
            Your Reality Check
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <h1 style={{
            fontSize: "clamp(32px, 8vw, 52px)",
            fontWeight: 700, margin: 0, lineHeight: 1.1,
            fontFamily: "'Instrument Serif', serif",
          }}>
            {stage.label}
          </h1>
        </FadeIn>

        <FadeIn delay={200}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: 14, marginBottom: 20,
            background: "#141414", border: "1px solid #1e1e1e",
            borderRadius: 20, padding: "6px 14px",
          }}>
            <span style={{ fontSize: 13, color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>Score</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#b8860b", fontFamily: "'JetBrains Mono', monospace" }}>{score}/40</span>
          </div>
        </FadeIn>

        <FadeIn delay={300}>
          <p style={{
            fontSize: 17, color: "#888", lineHeight: 1.5,
            marginTop: 4, marginBottom: 0, fontStyle: "italic",
            borderLeft: "2px solid #b8860b", paddingLeft: 16,
          }}>
            {stage.tagline}
          </p>
        </FadeIn>

        <FadeIn delay={400}>
          <StageBar currentStage={stageIdx} />
          {stageIdx < 3 && (
            <div style={{
              textAlign: "center", fontSize: 13, color: "#555",
              fontFamily: "'JetBrains Mono', monospace", marginTop: 2,
            }}>
              {STAGES[3].range[0] - score} points to Stage 4
            </div>
          )}
        </FadeIn>

        {/* Time Leak */}
        <FadeIn delay={550}>
          <div style={{
            background: "#141414", borderRadius: 14, padding: 24, marginTop: 28,
            border: "1px solid #1e1e1e",
          }}>
            <div style={{
              fontSize: 13, textTransform: "uppercase", letterSpacing: 2,
              color: "#555", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace",
            }}>
              Your Time Leak
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{
                fontSize: 56, fontWeight: 700, color: "#b8860b",
                fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
              }}>
                <AnimNum value={timeLeak.weekly} />
              </span>
              <span style={{ fontSize: 16, color: "#666" }}>hrs/week</span>
            </div>
            <div style={{ fontSize: 14, color: "#666", marginTop: 6 }}>
              Estimated hours spent on tasks AI could handle
            </div>
            <div style={{
              fontSize: 14, color: "#ef4444", marginTop: 12,
              paddingTop: 12, borderTop: "1px solid #1e1e1e",
            }}>
              Over a year, that's approximately <span style={{ fontWeight: 600 }}>{timeLeak.yearly} work-weeks</span> of your life.
            </div>
          </div>
        </FadeIn>

        {/* #1: Dollar Cost */}
        <FadeIn delay={650}>
          <DollarCostCard timeLeak={timeLeak} />
        </FadeIn>

        {/* Week Comparison */}
        <FadeIn delay={750}>
          <WeekComparison stage={stageIdx} timeLeak={timeLeak} />
        </FadeIn>

        {/* The One Move */}
        <FadeIn delay={900}>
          <div style={{
            background: "#11100d", borderRadius: 14, padding: 24, marginTop: 24,
            border: "1px solid #2a2010",
          }}>
            <div style={{
              fontSize: 13, textTransform: "uppercase", letterSpacing: 2,
              color: "#b8860b", marginBottom: 14, fontFamily: "'JetBrains Mono', monospace",
            }}>
              Your One Move
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#ccc", margin: 0 }}>
              {stage.action}
            </p>
          </div>
        </FadeIn>

        {/* #7: Email Capture */}
        <FadeIn delay={1000}>
          <EmailCapture stageIdx={stageIdx} />
        </FadeIn>

        {/* #5: Challenge Share */}
        <FadeIn delay={1100}>
          <div style={{ marginTop: 28 }}>
            <div style={{
              background: "#141414", borderRadius: 10, padding: 16, marginBottom: 14,
              border: "1px solid #1e1e1e",
            }}>
              <div style={{
                fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5,
                color: "#555", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace",
              }}>
                Challenge Someone
              </div>
              <div style={{ fontSize: 14, color: "#999", lineHeight: 1.5, fontStyle: "italic" }}>
                "{shareText}"
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={copyResults}
                style={{
                  flex: 1, minWidth: 160,
                  padding: "14px 24px", borderRadius: 8,
                  background: copied ? "#22c55e" : "#b8860b",
                  color: "#fff", border: "none",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s ease",
                }}
              >
                {copied ? "Copied — now send it" : "Copy & Challenge Someone"}
              </button>
              <button
                onClick={reset}
                style={{
                  flex: 1, minWidth: 160,
                  padding: "14px 24px", borderRadius: 8,
                  background: "transparent",
                  color: "#666", border: "1px solid #222",
                  fontSize: 14, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { e.target.style.borderColor = "#444"; e.target.style.color = "#aaa"; }}
                onMouseLeave={e => { e.target.style.borderColor = "#222"; e.target.style.color = "#666"; }}
              >
                Retake
              </button>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={1200}>
          <div style={{
            textAlign: "center", fontSize: 13, color: "#444",
            marginTop: 48, paddingBottom: 24,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Money Lost to Unused AI — Reality Check
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
