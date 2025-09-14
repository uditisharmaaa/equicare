import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 grid place-items-center px-4">
      <div className="bg-white border border-blue-100 shadow rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-semibold text-blue-700">404</h1>
        <p className="mt-2 text-gray-600">Page not found.</p>
        <Link to="/" className="mt-6 inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500">
          Go Home
        </Link>
      </div>
    </div>
  );
}
