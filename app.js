"use strict";

/* ==========================================================================
   ARKEION — archivo personal de apuntes de idiomas
   Todo se guarda en localStorage. No hay servidor ni cuentas.
   ========================================================================== */

const KEY = "arkeion.v1";

const DEFAULT_CATEGORIES = [
  { id: "vocab", name: "Vocabulario" },
  { id: "phrases", name: "Frases" },
  { id: "grammar", name: "Gramática" },
  { id: "notes", name: "Mis notas" },
];

/* ---------- Utilidades ---------- */

const $ = (sel) => document.querySelector(sel);
const app = $("#app");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const now = () => new Date().toISOString();
const clone = (x) => JSON.parse(JSON.stringify(x));
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
const sigil = (name) => (name.trim()[0] || "·").toUpperCase();
const preview = (n) =>
  (n.content || n.examples || n.personal || "").replace(/\s+/g, " ").trim().slice(0, 90);
const noteMatches = (n, term) =>
  [n.title, n.content, n.examples, n.personal].some((t) => (t || "").toLowerCase().includes(term));
const block = (title, text) =>
  text && text.trim()
    ? `<section class="block"><h3>${title}</h3><div class="text">${esc(text)}</div></section>`
    : "";

let toastTimer;
function toast(msg) {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

/* ---------- Almacenamiento ---------- */

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    if (data && Array.isArray(data.languages)) return data;
  } catch (_) { /* datos dañados: empezamos de cero */ }
  return { version: 1, languages: [] };
}

let db = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (_) {
    toast("No se pudo guardar. Revisa el espacio disponible del navegador.");
  }
}

const getLang = (id) => db.languages.find((l) => l.id === id);

function findNote(id) {
  for (const lang of db.languages) {
    const note = lang.notes.find((n) => n.id === id);
    if (note) return { lang, note };
  }
  return null;
}

/* ---------- Navegación ---------- */

function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [head, a, b, c] = parts;

  if (!head) return viewArchive();
  if (head === "ajustes") return viewSettings();
  if (head === "lang" && a && b) return viewCategory(a, b);
  if (head === "lang" && a) return viewLanguage(a);
  if (head === "nota" && a === "nueva") return viewEditor(null, b, c);
  if (head === "nota" && a && b === "editar") return viewEditor(a);
  if (head === "nota" && a) return viewNote(a);
  notFound();
}

function setTop(title, backHref) {
  const back = $("#back");
  back.classList.toggle("hidden", !backHref);
  back.onclick = () => { location.hash = backHref; };
  document.title = title === "Archivo" ? "ARKEION" : `${title} · ARKEION`;
}

function notFound() {
  setTop("No encontrado", "#/");
  app.innerHTML = `
    <p class="empty">Esta página no existe en tu archivo.</p>
    <a class="btn" href="#/">Volver al archivo</a>`;
}

/* ---------- Componentes ---------- */

function renderNoteList(notes, lang, emptyMsg, showCat = true) {
  if (!notes.length) return `<p class="empty">${esc(emptyMsg)}</p>`;
  return `<div class="list">${notes
    .map((n) => {
      const cat = lang.categories.find((c) => c.id === n.categoryId);
      const label = showCat && cat ? `${cat.name} · ` : "";
      return `
        <a class="row note-row" href="#/nota/${esc(n.id)}">
          <span class="note-title">${esc(n.title)}</span>
          <span class="note-preview">${esc(label + preview(n))}</span>
        </a>`;
    })
    .join("")}</div>`;
}

/* ---------- Vistas ---------- */

function viewArchive() {
  setTop("Archivo");
  const langs = db.languages;

  app.innerHTML = `
    <section class="intro">
      <p class="kicker">Biblioteca personal</p>
      <h1>Archivo</h1>
      <p class="motto">ARKEION no te dice qué aprender. Guarda lo que tú decides aprender.</p>
    </section>

    ${langs.length
      ? `<div class="grid">${langs
          .map((l) => `
            <a class="card" href="#/lang/${esc(l.id)}">
              <span class="sigil">${esc(sigil(l.name))}</span>
              <span class="card-title">${esc(l.name)}</span>
              <span class="card-meta">${l.notes.length} ${l.notes.length === 1 ? "apunte" : "apuntes"}</span>
            </a>`)
          .join("")}</div>`
      : `<p class="empty">Tu archivo está vacío. Añade el primer idioma para comenzar.</p>`}

    <form id="addLang" class="panel">
      <label class="field">Nuevo idioma
        <input name="name" required maxlength="40" autocomplete="off"
               placeholder="p. ej. Japonés, Coreano, Inglés">
      </label>
      <button class="btn primary" type="submit">+ Añadir idioma</button>
    </form>`;

  $("#addLang").onsubmit = (e) => {
    e.preventDefault();
    const name = String(new FormData(e.target).get("name")).trim();
    if (!name) return;
    if (db.languages.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
      toast("Ese idioma ya está en tu archivo");
      return;
    }
    const lang = { id: uid(), name, categories: clone(DEFAULT_CATEGORIES), notes: [], created: now() };
    db.languages.push(lang);
    save();
    location.hash = `#/lang/${lang.id}`;
  };
}

function viewLanguage(lid) {
  const lang = getLang(lid);
  if (!lang) return notFound();
  setTop(lang.name, "#/");

  app.innerHTML = `
    <section class="intro">
      <p class="kicker">Idioma</p>
      <h1>${esc(lang.name)}</h1>
      <p class="motto">${lang.notes.length} ${lang.notes.length === 1 ? "apunte guardado" : "apuntes guardados"}</p>
    </section>

    <input class="search" id="q" type="search" autocomplete="off"
           placeholder="Buscar en ${esc(lang.name)}…">
    <div id="results"></div>

    <div id="cats" class="stack">
      <h2 class="section-title">Categorías</h2>
      <div class="list">
        ${lang.categories
          .map((c) => `
            <a class="row" href="#/lang/${esc(lang.id)}/${esc(c.id)}">
              <span>${esc(c.name)}</span>
              <span class="count">${lang.notes.filter((n) => n.categoryId === c.id).length}</span>
            </a>`)
          .join("")}
      </div>
      <form id="addCat" class="panel inline">
        <label class="field">Nueva categoría
          <input name="name" required maxlength="40" autocomplete="off"
                 placeholder="p. ej. Kanji, Verbos">
        </label>
        <button class="btn" type="submit">Crear</button>
      </form>
    </div>

    <a class="btn primary wide" href="#/nota/nueva/${esc(lang.id)}/-">+ Nuevo apunte</a>`;

  $("#q").oninput = (e) => {
    const term = e.target.value.trim().toLowerCase();
    $("#cats").classList.toggle("hidden", !!term);
    $("#results").innerHTML = term
      ? renderNoteList(lang.notes.filter((n) => noteMatches(n, term)), lang, "Sin coincidencias")
      : "";
  };

  $("#addCat").onsubmit = (e) => {
    e.preventDefault();
    const name = String(new FormData(e.target).get("name")).trim();
    if (!name) return;
    if (lang.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast("Ya existe una categoría con ese nombre");
      return;
    }
    lang.categories.push({ id: uid(), name });
    save();
    route();
  };
}

function viewCategory(lid, cid) {
  const lang = getLang(lid);
  const cat = lang?.categories.find((c) => c.id === cid);
  if (!lang || !cat) return notFound();
  setTop(cat.name, `#/lang/${lang.id}`);

  const notes = lang.notes
    .filter((n) => n.categoryId === cid)
    .sort((x, y) => y.updated.localeCompare(x.updated));
  const canDelete = notes.length === 0 && lang.categories.length > 1;

  app.innerHTML = `
    <section class="intro">
      <p class="kicker">${esc(lang.name)}</p>
      <h1>${esc(cat.name)}</h1>
    </section>

    <a class="btn primary wide" href="#/nota/nueva/${esc(lang.id)}/${esc(cid)}">+ Nuevo apunte</a>

    ${renderNoteList(notes, lang, "Aún no hay apuntes en esta categoría.", false)}

    ${canDelete ? `<button class="btn danger wide" id="delCat" type="button">Eliminar categoría vacía</button>` : ""}`;

  $("#delCat")?.addEventListener("click", () => {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    lang.categories = lang.categories.filter((c) => c.id !== cid);
    save();
    location.hash = `#/lang/${lang.id}`;
  });
}

function viewNote(nid) {
  const found = findNote(nid);
  if (!found) return notFound();
  const { lang, note } = found;
  const cat = lang.categories.find((c) => c.id === note.categoryId);
  const backHref = cat ? `#/lang/${lang.id}/${cat.id}` : `#/lang/${lang.id}`;
  setTop(note.title, backHref);

  app.innerHTML = `
    <article class="page">
      <div>
        <p class="kicker">${esc(lang.name)} · ${esc(cat ? cat.name : "Sin categoría")}</p>
        <h1>${esc(note.title)}</h1>
      </div>
      ${block("Contenido", note.content)}
      ${block("Ejemplos", note.examples)}
      ${block("Notas personales", note.personal)}
      <p class="stamp">Creado el ${fmtDate(note.created)} · Modificado el ${fmtDate(note.updated)}</p>
    </article>

    <div class="actions">
      <a class="btn primary" href="#/nota/${esc(note.id)}/editar">Editar</a>
      <button class="btn danger" id="delNote" type="button">Eliminar</button>
    </div>`;

  $("#delNote").onclick = () => {
    if (!confirm("¿Eliminar este apunte? No se puede deshacer.")) return;
    lang.notes = lang.notes.filter((n) => n.id !== note.id);
    save();
    location.hash = backHref;
  };
}

function viewEditor(nid, lid, cid) {
  let lang, note, backHref;

  if (nid) {
    const found = findNote(nid);
    if (!found) return notFound();
    ({ lang, note } = found);
    backHref = `#/nota/${note.id}`;
  } else {
    lang = getLang(lid);
    if (!lang) return notFound();
    const catId = lang.categories.some((c) => c.id === cid) ? cid : lang.categories[0]?.id;
    note = { categoryId: catId, title: "", content: "", examples: "", personal: "" };
    backHref = `#/lang/${lang.id}`;
  }

  setTop(nid ? "Editar apunte" : "Nuevo apunte", backHref);

  app.innerHTML = `
    <form id="noteForm" class="editor">
      <p class="kicker">${esc(lang.name)}</p>

      <label class="field">Título
        <input name="title" required maxlength="120" value="${esc(note.title)}"
               placeholder="p. ej. 食べる, ¿Cómo estás?, て-form">
      </label>

      <label class="field">Categoría
        <select name="categoryId">
          ${lang.categories
            .map((c) => `<option value="${esc(c.id)}" ${c.id === note.categoryId ? "selected" : ""}>${esc(c.name)}</option>`)
            .join("")}
        </select>
      </label>

      <label class="field">Contenido
        <textarea name="content" rows="5" placeholder="Significado, traducción, explicación…">${esc(note.content)}</textarea>
      </label>

      <label class="field">Ejemplos
        <textarea name="examples" rows="4" placeholder="Un ejemplo por línea">${esc(note.examples)}</textarea>
      </label>

      <label class="field">Notas personales
        <textarea name="personal" rows="3" placeholder="Tus propias observaciones">${esc(note.personal)}</textarea>
      </label>

      <div class="actions">
        <button class="btn primary" type="submit">Guardar</button>
        <a class="btn" href="${backHref}">Cancelar</a>
      </div>
    </form>`;

  $("#noteForm").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      title: String(fd.get("title")).trim(),
      categoryId: String(fd.get("categoryId")),
      content: String(fd.get("content")).trim(),
      examples: String(fd.get("examples")).trim(),
      personal: String(fd.get("personal")).trim(),
    };
    if (!data.title) return;

    const t = now();
    let target;
    if (nid) {
      Object.assign(note, data, { updated: t });
      target = note;
    } else {
      target = { id: uid(), languageId: lang.id, ...data, created: t, updated: t };
      lang.notes.push(target);
    }
    save();
    location.hash = `#/nota/${target.id}`;
  };
}

function viewSettings() {
  setTop("Ajustes", "#/");
  const totalNotes = db.languages.reduce((sum, l) => sum + l.notes.length, 0);

  app.innerHTML = `
    <section class="intro">
      <p class="kicker">Configuración</p>
      <h1>Ajustes</h1>
      <p class="motto">Tu archivo vive solo en este dispositivo. Exporta una copia de seguridad de vez en cuando.</p>
    </section>

    <div class="list">
      <div class="row"><span>Idiomas</span><span class="count">${db.languages.length}</span></div>
      <div class="row"><span>Apuntes</span><span class="count">${totalNotes}</span></div>
    </div>

    <section class="stack">
      <h2 class="section-title">Copia de seguridad</h2>
      <button class="btn primary wide" id="export" type="button">Exportar archivo (.json)</button>
      <label class="btn wide file-btn">Importar archivo (.json)
        <input id="import" type="file" accept="application/json,.json">
      </label>
      <p class="hint">Importar reemplaza el contenido actual del archivo.</p>
    </section>

    <section class="stack">
      <h2 class="section-title">Zona peligrosa</h2>
      <button class="btn danger wide" id="wipe" type="button">Borrar todo el archivo</button>
    </section>`;

  $("#export").onclick = exportData;
  $("#import").onchange = importData;
  $("#wipe").onclick = () => {
    if (!confirm("¿Borrar TODO el archivo? Esta acción no se puede deshacer.")) return;
    db = { version: 1, languages: [] };
    save();
    location.hash = "#/";
  };
}

/* ---------- Exportar / importar ---------- */

function exportData() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `arkeion-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeLanguage(l) {
  const valid = Array.isArray(l.categories) ? l.categories.filter((c) => c && c.id && c.name) : [];
  const categories = valid.length ? valid : clone(DEFAULT_CATEGORIES);
  const notes = (Array.isArray(l.notes) ? l.notes : [])
    .filter((n) => n && n.id)
    .map((n) => ({
      ...n,
      categoryId: categories.some((c) => c.id === n.categoryId) ? n.categoryId : categories[0].id,
    }));
  return {
    id: String(l.id ?? uid()),
    name: String(l.name ?? "Sin nombre"),
    categories,
    notes,
    created: l.created ?? now(),
  };
}

async function importData(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || !Array.isArray(data.languages)) throw new Error("formato inválido");
    const languages = data.languages.map(sanitizeLanguage);
    const notesCount = languages.reduce((sum, l) => sum + l.notes.length, 0);
    if (!confirm(`Se reemplazará tu archivo actual por ${languages.length} idioma(s) y ${notesCount} apunte(s). ¿Continuar?`)) return;
    db = { version: 1, languages };
    save();
    toast("Archivo importado");
    route();
  } catch (_) {
    toast("No se pudo importar: el archivo no es válido");
  }
}

/* ---------- Arranque ---------- */

window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
