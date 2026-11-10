const PAGE_SIZE = 20;
const state = { q: "", type: "", page: 1, total: 0 };

const $ = (id) => document.getElementById(id);

const escapeHtml = (value) =>
  String(value ?? "—").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function getJson(url) {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
  return body;
}

async function loadStats() {
  const { byType, byYear, byCountry } = await getJson("/api/stats");
  const total = byType.reduce((sum, t) => sum + t.total, 0);
  const count = (type) => byType.find((t) => t.type === type)?.total ?? 0;
  $("cards").innerHTML = [
    ["Total de títulos", total],
    ["Películas", count("Movie")],
    ["Series", count("TV Show")],
  ]
    .map(([label, value]) => `<div class="card"><span>${label}</span><strong>${value.toLocaleString("es")}</strong></div>`)
    .join("");

  new Chart($("chartYear"), {
    type: "bar",
    data: { labels: byYear.map((r) => r.year), datasets: [{ label: "Títulos", data: byYear.map((r) => r.total), backgroundColor: "#e50914" }] },
    options: { plugins: { legend: { display: false } } },
  });
  new Chart($("chartCountry"), {
    type: "bar",
    data: { labels: byCountry.map((r) => r.country), datasets: [{ label: "Títulos", data: byCountry.map((r) => r.total), backgroundColor: "#564d4d" }] },
    options: { indexAxis: "y", plugins: { legend: { display: false } } },
  });
}

async function loadTable() {
  const params = new URLSearchParams({ page: state.page, pageSize: PAGE_SIZE });
  if (state.q) params.set("q", state.q);
  if (state.type) params.set("type", state.type);
  const data = await getJson(`/api/titles?${params}`);
  state.total = data.total;

  $("rows").innerHTML = data.items
    .map(
      (t) => `<tr data-id="${escapeHtml(t.show_id)}">
        <td>${escapeHtml(t.show_id)}</td><td>${escapeHtml(t.title)}</td><td>${escapeHtml(t.type)}</td>
        <td>${escapeHtml(t.country)}</td><td>${escapeHtml(t.release_year)}</td>
        <td>${escapeHtml(t.rating)}</td><td>${escapeHtml(t.duration)}</td></tr>`,
    )
    .join("");

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  $("summary").textContent = `${data.total.toLocaleString("es")} resultados`;
  $("pageInfo").textContent = `Página ${state.page} de ${pages}`;
  $("prev").disabled = state.page <= 1;
  $("next").disabled = state.page >= pages;
}

async function showDetail(id) {
  const box = $("detail");
  box.hidden = false;
  try {
    const t = await getJson(`/api/titles?id=${encodeURIComponent(id)}`);
    box.innerHTML = `
      <h3>${escapeHtml(t.title)} <small>(${escapeHtml(t.show_id)})</small></h3>
      <p>${escapeHtml(t.description)}</p>
      <dl>
        <dt>Tipo</dt><dd>${escapeHtml(t.type)}</dd>
        <dt>Director</dt><dd>${escapeHtml(t.director)}</dd>
        <dt>Reparto</dt><dd>${escapeHtml(t.cast_members)}</dd>
        <dt>País</dt><dd>${escapeHtml(t.country)}</dd>
        <dt>Agregado a Netflix</dt><dd>${escapeHtml(t.date_added)}</dd>
        <dt>Año de estreno</dt><dd>${escapeHtml(t.release_year)}</dd>
        <dt>Clasificación</dt><dd>${escapeHtml(t.rating)}</dd>
        <dt>Duración</dt><dd>${escapeHtml(t.duration)}</dd>
        <dt>Géneros</dt><dd>${escapeHtml(t.listed_in)}</dd>
      </dl>`;
  } catch (err) {
    box.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

$("idForm").addEventListener("submit", (e) => {
  e.preventDefault();
  showDetail($("idInput").value.trim());
});

$("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  state.q = $("qInput").value.trim();
  state.type = $("typeSelect").value;
  state.page = 1;
  loadTable().catch(showError);
});

$("rows").addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-id]");
  if (row) showDetail(row.dataset.id);
});

$("prev").addEventListener("click", () => { state.page--; loadTable().catch(showError); });
$("next").addEventListener("click", () => { state.page++; loadTable().catch(showError); });

function showError(err) {
  $("summary").innerHTML = `<span class="error">${escapeHtml(err.message)}</span>`;
}

loadStats().catch(showError);
loadTable().catch(showError);
