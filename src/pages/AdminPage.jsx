import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [recentTranscripts, setRecentTranscripts] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [error, setError] = useState("");
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from("doctors")
        .select("*");
      
      console.log("Doctors fetched:", doctorsData?.length || 0);
      if (doctorsError) throw doctorsError;

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*");
      if (usersError) throw usersError;

      // Fetch transcripts
      const { data: transcriptsData, count: totalTranscripts, error: transcriptsError } =
        await supabase
          .from("transcripts")
          .select("*", { count: "exact" })
          .order("transcript_identifier", { ascending: false });
      
      console.log("Transcripts fetched:", transcriptsData?.length || 0, "Total count:", totalTranscripts);
      if (transcriptsError) {
        console.error("Transcripts error:", transcriptsError);
        throw transcriptsError;
      }

      // Overview - calculate from transcripts instead of users
      const avgPatientRating =
        transcriptsData.length > 0
          ? transcriptsData.reduce((sum, t) => sum + (parseInt(t.user_rating) || 0), 0) /
            transcriptsData.length
          : 0;

      const avgBiasScore =
        transcriptsData.length > 0
          ? transcriptsData.reduce((sum, t) => sum + (parseInt(t.bias_rating) || 0), 0) /
            transcriptsData.length
          : 0;

      // Get unique users from transcripts
      const uniqueUsers = new Set(transcriptsData.map(t => t.user_id)).size;

      setOverview({
        totalTranscripts: totalTranscripts || 0,
        avgPatientRating: Math.round(avgPatientRating * 100) / 100,
        avgBiasScore: Math.round(avgBiasScore * 100) / 100,
        totalUsers: uniqueUsers,
        totalDoctors: doctorsData.length,
      });

      // Compute transcripts per doctor
      const transcriptsByDoctor = transcriptsData.reduce((acc, t) => {
        if (!acc[t.doctor_id]) acc[t.doctor_id] = [];
        acc[t.doctor_id].push(t);
        return acc;
      }, {});

      // Process doctors with dynamic rating and bias rating
      const processedDoctors = doctorsData.map((d) => {
        const doctorTranscripts = transcriptsByDoctor[d.doctor_id] || [];
        const computedRating =
          doctorTranscripts.length > 0
            ? doctorTranscripts.reduce((sum, t) => sum + (parseInt(t.user_rating) || 0), 0) /
              doctorTranscripts.length
            : null;
        
        const computedBiasRating =
          doctorTranscripts.length > 0
            ? doctorTranscripts.reduce((sum, t) => sum + (parseInt(t.bias_rating) || 0), 0) /
              doctorTranscripts.length
            : null;

        return {
          doctor_id: d.doctor_id,
          doctor_name: d.doctor_name,
          average_rating: d.average_rating != null ? d.average_rating : computedRating,
          average_bias_rating: computedBiasRating,
          transcript_count: doctorTranscripts.length,
          transcripts: doctorTranscripts,
        };
      });

      // User demographics from transcripts
      const genderGroups = transcriptsData.reduce((acc, t) => {
        const gender = t.gender || "unknown";
        if (!acc[gender]) acc[gender] = { users: [], totalAge: 0 };
        acc[gender].users.push(t);
        acc[gender].totalAge += parseInt(t.age) || 0;
        return acc;
      }, {});

      const processedUserStats = Object.entries(genderGroups).map(
        ([gender, data]) => ({
          gender,
          count: data.users.length,
          avg_age:
            data.users.length > 0
              ? Math.round((data.totalAge / data.users.length) * 10) / 10
              : 0,
        })
      );


      setDoctors(processedDoctors);
      setRecentTranscripts(transcriptsData.slice(0, 10));
      setUserStats(processedUserStats);
    } catch (err) {
      console.error("Error loading admin data:", err);
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 7) return "text-green-600 bg-green-50";
    if (rating >= 4) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const openTranscriptModal = (transcript) => {
    setSelectedTranscript(transcript);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTranscript(null);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading admin dashboard...</p>
        </div>
      </div>
    );

  if (error)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-blue-700">
              EquiCare Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Hospital management and analytics overview
            </p>
          </div>
          <Link to="/" className="text-blue-600 hover:underline">
            ← Back Home
          </Link>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
              <div className="text-sm text-blue-600 mb-1">Total Transcripts</div>
              <div className="text-3xl font-semibold text-blue-800">
                {overview.totalTranscripts}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-lg p-6">
              <div className="text-sm text-emerald-600 mb-1">Avg Patient Rating</div>
              <div className="text-3xl font-semibold text-emerald-800">
                ⭐ {overview.avgPatientRating}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-6">
              <div className="text-sm text-amber-600 mb-1">Avg Bias Score</div>
              <div className="text-3xl font-semibold text-amber-800">
                {overview.avgBiasScore}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-purple-100 shadow-lg p-6">
              <div className="text-sm text-purple-600 mb-1">Total Users</div>
              <div className="text-3xl font-semibold text-purple-800">
                {overview.totalUsers}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-sky-100 shadow-lg p-6">
              <div className="text-sm text-sky-600 mb-1">Total Doctors</div>
              <div className="text-3xl font-semibold text-sky-800">
                {overview.totalDoctors}
              </div>
            </div>
          </div>
        )}

        {/* Doctor Performance */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-700 mb-6">
            Doctor Performance
          </h2>
          {doctors.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No doctors found.</p>
          ) : (
            <div className="space-y-4">
              {doctors.map((d) => (
                <Link
                  key={d.doctor_id}
                  to={`/admin/doctor/${d.doctor_id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-gray-800">{d.doctor_name}</span>
                    <span className="text-sm text-gray-500">
                      {d.transcript_count} transcripts →
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3">
                      <div className={`px-3 py-1 rounded-lg ${getRatingColor(d.average_rating ?? 0)}`}>
                        <div className="text-xs opacity-75">Patient Rating</div>
                        <div className="font-semibold">⭐ {d.average_rating != null ? d.average_rating.toFixed(2) : "N/A"}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg ${getRatingColor(10 - (d.average_bias_rating ?? 10))}`}>
                        <div className="text-xs opacity-75">Bias Rating</div>
                        <div className="font-semibold">📊 {d.average_bias_rating != null ? d.average_bias_rating.toFixed(2) : "N/A"}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {new Set(d.transcripts.map(t => t.user_id)).size} unique patients
                      </div>
                      <div className="text-xs text-blue-500 mt-1">
                        Click to view all interactions
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* User Demographics */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-700 mb-6">User Demographics</h2>
          {userStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No user data available.</p>
          ) : (
            <div className="space-y-4">
              {userStats.map((stat, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800 capitalize">
                      {stat.gender}
                    </span>
                    <span className="text-sm text-gray-500">{stat.count} users</span>
                  </div>
                  <div className="bg-blue-50 px-2 py-1 rounded">
                    <div className="text-xs text-blue-600 opacity-75">Avg Age</div>
                    <div className="font-semibold text-blue-800">
                      {stat.avg_age || "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transcripts */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold text-blue-700 mb-6">
            Recent Transcript Submissions
          </h2>
          {recentTranscripts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transcripts yet.</p>
          ) : (
            <div className="space-y-4">
              {recentTranscripts.map((t) => (
                <div
                  key={t.transcript_identifier}
                  onClick={() => openTranscriptModal(t)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-blue-600">
                      {t.doctor_name || "N/A"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(t.date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-800">
                      Patient: {t.patient_name || "Unknown"}
                    </span>
                    <span className="text-sm text-gray-500">
                      Rating: ⭐ {t.user_rating}/10
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-2">
                    {t.transcript.substring(0, 200)}
                    {t.transcript.length > 200 ? "..." : ""}
                  </p>
                  <div className="text-xs text-blue-500">Click to view full transcript</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      {showModal && selectedTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-blue-700">
                  Medical Transcript
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedTranscript.doctor_name} - {selectedTranscript.patient_name}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Patient Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-600">Patient:</span>
                    <p className="text-gray-800">{selectedTranscript.patient_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">Age:</span>
                    <p className="text-gray-800">{selectedTranscript.age}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">Gender:</span>
                    <p className="text-gray-800 capitalize">{selectedTranscript.gender}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">Race:</span>
                    <p className="text-gray-800">{selectedTranscript.race}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">Weight:</span>
                    <p className="text-gray-800">{selectedTranscript.weight} lbs</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">Cause:</span>
                    <p className="text-gray-800 capitalize">{selectedTranscript.cause}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">Date:</span>
                    <p className="text-gray-800">{formatDate(selectedTranscript.date)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">Rating:</span>
                    <p className="text-gray-800">⭐ {selectedTranscript.user_rating}/10</p>
                  </div>
                </div>
              </div>

              {/* Transcript Content */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Full Transcript:</h4>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedTranscript.transcript}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
