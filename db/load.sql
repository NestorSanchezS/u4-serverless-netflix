-- Script de base de datos: crea el esquema y carga el dataset de Netflix (Kaggle: shivamb/netflix-shows).
-- Uso: psql "$DATABASE_URL" -f db/load.sql   (ejecutar desde la raíz del proyecto)

\set ON_ERROR_STOP on

DROP TABLE IF EXISTS titles;
DROP TABLE IF EXISTS titles_staging;

-- 1) Tabla temporal con las columnas del CSV tal cual vienen (todo texto).
CREATE TABLE titles_staging (
  show_id      TEXT,
  type         TEXT,
  title        TEXT,
  director     TEXT,
  "cast"       TEXT,
  country      TEXT,
  date_added   TEXT,
  release_year TEXT,
  rating       TEXT,
  duration     TEXT,
  listed_in    TEXT,
  description  TEXT
);

\copy titles_staging FROM 'data/netflix_titles.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

-- 2) Tabla final con tipos de datos correctos.
CREATE TABLE titles (
  show_id        TEXT PRIMARY KEY,
  type           TEXT NOT NULL CHECK (type IN ('Movie', 'TV Show')),
  title          TEXT NOT NULL UNIQUE,
  director       TEXT,
  cast_members   TEXT,
  country        TEXT,
  date_added     DATE,
  release_year   SMALLINT NOT NULL,
  rating         TEXT,
  duration       TEXT,
  listed_in      TEXT,
  description    TEXT
);

INSERT INTO titles
SELECT
  trim(show_id),
  trim(type),
  trim(title),
  NULLIF(trim(director), ''),
  NULLIF(trim("cast"), ''),
  NULLIF(trim(country), ''),
  to_date(NULLIF(trim(date_added), ''), 'FMMonth FMDD, YYYY'),
  release_year::SMALLINT,
  NULLIF(trim(rating), ''),
  NULLIF(trim(duration), ''),
  NULLIF(trim(listed_in), ''),
  NULLIF(trim(description), '')
FROM titles_staging;

DROP TABLE titles_staging;

-- 3) Índices para las búsquedas de la aplicación.
CREATE INDEX idx_titles_title_lower ON titles (lower(title) text_pattern_ops);
CREATE INDEX idx_titles_type ON titles (type);
CREATE INDEX idx_titles_release_year ON titles (release_year);

-- 4) Verificación: deben ser 7787 filas.
SELECT count(*) AS total_filas,
       count(*) FILTER (WHERE type = 'Movie')   AS peliculas,
       count(*) FILTER (WHERE type = 'TV Show') AS series,
       min(release_year) AS anio_min,
       max(release_year) AS anio_max
FROM titles;
