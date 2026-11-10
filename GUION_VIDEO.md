# Guion para el video (8–10 min)

La rúbrica da los 50 puntos máximos del video si justifican **por qué** eligieron el servicio y el patrón **con conceptos de clase**. Repártanse las partes; cada uno lo dice con sus palabras.

## 1. Introducción (1 min)
- Qué hicimos: dataset de Kaggle → base de datos serverless → app web serverless.
- Mostrar la app funcionando: https://u4-serverless-netflix.vercel.app

## 2. Dataset (1 min)
- Mostrar la página de Kaggle (shivamb/netflix-shows) y el CSV: 7.787 filas, 12 columnas.
- Explicar que `show_id` y `title` son únicos, por eso se usan para buscar.

## 3. Base de datos serverless (2–3 min)
- Mostrar en el panel de Vercel: proyecto → **Storage** → la base Neon `u4-netflix-db`.
- Abrir la consola de Neon (botón "Open in Neon") → **Tables** → `titles`: mostrar columnas, tipos y datos.
- Abrir `db/load.sql` y explicar: tabla temporal de texto → `\copy` del CSV → inserción con conversión de tipos (fecha a DATE, año a SMALLINT, vacíos a NULL) → índices → conteo.
- Mostrar la evidencia: `COPY 7787`, `INSERT 0 7787` y el conteo final (100 % de los datos).
- Puede correrse otra vez en vivo en el **SQL Editor** de Neon: `SELECT count(*) FROM titles;`

## 4. Funciones serverless (2 min)
- Abrir `api/titles.js` y `api/stats.js`: cada archivo de `api/` es una función independiente.
- Explicar: se ejecutan solo cuando llega una petición; la credencial `DATABASE_URL` vive en variables de entorno del servidor, nunca en el navegador; las consultas usan parámetros (evita inyección SQL); el pool está fuera del handler para reutilizar la conexión en invocaciones "calientes".
- Mostrar en el navegador `…/api/titles?id=s1` y `…/api/stats` devolviendo JSON.

## 5. Despliegue y estructura (1 min)
- Mostrar el árbol de carpetas y el panel de **Deployments** de Vercel.
- Comandos: `vercel link`, `vercel integration add neon`, `psql -f db/load.sql`, `vercel deploy --prod`.

## 6. Demo (1 min)
- Tarjetas y gráficas.
- Buscar por ID: `s4402` (Narcos). Buscar por título: `narcos`, filtrar por Series, paginar, clic en una fila.
- Buscar un ID que no existe (`zz`) para mostrar el manejo de errores.

## 7. Justificación con conceptos de clase (1–2 min). Es lo que más puntúa
- **Serverless = FaaS + BaaS:** Vercel Functions (FaaS) y Neon (base de datos como servicio).
- **Sin administrar infraestructura:** no creamos servidores ni contenedores; el proveedor empaqueta el código y lo corre en contenedores/microVMs efímeros. Serverless es una abstracción por encima de la contenerización.
- **Escalado automático y a cero:** funciones y base se apagan sin tráfico; pago por uso (todo en planes gratuitos).
- **Funciones sin estado (stateless):** el estado vive en la base; cada invocación es independiente.
- **Arranque en frío vs. en caliente** (cold/warm start): por eso reutilizamos la conexión.
- **Por qué Neon y no Firestore:** el dataset es tabular, SQL conserva tipos y permite un script de carga reproducible. **Por qué Vercel y no Firebase Functions:** Firebase Functions exige plan con tarjeta, y Vercel corre sobre AWS Lambda con plan gratuito.

## 8. Cierre (30 s)
- Resumen y enlace. Subir el video como **público o no listado con acceso abierto** y pegar el enlace en el documento.
