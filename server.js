const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const UPSTREAM = process.env.UPSTREAM_WEBHOOK; // opcional (proxy)

// Body parser
app.use(express.json({ limit: "1mb" }));

// Servir estáticos desde la raíz (index.html, css, js, imágenes)
app.use(express.static(__dirname, { extensions: ["html"] }));

// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

// Proxy opcional para evitar CORS en el front: POST /api/cotizar -> UPSTREAM_WEBHOOK
app.post("/api/cotizar", async (req, res) => {
  if (!UPSTREAM) return res.status(500).json({ error: "UPSTREAM_WEBHOOK no está configurada" });
  try {
    const r = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const text = await r.text();
    res.status(r.status);
    res.set("Content-Type", r.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: "Error proxy", detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
