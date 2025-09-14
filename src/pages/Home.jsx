import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-white border border-blue-100 shadow-lg rounded-2xl p-10">
        <h1 className="text-3xl font-semibold text-blue-700 text-center">EquiCare</h1>
        <p className="text-gray-600 text-center mt-2">Choose how you’d like to continue</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Link
            to="/user"
            className="block rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 p-6 transition"
          >
            <div className="text-2xl mb-2">🧑‍⚕️ User</div>
            <p className="text-sm text-gray-600">Record your conversation and submit a transcript to your hospital.</p>
          </Link>

          <Link
            to="/admin"
            className="block rounded-2xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 p-6 transition"
          >
            <div className="text-2xl mb-2">🏥 Hospital Admin</div>
            <p className="text-sm text-gray-600">View recent submissions and summary metrics (demo view).</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
