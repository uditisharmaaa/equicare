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
      if (transcriptsError) throw transcriptsError;

      // Overview
      const avgPatientRating =
        usersData.length > 0
          ? usersData.reduce((sum, u) => sum + (u.user_rating || 0), 0) /
            usersData.length
          : 0;

      const avgBiasScore =
        doctorsData.length > 0
          ? doctorsData.reduce((sum, d) => sum + (d.average_rating || 0), 0) /
            doctorsData.length
          : 0;

      setOverview({
        totalTranscripts: totalTranscripts || 0,
        avgPatientRating: Math.round(avgPatientRating * 100) / 100,
        avgBiasScore: Math.round(avgBiasScore * 100) / 100,
        totalUsers: usersData.length,
        totalDoctors: doctorsData.length,
      });

      // Compute transcripts per doctor
      const transcriptsByDoctor = transcriptsData.reduce((acc, t) => {
        if (!acc[t.doctor_id]) acc[t.doctor_id] = [];
        acc[t.doctor_id].push(t);
        return acc;
      }, {});

      const processedDoctors = doctorsData.map((d) => ({
        doctor_id: d.doctor_id,
        doctor_name: d.doctor_name,
        average_rating: d.average_rating || 0,
        transcript_count: transcriptsByDoctor[d.doctor_id]
          ? transcriptsByDoctor[d.doctor_id].length
          : 0,
        transcripts: transcriptsByDoctor[d.doctor_id] || [],
      }));

      // User demographics
      const genderGroups = usersData.reduce((acc, u) => {
        const gender = u.gender || "unknown";
        if (!acc[gender]) acc[gender] = { users: [], totalAge: 0 };
        acc[gender].users.push(u);
        acc[gender].totalAge += u.age || 0;
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
                <details
                  key={d.doctor_id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <summary className="flex justify-between items-center cursor-pointer">
                    <span className="font-semibold text-gray-800">{d.doctor_name}</span>
                    <span className="text-sm text-gray-500">
                      {d.transcript_count} transcripts
                    </span>
                  </summary>
                  <div className={`mt-3 px-2 py-1 rounded-lg ${getRatingColor(d.average_rating)}`}>
                    <div className="text-xs opacity-75">Doctor Rating</div>
                    <div className="font-semibold">⭐ {d.average_rating || "N/A"}</div>
                  </div>
                  {d.transcripts.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Recent Transcripts
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                        {d.transcripts.slice(0, 5).map((t) => (
                          <li key={t.transcript_identifier}>
                            {t.patient_name || "Unknown patient"} - {t.transcript.substring(0, 80)}
                            {t.transcript.length > 80 ? "..." : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </details>
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
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-blue-600">
                      {t.doctor_name || "N/A"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(t.transcript_identifier)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {t.transcript.substring(0, 200)}
                    {t.transcript.length > 200 ? "..." : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
