import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [race, setRace] = useState("");
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
        setRace(p.race || "");
      }
    } catch {
      /* ignore */
    }
  }, []);

  function save(e) {
    e.preventDefault();
    setSaving(true);
    const profile = {
      name: name.trim(),
      age: age ? String(age) : "",
      gender: gender.trim(),
      weight: weight ? String(weight) : "",
      race: race.trim(),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("equi_profile", JSON.stringify(profile));
    setSaving(false);
    setOk("Profile saved");
    setTimeout(() => setOk(""), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-3xl">
        {/* Back to User Page */}
        <div className="mb-6 mt-6">
          <button
            onClick={() => navigate("/user")}
            className="rounded-lg bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 transition"
          >
            Back to User Page
          </button>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-blue-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 md:p-8">
          <h1 className="text-2xl font-semibold text-blue-700 mb-2">EquiCare — Profile</h1>
          <p className="text-gray-600 text-sm">
            Tell us a bit about you. This helps EquiCare analyze care equity fairly.
          </p>

          <form onSubmit={save} className="mt-6 grid gap-5">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Age */}
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

              {/* Gender */}
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

              {/* Weight */}
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

            {/* Race */}
            <div className="grid gap-2">
              <label htmlFor="race" className="text-sm font-medium text-blue-700">Race / Ethnicity</label>
              <input
                id="race"
                type="text"
                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-gray-800 placeholder:text-blue-300
                           focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 transition"
                placeholder="e.g., Asian, Black/African American, Hispanic/Latino"
                value={race}
                onChange={(e) => setRace(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div className="mt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition w-full sm:w-auto"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>

              <button
                type="button"
                onClick={() => { setName(""); setAge(""); setGender(""); setWeight(""); setRace(""); }}
                className="rounded-lg bg-gray-100 text-gray-700 px-6 py-3 font-medium hover:bg-gray-200 transition w-full sm:w-auto"
              >
                Reset
              </button>
            </div>

            {ok && <p className="text-sm text-emerald-600">{ok}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
