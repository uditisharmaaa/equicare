import React, { useEffect, useRef, useState } from "react";
// import { supabase } from "../lib/supabase"; // if/when you wire Supabase
import { Link } from "react-router-dom"; // 👈 add this at top with other imports

export default function UserPage() {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState("en-US");
  const [doctor, setDoctor] = useState("Dr. Alice Smith");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let interimAcc = "", finalAcc = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalAcc += res[0].transcript;
        else interimAcc += res[0].transcript;
      }
      if (finalAcc) {
        setTranscript((prev) => smartJoin(prev, finalAcc));
        setInterim("");
      } else setInterim(interimAcc);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    return () => { try { rec.abort(); } catch {} recognitionRef.current = null; };
  }, [lang]);

  function start() {
    if (!recognitionRef.current) return;
    setInterim("");
    try { recognitionRef.current.lang = lang; recognitionRef.current.start(); setListening(true); } catch {}
  }
  function stop() {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setListening(false);
  }
  function clearAll() { setTranscript(""); setInterim(""); }
  function copyToClipboard() { navigator.clipboard.writeText(transcript.trim()).catch(console.error); }
  function saveTxt() {
    const blob = new Blob([transcript.trim()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `transcript-${Date.now()}.txt`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function submitToHospital() {
    if (!transcript.trim()) return;
    // TODO: replace with Supabase/Edge Function call
    alert(`Submitted transcript to hospital for ${doctor}`);
    console.log({ doctor, transcript: transcript.trim() });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 px-4">
      <div className="w-full max-w-3xl p-8 rounded-2xl border border-blue-100 bg-white shadow-lg">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-blue-700">EquiCare — Patient Submission</h1>
            <StatusBadge listening={listening} supported={supported} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-blue-600" htmlFor="lang">Language</label>
            <select
              id="lang"
              className="bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-sm text-gray-700"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              disabled={listening}
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="fr-FR">Français</option>
              <option value="es-ES">Español</option>
              <option value="de-DE">Deutsch</option>
              <option value="hi-IN">हिन्दी</option>
            </select>
          </div>
        </header>

        <div className="mb-6 flex justify-end">
            <Link
                to="/profile"
                className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
            >
                👤 My Profile
            </Link>
        </div>

        {!supported ? (
          <p className="text-sm text-red-500">Speech recognition not supported. Try Chrome on desktop.</p>
        ) : (
          <>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-blue-600" htmlFor="doctor">Select Doctor</label>
              <select
                id="doctor"
                className="w-full bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-gray-700"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              >
                <option>Dr. Alice Smith</option>
                <option>Dr. John Doe</option>
                <option>Dr. Emily Johnson</option>
                <option>Dr. Michael Lee</option>
                <option>Dr. Priya Patel</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={start} disabled={listening}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40">
                🎙️ Start
              </button>
              <button onClick={stop} disabled={!listening}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-40">
                ■ Stop
              </button>
              <button onClick={saveTxt} disabled={!transcript.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40">
                ⬇ Save .txt
              </button>
              <button onClick={copyToClipboard} disabled={!transcript.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40">
                📋 Copy
              </button>
              <button onClick={clearAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200">
                🗑 Clear
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <label className="text-sm font-medium text-blue-600">Transcript</label>
              <textarea
                className="w-full min-h-[280px] rounded-xl border border-blue-200 bg-blue-50 p-4 leading-7 text-gray-800"
                value={composeLive(transcript, interim)}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Press Start and speak… your words will appear here."
              />
              {interim && <p className="text-xs text-gray-400">Listening…</p>}
            </div>

            <div className="mt-6">
              <button
                onClick={submitToHospital}
                disabled={!transcript.trim()}
                className="w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-40 transition"
              >
                🚑 Submit to hospital
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ listening, supported }) {
  if (!supported) return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
      <span className="text-gray-500">unsupported</span>
    </span>
  );
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
      listening ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
    }`}>
      {listening ? "● Listening" : "Idle"}
    </span>
  );
}

// helpers
function smartJoin(prev, next) {
  const a = (prev || "").trimEnd();
  const b = (next || "").trim();
  if (!a) return capitalize(b) + " ";
  const needsSpace = !a.endsWith(" ") && !".,!?".includes(b[0] || "");
  return a + (needsSpace ? " " : "") + b + " ";
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function composeLive(finalText, interimText) { return (finalText || "") + (interimText ? interimText : ""); }
