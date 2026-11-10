import { getPool, sendJson } from "../lib/db.js";

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;
const VALID_TYPES = ["Movie", "TV Show"];

// GET /api/titles?id=s1                         -> one title by primary key
// GET /api/titles?q=matrix&type=Movie&page=1    -> paginated search by title
export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id")?.trim();
    const db = getPool();

    if (id) {
      const { rows } = await db.query("SELECT * FROM titles WHERE show_id = $1", [id]);
      if (rows.length === 0) return sendJson(res, 404, { error: `No existe el título con id ${id}` });
      return sendJson(res, 200, rows[0]);
    }

    const q = url.searchParams.get("q")?.trim() ?? "";
    const type = url.searchParams.get("type");
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number.parseInt(url.searchParams.get("pageSize") ?? `${DEFAULT_PAGE_SIZE}`, 10) || DEFAULT_PAGE_SIZE),
    );

    const where = [];
    const params = [];
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where.push(`lower(title) LIKE $${params.length}`);
    }
    if (VALID_TYPES.includes(type)) {
      params.push(type);
      where.push(`type = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const total = await db.query(`SELECT count(*)::int AS n FROM titles ${whereSql}`, params);
    params.push(pageSize, (page - 1) * pageSize);
    const { rows } = await db.query(
      `SELECT show_id, type, title, country, release_year, rating, duration
         FROM titles ${whereSql}
        ORDER BY title
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return sendJson(res, 200, { total: total.rows[0].n, page, pageSize, items: rows });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Error consultando la base de datos" });
  }
}
