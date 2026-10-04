const $ = id => document.getElementById(id);
const state = { articles: [], likes: JSON.parse(localStorage.getItem("globenews-likes") || "{}") };

function esc(s="") {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function fmt(date) {
  if (!date) return "";
  try { return new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short"}).format(new Date(date)); }
  catch { return date; }
}
function filtered() {
  const q = $("search").value.trim().toLowerCase();
  return state.articles.filter(a => !q || `${a.title} ${a.description}`.toLowerCase().includes(q));
}
function render() {
  const list = filtered();
  $("newsGrid").innerHTML = list.map((a,i) => {
    const liked = !!state.likes[a.id];
    const image = a.image ? `<img src="${esc(a.image)}" alt="" loading="lazy" onerror="this.style.display='none'">` : "";
    return `<article class="card">
      ${image}
      <div class="cardbody">
        <div class="source">${esc(a.source?.name || "Sumber berita")} · <span class="date">${esc(fmt(a.publishedAt))}</span></div>
        <h2>${esc(a.title)}</h2>
        <p class="desc">${esc(a.description || "")}</p>
        <div class="actions">
          <a class="read" href="${esc(a.url || "#")}" target="_blank" rel="noopener">Baca sumber ↗</a>
          <button class="like ${liked ? "active":""}" data-like="${esc(a.id)}">${liked ? "♥" : "♡"} ${liked ? "Disukai" : "Suka"}</button>
        </div>
      </div>
    </article>`;
  }).join("") || `<div class="notice">Tidak ada berita yang cocok dengan pencarian.</div>`;

  document.querySelectorAll("[data-like]").forEach(btn => btn.onclick = () => {
    const id = btn.dataset.like;
    if (state.likes[id]) delete state.likes[id]; else state.likes[id] = true;
    localStorage.setItem("globenews-likes", JSON.stringify(state.likes));
    render();
  });
}

async function health() {
  try {
    const r = await fetch("/api/health");
    const d = await r.json();
    $("status").innerHTML = d.live ? "<i></i> LIVE NEWS AKTIF" : "<i></i> API BELUM DIATUR";
    $("status").style.color = d.live ? "#86efac" : "#fbbf24";
  } catch {
    $("status").textContent = "Server tidak tersambung";
  }
}

async function loadNews() {
  const country = $("country").value;
  const category = $("category").value;
  $("lastUpdate").textContent = "Memuat...";
  try {
    const url = `/api/news?country=${encodeURIComponent(country)}&category=${encodeURIComponent(category)}&lang=en&max=10`;
    const r = await fetch(url, {cache:"no-store"});
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Gagal mengambil berita");
    state.articles = d.articles || [];
    const notice = $("notice");
    if (d.live) { notice.classList.add("hidden"); }
    else { notice.textContent = d.warning || "Feed sedang menggunakan data demo."; notice.classList.remove("hidden"); }
    $("lastUpdate").textContent = `Update: ${fmt(new Date())}`;
    render();
  } catch (e) {
    $("notice").textContent = "Gagal mengambil berita live: " + e.message;
    $("notice").classList.remove("hidden");
    $("lastUpdate").textContent = "Gagal update";
  }
}

$("country").onchange = loadNews;
$("category").onchange = loadNews;
$("search").oninput = render;
$("refreshBtn").onclick = loadNews;

health();
loadNews();
setInterval(loadNews, 30000);
