import { getPool, sendJson } from "../lib/db.js";

const TOP_COUNTRIES = 10;
const YEARS_BACK = 15;

// GET /api/stats -> aggregated data for the charts
export default async function handler(_req, res) {
  try {
    const db = getPool();
    const [byType, byYear, byCountry] = await Promise.all([
      db.query("SELECT type, count(*)::int AS total FROM titles GROUP BY type ORDER BY type"),
      db.query(
        `SELECT release_year AS year, count(*)::int AS total
           FROM titles
          WHERE release_year > (SELECT max(release_year) FROM titles) - $1
          GROUP BY release_year ORDER BY release_year`,
        [YEARS_BACK],
      ),
      db.query(
        `SELECT trim(split_part(country, ',', 1)) AS country, count(*)::int AS total
           FROM titles
          WHERE country IS NOT NULL
          GROUP BY 1 ORDER BY total DESC LIMIT $1`,
        [TOP_COUNTRIES],
      ),
    ]);

    res.setHeader("Cache-Control", "s-maxage=3600");
    return sendJson(res, 200, { byType: byType.rows, byYear: byYear.rows, byCountry: byCountry.rows });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Error consultando la base de datos" });
  }
}
