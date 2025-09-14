// src/pages/UserPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* --- Minimal Supabase client (inline) --- */
import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/* Stable device-scoped user_id (no login) */
function getDeviceUserId() {
  let id = localStorage.getItem("equi_user_id");
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
    localStorage.setItem("equi_user_id", id);
  }
  return id;
}

/* Read the lightweight profile saved by ProfilePage (local-only) */
function readLocalProfile() {
  try {
    const raw = localStorage.getItem("equi_profile");
    if (!raw) return {};
    const p = JSON.parse(raw);
    return {
      patient_name: p?.name || p?.patient_name || null,
      age: p?.age !== "" && p?.age !== undefined ? Number(p.age) : null,
      gender: p?.gender || null,
      weight: p?.weight !== "" && p?.weight !== undefined ? Number(p.weight) : null,
      race: p?.race || null,
    };
  } catch {
    return {};
  }
}

export default function UserPage() {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState("en-US");

  // NEW: visit title ("cause") and user rating
  const [cause, setCause] = useState("");
  const [userRating, setUserRating] = useState(10);

  // Doctors: load from Supabase if available; otherwise show a static list
  const [doctors, setDoctors] = useState([
    { doctor_id: "", doctor_name: "Dr. Alice Smith" },
    { doctor_id: "", doctor_name: "Dr. John Doe" },
    { doctor_id: "", doctor_name: "Dr. Emily Johnson" },
    { doctor_id: "", doctor_name: "Dr. Michael Lee" },
    { doctor_id: "", doctor_name: "Dr. Priya Patel" },
  ]);
  const [doctorId, setDoctorId] = useState(localStorage.getItem("equi_doctor_id") || "");

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

  // Fetch doctors (optional, if table exists + RLS allows SELECT)
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("doctors")
        .select("doctor_id, doctor_name")
        .order("doctor_name", { ascending: true });

      if (!error && data?.length) {
        setDoctors(data);
        if (!doctorId) setDoctorId(data[0].doctor_id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // remember last chosen doctor
  useEffect(() => {
    localStorage.setItem("equi_doctor_id", doctorId || "");
  }, [doctorId]);

  function start() {
    if (!recognitionRef.current) return;
    setInterim("");
    try {
      recognitionRef.current.lang = lang;
      recognitionRef.current.start();
      setListening(true);
    } catch {}
  }
  function stop() {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setListening(false);
  }
  function clearAll() { setTranscript(""); setInterim(""); setCause(""); setUserRating(10); }
  function copyToClipboard() { navigator.clipboard.writeText(transcript.trim()).catch(console.error); }
  function saveTxt() {
    const blob = new Blob([transcript.trim()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `transcript-${Date.now()}.txt`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  async function submitToHospital() {
    const text = transcript.trim();
    if (!text) return;

    if (!supabase) {
      alert("Supabase not configured (.env). Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    const user_id = getDeviceUserId();

    // 1) Pull patient profile from local storage
    let { patient_name, age, gender, weight, race } = readLocalProfile();

    // 2) Upsert into users so the FK will pass (ONLY known columns, ONLY non-nulls)
    const userUpsert = { user_id };
    if (patient_name != null) userUpsert.patient_name = patient_name;
    if (age != null)          userUpsert.age = age;
    if (gender != null)       userUpsert.gender = gender;
    if (weight != null)       userUpsert.weight = weight;
    if (race != null)         userUpsert.race = race;

    const { error: upErr } = await supabase.from("users").upsert(userUpsert);
    if (upErr) {
      console.error("users upsert failed:", upErr);
      alert(upErr.message || "Users upsert blocked (check RLS on 'users').");
      return;
    }

    // 3) Fallback: if anything is still null, try reading back from users (optional)
    if (patient_name == null || age == null || gender == null || weight == null || race == null) {
      const { data } = await supabase
        .from("users")
        .select("patient_name, age, gender, weight, race")
        .eq("user_id", user_id)
        .maybeSingle();
      if (data) {
        if (patient_name == null) patient_name = data.patient_name ?? null;
        if (age == null)          age = data.age ?? null;
        if (gender == null)       gender = data.gender ?? null;
        if (weight == null)       weight = data.weight ?? null;
        if (race == null)         race = data.race ?? null;
      }
    }

    // 4) Doctor linkage (permit blank doctor_id if you don't have IDs yet)
    const selected = doctors.find(d => d.doctor_id === doctorId) || null;
    const doctor_name = selected?.doctor_name || null;

    // 5) Insert transcript — ONLY columns that exist in your schema
    // (Your 'transcripts' table shows these: user_id, doctor_id, age, user_rating, race, weight,
    //  gender, cause, transcript, doctor_name, patient_name, transcript_identifier, date, bias_rating)
    const payload = {
      user_id,
      doctor_id: doctorId || null,
      doctor_name,
      transcript: text,
    };

    if (patient_name != null) payload.patient_name = patient_name;
    if (age != null)          payload.age = age;
    if (gender != null)       payload.gender = gender;
    if (weight != null)       payload.weight = weight;
    if (race != null)         payload.race = race;

    // NEW: include cause + user_rating
    const causeClean = cause.trim();
    if (causeClean) payload.cause = causeClean;

    const ratingNum = Number(userRating);
    if (!Number.isNaN(ratingNum)) {
      payload.user_rating = Math.max(0, Math.min(10, ratingNum));
    }

    const { error: tErr } = await supabase.from("transcripts").insert(payload);
    if (tErr) {
      console.error("transcripts insert failed:", tErr);
      alert(tErr.message || "Insert blocked (check RLS on 'transcripts').");
      return;
    }

    alert("Submitted to hospital ✓");
    // Optionally clear inputs:
    // setTranscript(""); setInterim(""); setCause(""); setUserRating(10);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 px-4">
      <div className="w-full max-w-3xl p-8 rounded-2xl border border-blue-100 bg-white shadow-lg">
      <header className="mb-6 grid grid-cols-1 md:grid-cols-2 items-start gap-3">
        {/* left: title + status */}
        <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-blue-700">
            EquiCare — Patient Submission
            </h1>
            <StatusBadge listening={listening} supported={supported} />
        </div>

        {/* right: language + profile on one line, right-aligned */}
        <div className="flex items-center gap-3 justify-end">
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

            <Link
            to="/profile"
            className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
            >
            My Profile
            </Link>
        </div>
        </header>


        {!supported ? (
          <p className="text-sm text-red-500">Speech recognition not supported. Try Chrome on desktop.</p>
        ) : (
          <>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-blue-600" htmlFor="doctor">Select Doctor</label>
              <select
                id="doctor"
                className="w-full bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-gray-700"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                {doctors.map((d, i) => (
                  <option key={d.doctor_id || `local-${i}`} value={d.doctor_id || ""}>
                    {d.doctor_name}
                  </option>
                ))}
              </select>
            </div>

            {/* NEW: Title / Reason for visit */}
            <div className="mt-6 grid gap-2">
              <label htmlFor="cause" className="text-sm font-medium text-blue-600">
                Visit title / reason
              </label>
              <input
                id="cause"
                type="text"
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                placeholder="e.g., Migraine & nausea for 3 days"
                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-gray-800"
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={start} disabled={listening}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40">
                Start
              </button>
              <button onClick={stop} disabled={!listening}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-40">
                Stop
              </button>
              <button onClick={saveTxt} disabled={!transcript.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40">
                Save .txt
              </button>
              <button onClick={copyToClipboard} disabled={!transcript.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40">
                Copy
              </button>
              <button onClick={clearAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200">
                Clear
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

            {/* NEW: User rating 0–10 */}
            <div className="mt-6">
              <label htmlFor="rating" className="text-sm font-medium text-blue-600">
                Rate your visit (0–10)
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="rating"
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={userRating}
                  onChange={(e) => setUserRating(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <span className="w-10 text-right text-sm text-gray-700">{userRating}</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={submitToHospital}
                disabled={!transcript.trim()}
                className="w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-40 transition"
              >
                Submit to hospital
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

/* helpers */
function smartJoin(prev, next) {
  const a = (prev || "").trimEnd();
  const b = (next || "").trim();
  if (!a) return capitalize(b) + " ";
  const needsSpace = !a.endsWith(" ") && !".,!?".includes(b[0] || "");
  return a + (needsSpace ? " " : "") + b + " ";
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function composeLive(finalText, interimText) { return (finalText || "") + (interimText ? interimText : ""); }
