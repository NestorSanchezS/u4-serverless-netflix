// Local-only server: serves public/ and routes /api/* to the same handlers Vercel runs.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import titles from "./api/titles.js";
import stats from "./api/stats.js";

const PORT = Number(process.env.PORT || 3000);
const ROUTES = { "/api/titles": titles, "/api/stats": stats };
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  if (ROUTES[path]) return ROUTES[path](req, res);
  try {
    const file = path === "/" ? "index.html" : path.slice(1);
    const body = await readFile(join("public", file));
    res.setHeader("Content-Type", MIME[extname(file)] ?? "application/octet-stream");
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
