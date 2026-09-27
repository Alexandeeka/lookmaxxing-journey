const DEFAULT_CONTENT = "./content.json";
const GITHUB_CONTENT_URL =
  "https://raw.githubusercontent.com/USERNAME/REPOSITORY/main/content.json";

/*
  GITHUB MODE:
  1. Buka content.json di repo GitHub kamu.
  2. Salin URL RAW-nya.
  3. Tempel ke window.LOOKMAXXING_CONTENT_URL di bawah.
  Jangan pernah menaruh GitHub token/password di file ini.
*/
window.LOOKMAXXING_CONTENT_URL = GITHUB_CONTENT_URL;

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.textContent = value;
}
function safeUrl(url) {
  try {
    const u = new URL(url, location.href);
    return ["http:", "https:", "file:"].includes(u.protocol) ? u.href : "";
  } catch { return ""; }
}
function setImage(id, url) {
  const img = document.getElementById(id);
  if (!img || !url) return;
  const clean = safeUrl(url);
  if (!clean) return;
  img.onload = () => {
    img.style.display = "block";
    const fallback = img.parentElement.querySelector(".image-fallback");
    if (fallback) fallback.style.display = "none";
  };
  img.onerror = () => {
    img.style.display = "none";
  };
  img.src = clean;
}
function setVideo(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";
  if (!url) return;
  const clean = safeUrl(url);
  if (!clean) return;
  el.href = clean;
  el.style.display = "inline-flex";
}
function setStatus(message, ok=false) {
  const el = document.getElementById("contentStatus");
  if (el) el.textContent = message;
  const dot = document.querySelector(".status-dot");
  if (dot) dot.classList.toggle("ok", ok);
}
function renderSection(targetId, data, number) {
  const root = document.getElementById(targetId);
  if (!root || !data) return;
  root.innerHTML = `
    <div class="section-title">
      <div class="section-label"><span>ROADMAP</span><strong>${String(number).padStart(2,"0")}</strong></div>
      <div><h2>${escapeHtml(data.title || "")}</h2><p>${escapeHtml(data.desc || "")}</p></div>
    </div>
    <div class="card-grid">
      ${(data.cards || []).map((card, i) => `
        <article class="info-card">
          <div class="num">${String(i+1).padStart(2,"0")}</div>
          <h3>${escapeHtml(card[0] || "")}</h3>
          <p>${escapeHtml(card[1] || "")}</p>
        </article>`).join("")}
    </div>`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
function renderDictionary(items) {
  const grid = $("#dictionaryGrid");
  if (!grid) return;
  const q = ($("#dictSearch")?.value || "").trim().toLowerCase();
  const filtered = (items || []).filter(([term, def]) =>
    `${term} ${def}`.toLowerCase().includes(q)
  );
  $("#dictCount").textContent = `${filtered.length} istilah`;
  grid.innerHTML = filtered.length ? filtered.map(([term, def]) => `
    <article class="dict-card">
      <div class="dict-term">${escapeHtml(term)}</div>
      <div class="dict-def">${escapeHtml(def)}</div>
    </article>`).join("") : `<div class="empty">Istilah tidak ditemukan. Kalau kamu tahu slang lain yang belum ada, tambahkan sendiri ke <b>content.json</b>.</div>`;
}
function apply(data) {
  const s = data.site || {};
  setText("brandName", s.brand);
  setText("siteTitle", s.title);
  setText("siteSubtitle", s.subtitle);
  setText("siteTag", s.tag);
  setText("siteAccent", s.accent);
  setText("copyright", s.copyright);
  document.title = `${s.title || "LOOKMAXXING ROADMAP"} — ${s.brand || "DIKARCHETYOE"}`;

  const images = data.images || {};
  Object.entries(images).forEach(([key, url]) => setImage(key === "hero" ? "heroImage" : `${key}Image`, url));
  const videos = data.videos || {};
  Object.entries(videos).forEach(([key, url]) => setVideo(key === "main" ? "mainVideo" : `${key}Video`, url));

  const sec = data.sections || {};
  renderSection("sectionFoundation", sec.foundation, 1);
  renderSection("sectionFace", sec.face, 2);
  renderSection("sectionFitness", sec.fitness, 3);
  renderSection("sectionHair", sec.hair, 4);
  renderSection("sectionSkin", sec.skin, 5);
  renderSection("sectionStyle", sec.style, 6);

  renderDictionary(data.dictionary || []);
  const safety = data.safety || {};
  setText("safetyTitle", safety.title);
  const list = $("#safetyList");
  if (list) list.innerHTML = (safety.items || []).map(x => `<li>${escapeHtml(x)}</li>`).join("");
}
async function loadContent() {
  const configured = window.LOOKMAXXING_CONTENT_URL || "";
  const url = configured.includes("USERNAME/REPOSITORY") ? DEFAULT_CONTENT : configured;
  try {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    apply(await res.json());
    setStatus("Konten dimuat dari GitHub", true);
  } catch (err) {
    console.warn("GitHub content failed; loading local content.json.", err);
    try {
      const res = await fetch(`${DEFAULT_CONTENT}?v=${Date.now()}`, { cache: "no-store" });
      apply(await res.json());
      setStatus("GitHub belum diatur — memakai content.json lokal", false);
    } catch (localErr) {
      console.error(localErr);
      apply({});
      setStatus("Konten tidak dapat dimuat", false);
    }
  }
}
$("#dictSearch")?.addEventListener("input", () => {
  if (window.__dictionary) renderDictionary(window.__dictionary);
});
const originalApply = apply;
apply = (data) => {
  window.__dictionary = data.dictionary || [];
  originalApply(data);
};
$("#menuBtn")?.addEventListener("click", () => $("#nav")?.classList.toggle("open"));
$$("nav a").forEach(a => a.addEventListener("click", () => $("#nav")?.classList.remove("open")));
loadContent();
