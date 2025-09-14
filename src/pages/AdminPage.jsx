import React from "react";
import { Link } from "react-router-dom";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white border border-blue-100 shadow-lg rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-blue-700">EquiCare — Hospital Management</h1>
          <Link to="/" className="text-sm text-blue-600 hover:underline">← Back</Link>
        </div>

        <p className="mt-4 text-gray-600">
          This is a demo admin view. Hook it up to Supabase (aggregates, recent submissions) when ready.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="text-sm text-blue-700">Total Transcripts</div>
            <div className="text-3xl font-semibold text-blue-800">—</div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="text-sm text-emerald-700">Avg Bias Score</div>
            <div className="text-3xl font-semibold text-emerald-800">—</div>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <div className="text-sm text-sky-700">Avg Patient Rating</div>
            <div className="text-3xl font-semibold text-sky-800">—</div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Recent Submissions</div>
          <div className="text-gray-400 text-sm">No data yet — connect Supabase here.</div>
        </div>
      </div>
    </div>
  );
}
