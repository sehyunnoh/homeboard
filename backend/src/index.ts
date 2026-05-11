import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 4000;
const DATA_FILE = path.join(__dirname, "../data/bookmarks.json");
const DEFAULT_DATA = JSON.stringify({ version: 1, tree: [] }, null, 2);

if (!fs.existsSync(DATA_FILE)) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, DEFAULT_DATA, "utf-8");
}

app.use(cors());
app.use(express.json());

app.get("/api/info", (_req, res) => {
  res.json({ dataFile: DATA_FILE });
});

app.get("/api/bookmarks", (_req, res) => {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  res.json(JSON.parse(raw));
});

app.put("/api/bookmarks", (req, res) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), "utf-8");
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
