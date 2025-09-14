import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";

export default function UserPage() {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState("en-US");
  
  // Database-related state
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [userTranscripts, setUserTranscripts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // For demo purposes - in production, you'd get this from authentication
  const DEMO_USER_ID = "user-1"; // Replace with actual authenticated user ID

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Load user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', DEMO_USER_ID)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw userError;
      }

      // Load all doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('doctor_id, doctor_name, average_rating')
        .order('doctor_name');

      if (doctorsError) throw doctorsError;

      // Load user transcripts
      const { data: transcriptsData, error: transcriptsError } = await supabase
        .from('transcripts')
        .select(`
          id,
          content,
          transcript_date,
          user_rating,
          bias_score,
          doctors!inner(doctor_name)
        `)
        .eq('user_id', DEMO_USER_ID)
        .order('transcript_date', { ascending: false })
        .limit(10);

      if (transcriptsError) throw transcriptsError;

      setUser(userData);
      setDoctors(doctorsData || []);
      setUserTranscripts(transcriptsData || []);
      
      // Set default doctor
      if (doctorsData && doctorsData.length > 0) {
        setSelectedDoctorId(userData?.doctor_id || doctorsData[0].doctor_id);
      }

    } catch (error) {
      console.error("Error loading data:", error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Speech recognition setup
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

  const start = () => {
    if (!recognitionRef.current) return;
    setInterim("");
    try { 
      recognitionRef.current.lang = lang; 
      recognitionRef.current.start(); 
      setListening(true); 
    } catch {}
  };

  const stop = () => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setListening(false);
  };

  const clearAll = () => { 
    setTranscript(""); 
    setInterim(""); 
    setSubmitSuccess("");
    setError("");
  };

  const submitToHospital = async () => {
    if (!transcript.trim() || !selectedDoctorId) {
      setError("Please enter a transcript and select a doctor first.");
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess("");
    setError("");

    try {
      const { data, error } = await supabase
        .from('transcripts')
        .insert({
          doctor_id: selectedDoctorId,
          user_id: DEMO_USER_ID,
          content: transcript.trim(),
          transcript_date: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      
      setSubmitSuccess("✅ Transcript submitted successfully!");
      setTranscript("");
      setInterim("");
      
      // Reload transcripts to show the new one
      await loadData();
      
    } catch (error) {
      console.error("Error submitting transcript:", error);
      setError(`Failed to submit transcript: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBiasColor = (score) => {
    if (!score) return "bg-gray-50 text-gray-600";
    if (score < 2) return "bg-green-50 text-green-600";
    if (score < 3) return "bg-yellow-50 text-yellow-600";
    return "bg-red-50 text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-600 mb-4">⚠️ {error}</p>
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-blue-700">EquiCare Dashboard</h1>
            <p className="text-gray-600 mt-1">Record and manage your medical conversations</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-blue-600 hover:underline">← Back Home</Link>
            <Link to="/profile" className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition">
              👤 My Profile
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">⚠️ {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Info & Recording */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info Card */}
            {user ? (
              <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
                <h2 className="text-xl font-semibold text-blue-700 mb-4">Your Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-sm text-blue-600">Age</div>
                    <div className="text-lg font-semibold text-blue-800">{user.age || 'N/A'}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <div className="text-sm text-emerald-600">Weight</div>
                    <div className="text-lg font-semibold text-emerald-800">{user.weight ? `${user.weight} kg` : 'N/A'}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-sm text-purple-600">Gender</div>
                    <div className="text-lg font-semibold text-purple-800 capitalize">{user.gender || 'N/A'}</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="text-sm text-amber-600">Your Rating</div>
                    <div className="text-lg font-semibold text-amber-800">⭐ {user.user_rating || 'N/A'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
                <h2 className="text-xl font-semibold text-blue-700 mb-4">Welcome to EquiCare</h2>
                <p className="text-gray-600">Please set up your profile to get started.</p>
                <Link to="/profile" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Profile
                </Link>
              </div>
            )}

            {/* Recording Interface */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-blue-700">Record Conversation</h2>
                <StatusBadge listening={listening} supported={supported} />
              </div>

              {!supported ? (
                <p className="text-sm text-red-500">Speech recognition not supported. Try Chrome on desktop.</p>
              ) : (
                <div className="space-y-4">
                  {/* Doctor Selection */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-blue-600">Select Doctor</label>
                    <select
                      className="w-full bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm"
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      disabled={doctors.length === 0}
                    >
                      {doctors.length === 0 ? (
                        <option value="">No doctors available</option>
                      ) : (
                        doctors.map(doctor => (
                          <option key={doctor.doctor_id} value={doctor.doctor_id}>
                            {doctor.doctor_name} (Rating: ⭐ {doctor.average_rating || 'N/A'})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Language Selection */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-blue-600">Language:</label>
                    <select
                      className="bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-sm"
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

                  {/* Control Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={start} disabled={listening}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40">
                      🎙️ Start Recording
                    </button>
                    <button onClick={stop} disabled={!listening}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-40">
                      ■ Stop
                    </button>
                    <button onClick={clearAll}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200">
                      🗑 Clear
                    </button>
                  </div>

                  {/* Transcript Area */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-blue-600">Transcript</label>
                    <textarea
                      className="w-full h-40 rounded-xl border border-blue-200 bg-blue-50 p-4 text-gray-800 resize-none"
                      value={composeLive(transcript, interim)}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="Press 'Start Recording' and speak... your words will appear here."
                    />
                    {interim && <p className="text-xs text-gray-400 mt-1">Listening...</p>}
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={submitToHospital}
                      disabled={!transcript.trim() || isSubmitting || !selectedDoctorId}
                      className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-40 transition"
                    >
                      {isSubmitting ? "Submitting..." : "🚑 Submit to Hospital"}
                    </button>
                    {submitSuccess && <p className="text-emerald-600 font-medium">{submitSuccess}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Recent Transcripts */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">Your Recent Transcripts</h2>
            {userTranscripts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No transcripts yet. Record your first conversation!</p>
            ) : (
              <div className="space-y-4">
                {userTranscripts.map(transcript => (
                  <div key={transcript.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-blue-600">{transcript.doctors.doctor_name}</span>
                      <span className="text-xs text-gray-500">{formatDate(transcript.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3 mb-2">
                      {transcript.content.substring(0, 150)}
                      {transcript.content.length > 150 ? "..." : ""}
                    </p>
                    
                    {/* Additional transcript metadata */}
                    <div className="flex items-center gap-2 text-xs">
                      {transcript.user_rating && (
                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
                          Your Rating: ⭐ {transcript.user_rating}
                        </span>
                      )}
                      {transcript.bias_score && (
                        <span className={`px-2 py-1 rounded ${getBiasColor(transcript.bias_score)}`}>
                          Bias Score: {transcript.bias_score}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
      {listening ? "● Recording" : "Ready"}
    </span>
  );
}

// Helper functions
function smartJoin(prev, next) {
  const a = (prev || "").trimEnd();
  const b = (next || "").trim();
  if (!a) return capitalize(b) + " ";
  const needsSpace = !a.endsWith(" ") && !".,!?".includes(b[0] || "");
  return a + (needsSpace ? " " : "") + b + " ";
}

function capitalize(s) { 
  return s ? s[0].toUpperCase() + s.slice(1) : s; 
}

function composeLive(finalText, interimText) { 
  return (finalText || "") + (interimText ? interimText : ""); 
}