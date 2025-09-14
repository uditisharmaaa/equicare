import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("equi_profile");
      if (raw) {
        const p = JSON.parse(raw);
        setName(p.name || "");
        setAge(p.age || "");
        setGender(p.gender || "");
        setWeight(p.weight || "");
      }
    } catch {}
  }, []);

  function save(e) {
    e.preventDefault();
    setSaving(true);
    const profile = {
      name: name.trim(),
      age: age ? String(age) : "",
      gender: gender.trim(),
      weight: weight ? String(weight) : "",
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("equi_profile", JSON.stringify(profile));
    setSaving(false);
    setOk("Profile saved ✓");
    setTimeout(() => setOk(""), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex flex-col items-center justify-center px-4 py-10">
      {/* Back button */}
      <div className="mb-6 self-start">
        <button
          onClick={() => navigate("/user")}
          className="rounded-lg bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 transition"
        >
          Back to User Page
        </button>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl rounded-2xl border border-blue-100 bg-white shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-blue-700 mb-2">EquiCare — Profile</h1>
        <p className="text-gray-600 text-sm mb-6">
          Tell us a bit about you. This helps EquiCare analyze care equity fairly.
        </p>

        <form onSubmit={save} className="grid gap-5">
          {/* Name */}
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium text-blue-700">Name</label>
            <input
              id="name"
              type="text"
              className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-gray-800 placeholder:text-blue-300
                         focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 transition"
              placeholder="e.g., Jordan Kim"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Age / Gender / Weight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="grid gap-2">
              <label htmlFor="age" className="text-sm font-medium text-blue-700">Age</label>
              <input
                id="age"
                type="number"
                min={0}
                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-gray-800 placeholder:text-blue-300
                           focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 transition"
                placeholder="e.g., 29"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="gender" className="text-sm font-medium text-blue-700">Gender</label>
              <input
                id="gender"
                type="text"
                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-gray-800 placeholder:text-blue-300
                           focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 transition"
                placeholder="e.g., female / male / non-binary / prefer not to say"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="weight" className="text-sm font-medium text-blue-700">Weight (kg)</label>
              <input
                id="weight"
                type="number"
                min={0}
                step="0.1"
                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-gray-800 placeholder:text-blue-300
                           focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 transition"
                placeholder="e.g., 62.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>

            <button
              type="button"
              onClick={() => { setName(""); setAge(""); setGender(""); setWeight(""); }}
              className="rounded-lg bg-gray-100 text-gray-700 px-6 py-3 font-medium hover:bg-gray-200 transition w-full sm:w-auto"
            >
              Reset
            </button>
          </div>

          {ok && <p className="text-sm text-emerald-600 mt-2">{ok}</p>}
        </form>
      </div>
    </div>
  );
}
