import pg from "pg";

const PG_DATE_OID = 1082;
// Keep DATE columns as "YYYY-MM-DD" instead of a timezone-shifted JS Date.
pg.types.setTypeParser(PG_DATE_OID, (value) => value);

// The pool lives outside the handler so warm invocations reuse the connection.
let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    pool = new pg.Pool({
      connectionString,
      max: 1,
      ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}
