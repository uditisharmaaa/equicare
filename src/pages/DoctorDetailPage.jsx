import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "./supabase";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function DoctorDetailPage() {
  const { doctorId } = useParams();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [error, setError] = useState("");
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadDoctorData();
  }, [doctorId]);

  const loadDoctorData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch doctor info
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("*")
        .eq("doctor_id", doctorId)
        .single();

      if (doctorError) throw doctorError;

      // Fetch doctor's transcripts
      const { data: transcriptsData, error: transcriptsError } = await supabase
        .from("transcripts")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("date", { ascending: false });

      if (transcriptsError) throw transcriptsError;

      // Calculate average rating and bias rating from transcripts
      const avgRating = transcriptsData.length > 0
        ? transcriptsData.reduce((sum, t) => sum + (parseInt(t.user_rating) || 0), 0) / transcriptsData.length
        : null;
      
      const avgBiasRating = transcriptsData.length > 0
        ? transcriptsData.reduce((sum, t) => sum + (parseInt(t.bias_rating) || 0), 0) / transcriptsData.length
        : null;

      setDoctor({
        ...doctorData,
        computed_rating: avgRating,
        computed_bias_rating: avgBiasRating
      });
      setTranscripts(transcriptsData);
    } catch (err) {
      console.error("Error loading doctor data:", err);
      setError(`Failed to load doctor data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  // Helper functions for chart data
  const getGenderBiasData = (transcripts) => {
    const genderGroups = transcripts.reduce((acc, t) => {
      const gender = t.gender || 'unknown';
      if (!acc[gender]) acc[gender] = { total: 0, count: 0 };
      acc[gender].total += parseInt(t.bias_rating) || 0;
      acc[gender].count += 1;
      return acc;
    }, {});
    
    return Object.entries(genderGroups).map(([gender, data]) => ({
      gender: gender.charAt(0).toUpperCase() + gender.slice(1),
      avgBias: data.count > 0 ? (data.total / data.count).toFixed(2) : 0,
      count: data.count
    }));
  };

  const getRaceBiasData = (transcripts) => {
    const raceGroups = transcripts.reduce((acc, t) => {
      const race = t.race || 'unknown';
      if (!acc[race]) acc[race] = { total: 0, count: 0 };
      acc[race].total += parseInt(t.bias_rating) || 0;
      acc[race].count += 1;
      return acc;
    }, {});
    
    return Object.entries(raceGroups).map(([race, data]) => ({
      race: race.length > 15 ? race.substring(0, 15) + '...' : race,
      avgBias: data.count > 0 ? (data.total / data.count).toFixed(2) : 0,
      count: data.count
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading doctor details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-600 mb-4">⚠️ {error}</p>
          <Link
            to="/admin"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-gray-600 mb-4">Doctor not found</p>
          <Link
            to="/admin"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Admin
          </Link>
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
            <Link to="/admin" className="text-blue-600 hover:underline mb-2 inline-block">
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-3xl font-semibold text-blue-700">
              {doctor.doctor_name}
            </h1>
            <p className="text-gray-600 mt-1">
              Doctor Performance & Patient Interactions
            </p>
          </div>
        </div>

        {/* Doctor Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
            <div className="text-sm text-blue-600 mb-1">Total Patients</div>
            <div className="text-3xl font-semibold text-blue-800">
              {transcripts.length}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-lg p-6">
            <div className="text-sm text-emerald-600 mb-1">Average Rating</div>
            <div className="text-3xl font-semibold text-emerald-800">
              ⭐ {doctor.computed_rating ? doctor.computed_rating.toFixed(1) : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 shadow-lg p-6">
            <div className="text-sm text-red-600 mb-1">Average Bias Rating</div>
            <div className="text-3xl font-semibold text-red-800">
              📊 {doctor.computed_bias_rating ? doctor.computed_bias_rating.toFixed(1) : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-purple-100 shadow-lg p-6">
            <div className="text-sm text-purple-600 mb-1">Unique Patients</div>
            <div className="text-3xl font-semibold text-purple-800">
              {new Set(transcripts.map(t => t.user_id)).size}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-6">
            <div className="text-sm text-amber-600 mb-1">This Month</div>
            <div className="text-3xl font-semibold text-amber-800">
              {transcripts.filter(t => {
                const transcriptDate = new Date(t.date);
                const now = new Date();
                return transcriptDate.getMonth() === now.getMonth() && 
                       transcriptDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </div>
        </div>

        {/* Bias Analysis Charts */}
        {transcripts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bias vs Weight */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Bias Rating vs Patient Weight</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="weight" 
                    type="number" 
                    domain={['dataMin - 10', 'dataMax + 10']}
                    label={{ value: 'Weight (lbs)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="bias_rating" 
                    type="number" 
                    domain={[0, 10]}
                    label={{ value: 'Bias Rating', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip formatter={(value, name) => [value, name === 'bias_rating' ? 'Bias Rating' : 'Weight']} />
                  <Scatter 
                    name="Patients" 
                    data={transcripts.map(t => ({ 
                      weight: parseInt(t.weight) || 0, 
                      bias_rating: parseInt(t.bias_rating) || 0,
                      patient: t.patient_name
                    }))} 
                    fill="#3B82F6" 
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Bias vs Age */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Bias Rating vs Patient Age</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="age" 
                    type="number" 
                    domain={['dataMin - 5', 'dataMax + 5']}
                    label={{ value: 'Age (years)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="bias_rating" 
                    type="number" 
                    domain={[0, 10]}
                    label={{ value: 'Bias Rating', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip formatter={(value, name) => [value, name === 'bias_rating' ? 'Bias Rating' : 'Age']} />
                  <Scatter 
                    name="Patients" 
                    data={transcripts.map(t => ({ 
                      age: parseInt(t.age) || 0, 
                      bias_rating: parseInt(t.bias_rating) || 0,
                      patient: t.patient_name
                    }))} 
                    fill="#10B981" 
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Bias vs Gender */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Average Bias Rating by Gender</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getGenderBiasData(transcripts)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gender" />
                  <YAxis domain={[0, 10]} label={{ value: 'Avg Bias Rating', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="avgBias" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bias vs Race */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Average Bias Rating by Race</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getRaceBiasData(transcripts)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="race" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 10]} label={{ value: 'Avg Bias Rating', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="avgBias" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Patient Interactions */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold text-blue-700 mb-6">
            Patient Interactions ({transcripts.length})
          </h2>
          {transcripts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No patient interactions yet.</p>
          ) : (
            <div className="space-y-4">
              {transcripts.map((t) => (
                <div
                  key={t.transcript_identifier}
                  onClick={() => openTranscriptModal(t)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-semibold text-blue-600">
                        {t.patient_name || "Unknown Patient"}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {t.age} year old {t.gender} • {t.race} • {t.cause}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {formatDate(t.date)}
                      </span>
                      <div className={`mt-1 px-2 py-1 rounded text-xs ${getRatingColor(parseInt(t.user_rating))}`}>
                        ⭐ {t.user_rating}/10
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-2">
                    {t.transcript.substring(0, 300)}
                    {t.transcript.length > 300 ? "..." : ""}
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
