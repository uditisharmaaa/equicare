// server.js (ESM)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // Vite default
app.use(express.json({ limit: "1mb" }));

// 🔽🔽🔽 THIS is the "analyze handler" your frontend calls
app.post("/analyze", async (req, res) => {
  try {
    const { transcript = "", cause = "", doctorName = "", userRating = "" } = req.body || {};
    if (!transcript.trim()) return res.status(400).json({ error: "Missing transcript" });

    // Build the prompt here so the client doesn’t need to
    const prompt = [
      "You are a concise medical scribe and fairness reviewer.",
      "Summarize the visit in 2–3 sentences, then rate potential provider bias (0–10).",
      'Return ONLY JSON: {"score": number, "review": string}.',
      "",
      `Doctor: ${doctorName || "Unknown"}`,
      `Visit title/reason: ${cause || "(none)"}`,
      `User rating (0–10): ${userRating !== "" ? userRating : "-"}`,
      "",
      "--- Transcript ---",
      transcript.trim(),
    ].join("\n");

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 512,
        system: "You strictly output machine-readable JSON. No prose outside JSON.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: "Anthropic failed", detail: data });

    const text = data?.content?.[0]?.text ?? "";
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { score: null, review: text }; }
    return res.json(parsed); // { score, review }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
});
// 🔼🔼🔼 END analyze handler

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
