const CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbyR9vq2YudXuUUV-exq7btMgMQEWrI_8M4b6AQ0EhkZGjCPWHcBkBxHZleun9F1blr5/exec",
  eventName: "Pagelaran Sastra 2026",
  location: "Auditorium Driyarkara, Sanata Dharma",
  contactWa: "083129424923",
  dateText: "Sabtu, 5 Desember 2026",
  maxPerOrder: 10,
  testMode: true,
  bank: {
    name: "Mandiri",
    number: "1360034685690",
    holder: "a.n. Theresia Dian Anggara Kasih"
  },
  qrisImage: "qris.jpg",
  demoCodes: {
    COUPLE26: { type: "bundle", label: "Bundling - Couple" },
    TRIPPLE26: { type: "bundle", label: "Bundling - Tripple" },
    SQUAD26: { type: "bundle", label: "Bundling - Squad" },
    FLASH26: { type: "flash" }
  },
  tickets: [
    { id: "eb", group: "earlybird", label: "Early Bird", name: "Early Bird", price: 30000, quota: 50, size: 1, enabled: true, start: "2026-10-05T15:00:00+07:00", end: "2026-10-12T15:00:00+07:00" },
    { id: "rg-hudoq", group: "reguler", tier: "Reguler", label: "Reguler - Hudoq", name: "Hudoq", price: 35000, quota: 350, size: 1, enabled: false, start: "2026-10-12T15:00:00+07:00", end: "2026-12-04T15:00:00+07:00" },
    { id: "rg-majau", group: "reguler", tier: "VIP", label: "VIP - Majau", name: "Majau", price: 45000, quota: 100, size: 1, enabled: false, start: "2026-10-12T15:00:00+07:00", end: "2026-12-04T15:00:00+07:00" },
    { id: "rg-datun", group: "reguler", tier: "VVIP", label: "VVIP - Datun Julud", name: "Datun Julud", price: 65000, quota: 100, size: 1, enabled: false, start: "2026-10-12T15:00:00+07:00", end: "2026-12-04T15:00:00+07:00" },
    { id: "bd-couple", group: "bundling", label: "Bundling - Couple", name: "Couple", price: 65000, quota: 50, size: 2, enabled: false, start: "2026-11-01T15:00:00+07:00", end: "2026-11-15T15:00:00+07:00" },
    { id: "bd-tripple", group: "bundling", label: "Bundling - Tripple", name: "Tripple", price: 100000, quota: 45, size: 3, enabled: false, start: "2026-11-01T15:00:00+07:00", end: "2026-11-15T15:00:00+07:00" },
    { id: "bd-squad", group: "bundling", label: "Bundling - Squad", name: "Squad", price: 170000, quota: 45, size: 5, enabled: false, start: "2026-11-01T15:00:00+07:00", end: "2026-11-15T15:00:00+07:00" },
    { id: "fs-hudoq", group: "flash", label: "Flash Sale - Hudoq", name: "Hudoq", price: 31500, quota: 50, size: 1, enabled: false, start: "2026-11-20T15:00:00+07:00", end: "2026-11-21T15:00:00+07:00" },
    { id: "fs-majau", group: "flash", label: "Flash Sale - Majau", name: "Majau", price: 41500, quota: 50, size: 1, enabled: false, start: "2026-11-20T15:00:00+07:00", end: "2026-11-21T15:00:00+07:00" },
    { id: "fs-datun", group: "flash", label: "Flash Sale - Datun Julud", name: "Datun Julud", price: 61500, quota: 50, size: 1, enabled: false, start: "2026-11-20T15:00:00+07:00", end: "2026-11-21T15:00:00+07:00" }
  ]
};

const $ = (s) => document.querySelector(s);
const rp = (n) => "Rp " + Number(n).toLocaleString("id-ID");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const state = {
  selected: null,
  qty: 1,
  promo: null,
  people: [],
  idx: 0,
  proof: null
};
let stock = {};
let pollTimer = null;

function showView(id) {
  const views = [...document.querySelectorAll(".view")];
  const cur = views.find((v) => !v.hidden);
  const next = document.getElementById(id);
  if (cur === next) return;
  clearInterval(pollTimer);
  const token = (showView.token = (showView.token || 0) + 1);
  const swap = () => {
    if (token !== showView.token) return;
    views.forEach((v) => {
      v.hidden = v !== next;
      v.classList.remove("leaving", "enter");
    });
    window.scrollTo({ top: 0 });
    next.classList.add("enter");
    if (id === "view-tickets") {
      pollTimer = setInterval(async () => {
        await loadStock();
        renderTickets();
      }, 30000);
    }
  };
  if (cur) {
    cur.classList.add("leaving");
    setTimeout(swap, 250);
  } else {
    swap();
  }
}

function showLoader(msg, sub) {
  $("#loaderText").textContent = msg;
  $("#loaderSub").textContent = sub || "Mohon tunggu sebentar";
  $("#loader").hidden = false;
}

function hideLoader() {
  $("#loader").hidden = true;
}

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2600);
}

async function loadStock() {
  if (!CONFIG.apiUrl) {
    stock = {};
    return;
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(CONFIG.apiUrl + "?action=stock", { signal: ctrl.signal });
    clearTimeout(timer);
    const d = await r.json();
    if (d.ok) stock = d.sold || {};
  } catch (e) {
    toast("Gagal memuat sisa kursi. Coba muat ulang halaman.");
  }
}

function getTicket(id) {
  return CONFIG.tickets.find((t) => t.id === id);
}
function getTicketByLabel(label) {
  return CONFIG.tickets.find((t) => t.label === label);
}
function leftOf(t) {
  return Math.max(0, t.quota - (stock[t.label] || 0));
}
function ticketState(t) {
  if (!t.enabled) return "soon";
  if (!CONFIG.testMode) {
    const now = Date.now();
    if (now < Date.parse(t.start)) return "soon";
    if (now > Date.parse(t.end)) return "ended";
  }
  if (leftOf(t) <= 0) return "soldout";
  return "open";
}
function tagOf(t) {
  if (t.group === "earlybird") return "Terbatas";
  if (t.group === "reguler") return t.tier || "Reguler";
  if (t.group === "bundling") return "Bundling";
  return "Flash sale";
}
function priceHidden(t) {
  return t.group !== "earlybird" && ticketState(t) === "soon";
}
function isBundle(t) {
  return t.group === "bundling";
}
function totalOf(t, qty) {
  return isBundle(t) ? t.price : t.price * qty;
}

function visibleGroups() {
  const groups = [
    { title: "Early Bird", cls: "", list: CONFIG.tickets.filter((t) => t.group === "earlybird") },
    { title: "Reguler", cls: "", list: CONFIG.tickets.filter((t) => t.group === "reguler") }
  ];
  if (state.promo && state.promo.type === "bundle") {
    const t = getTicketByLabel(state.promo.label);
    if (t) groups.unshift({ title: "Paket bundling", cls: "", list: [t] });
  }
  if (state.promo && state.promo.type === "flash") {
    groups.unshift({ title: "Flash sale", cls: "flash", list: CONFIG.tickets.filter((t) => t.group === "flash") });
  }
  return groups;
}

function cardHtml(t) {
  const st = ticketState(t);
  const left = leftOf(t);
  const pct = Math.round((left / t.quota) * 100);
  const btnText = { open: "Pilih tiket", soon: "Segera hadir", ended: "Periode berakhir", soldout: "Habis terjual" }[st];
  const unit = isBundle(t) ? "/ paket " + t.size + " orang" : "/ orang";
  const stockLabel = isBundle(t) ? "Sisa paket" : "Sisa kursi";
  const hide = priceHidden(t);
  return `
    <article class="tcard ${st}">
      <div class="top">
        <span class="tag">${esc(tagOf(t))}</span>
        <h3>${esc(t.name)}</h3>
        ${hide ? '<p class="price hidden-price">Harga segera diumumkan</p>' : `<p class="price">${rp(t.price)} <small>${unit}</small></p>`}
      </div>
      ${hide ? "" : `<div class="stock">
        <div><span>${stockLabel}</span><span>${st === "soon" ? "-" : left + " / " + t.quota}</span></div>
        <div class="bar"><i class="${pct <= 20 ? "low" : ""}" style="width:${st === "soon" ? 0 : pct}%"></i></div>
      </div>`}
      <button class="btn" data-id="${t.id}" ${st === "open" ? "" : "disabled"}>${btnText}</button>
    </article>`;
}

function renderTickets() {
  const sel = state.selected && getTicket(state.selected);
  if (sel && ticketState(sel) !== "open") {
    state.selected = null;
    closeModal("modalQty");
    closeModal("modalConfirm");
    toast("Tiket " + sel.name + " sudah tidak tersedia.");
  }
  const oldGrid = document.querySelector("#ticketGrid .grid");
  const keepScroll = oldGrid ? oldGrid.scrollLeft : 0;
  $("#ticketGrid").innerHTML = `<div class="grid">${visibleGroups().map((g) => g.list.map(cardHtml).join("")).join("")}</div>`;
  $("#ticketGrid").querySelectorAll("button[data-id]").forEach((b) => b.addEventListener("click", () => selectTicket(b.dataset.id)));
  const newGrid = document.querySelector("#ticketGrid .grid");
  if (newGrid) newGrid.scrollLeft = keepScroll;
}

function openModal(id) {
  const m = $("#" + id);
  m.hidden = false;
  const ok = m.querySelector(".btn-red");
  if (ok) ok.focus();
}

function closeModal(id) {
  $("#" + id).hidden = true;
}

function selectTicket(id) {
  const t = getTicket(id);
  state.selected = id;
  state.qty = isBundle(t) ? t.size : 1;
  renderQtyModal();
  openModal("modalQty");
}

function renderQtyModal() {
  const t = currentTicket();
  const bundle = isBundle(t);
  const max = maxQty(t);
  $("#mqTag").textContent = tagOf(t);
  $("#mqTitle").textContent = t.name;
  $("#mqPrice").textContent = rp(t.price) + (bundle ? " / paket " + t.size + " orang" : " / orang");
  $("#mqCtrl").hidden = bundle;
  $("#mqVal").textContent = state.qty;
  $("#mqMinus").disabled = state.qty <= 1;
  $("#mqPlus").disabled = state.qty >= max;
  $("#mqNote").textContent = bundle ? "Paket untuk " + t.size + " orang" : state.qty >= max ? "Batas pembelian tercapai" : "Pilih jumlah tiket";
  $("#mqTotal").textContent = rp(totalOf(t, state.qty));
}

function categoryName(t) {
  if (t.group === "bundling") return "Bundling " + t.name;
  if (t.group === "flash") return "Flash sale " + t.name;
  if (t.group === "reguler") return (t.tier || "Reguler") + " " + t.name;
  return t.name;
}

function renderConfirm() {
  const t = currentTicket();
  const n = state.qty;
  $("#cfText").innerHTML = isBundle(t)
    ? `Kamu akan memesan paket <b>${esc(categoryName(t))}</b> untuk <b>${n} orang</b>.`
    : `Kamu akan memesan tiket kategori <b>${esc(categoryName(t))}</b> sebanyak <b>${n} tiket</b>.`;
  $("#cfTotal").textContent = rp(totalOf(t, n));
}

function maxQty(t) {
  return Math.max(1, Math.min(CONFIG.maxPerOrder, leftOf(t)));
}

async function applyPromo() {
  const code = $("#promoInput").value.trim().toUpperCase();
  const msg = $("#promoMsg");
  if (!code) {
    msg.className = "promo-msg bad";
    msg.textContent = "Masukkan kode promo dulu.";
    return;
  }
  msg.className = "promo-msg";
  msg.textContent = "Memeriksa kode...";
  let res;
  try {
    if (CONFIG.apiUrl) {
      const r = await fetch(CONFIG.apiUrl + "?action=code&code=" + encodeURIComponent(code));
      res = await r.json();
    } else {
      const d = CONFIG.demoCodes[code];
      res = d ? Object.assign({ ok: true }, d) : { ok: false, message: "Kode tidak ditemukan." };
    }
  } catch (e) {
    msg.className = "promo-msg bad";
    msg.textContent = "Tidak bisa terhubung ke server. Coba lagi.";
    return;
  }
  if (!res.ok) {
    msg.className = "promo-msg bad";
    msg.textContent = res.message || "Kode tidak valid.";
    return;
  }
  state.promo = { code, type: res.type, label: res.label || null };
  state.selected = null;
  await loadStock();
  if (res.type === "bundle") {
    const t = getTicketByLabel(res.label);
    const st = t ? ticketState(t) : "soon";
    if (st === "open") {
      msg.className = "promo-msg ok";
      msg.textContent = "Kode diterima. Paket " + t.name + " untuk " + t.size + " orang sudah tersedia di bawah.";
      renderTickets();
      return;
    }
    msg.className = "promo-msg bad";
    msg.textContent = st === "soldout" ? "Kode valid, tetapi paket ini sudah habis." : "Kode valid, tetapi paket ini belum dibuka atau sudah berakhir.";
  } else {
    msg.className = "promo-msg ok";
    msg.textContent = "Kode flash sale diterima. Harga spesial tampil di bawah.";
  }
  renderTickets();
}

function currentTicket() {
  return getTicket(state.selected);
}

function goData() {
  const t = currentTicket();
  const n = state.qty;
  const old = state.people;
  state.people = Array.from({ length: n }, (_, i) => old[i] || { email: "", nama: "", hp: "", instansi: "", info: "" });
  state.idx = 0;
  renderPerson();
  showView("view-data");
}

function renderPerson() {
  const t = currentTicket();
  const n = state.people.length;
  const i = state.idx;
  const p = state.people[i];
  $("#dataStepLabel").textContent = "Langkah 2 dari 3" + (n > 1 ? " - Pemesan " + (i + 1) + " dari " + n : "");
  $("#dataTitle").textContent = n > 1 ? "Data pemesan ke-" + (i + 1) : "Data pemesan";
  $("#dataDots").innerHTML = n > 1 ? Array.from({ length: n }, (_, k) => `<i class="${k < i ? "done" : k === i ? "on" : ""}"></i>`).join("") : "";
  $("#sumKategori").textContent = categoryName(t);
  $("#sumKe").textContent = i + 1 + " dari " + n;
  $("#sumTotal").textContent = rp(totalOf(t, n));
  $("#fEmail").value = p.email;
  $("#fNama").value = p.nama;
  $("#fHp").value = p.hp;
  $("#fInstansi").value = p.instansi;
  $("#fInfo").value = p.info;
  $("#btnDataNext").textContent = i < n - 1 ? "Simpan dan lanjut ke orang ke-" + (i + 2) : "Simpan dan lanjut ke pembayaran";
  document.querySelectorAll("#personForm input").forEach((el) => el.classList.remove("invalid"));
  document.querySelectorAll("[data-err]").forEach((el) => (el.textContent = ""));
}

function validatePerson() {
  const v = {
    email: $("#fEmail").value.trim(),
    nama: $("#fNama").value.trim(),
    hp: $("#fHp").value.trim(),
    instansi: $("#fInstansi").value.trim(),
    info: $("#fInfo").value.trim()
  };
  const digits = v.hp.replace(/\D/g, "");
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = "Masukkan alamat email yang valid.";
  if (v.nama.length < 3) errors.nama = "Isi nama lengkap sesuai identitas.";
  if (digits.length < 9 || digits.length > 15) errors.hp = "Isi nomor HP dengan 9 sampai 15 angka.";
  if (!v.instansi) errors.instansi = "Isi asal institusi.";
  if (!v.info) errors.info = "Isi dari mana kamu tahu acara ini.";
  const map = { email: "#fEmail", nama: "#fNama", hp: "#fHp", instansi: "#fInstansi", info: "#fInfo" };
  Object.keys(map).forEach((k) => {
    $(map[k]).classList.toggle("invalid", !!errors[k]);
    document.querySelector(`[data-err="${k}"]`).textContent = errors[k] || "";
  });
  return Object.keys(errors).length ? null : v;
}

function goPay() {
  const t = currentTicket();
  const n = state.people.length;
  const kategori = categoryName(t);
  $("#paySummary").innerHTML =
    state.people.map((p) => `<div class="person"><b>${esc(p.nama)}</b><small>${esc(kategori)} - ${esc(p.instansi)}</small></div>`).join("") +
    `<div class="sum-total"><span>Total bayar</span><b>${rp(totalOf(t, n))}</b></div>`;
  $("#bankName").textContent = CONFIG.bank.name;
  $("#bankHolder").textContent = CONFIG.bank.holder;
  $("#bankNumber").textContent = CONFIG.bank.number;
  $("#qrisImg").src = CONFIG.qrisImage;
  $("#proofErr").textContent = "";
  $("#submitErr").textContent = "";
  showView("view-pay");
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Gagal membaca file"));
    r.readAsDataURL(file);
  });
}

function compressImage(file) {
  return new Promise(async (resolve) => {
    const raw = await readAsDataUrl(file);
    const img = new Image();
    img.onload = () => {
      const max = 1400;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve({ dataUrl: c.toDataURL("image/jpeg", 0.82), mime: "image/jpeg", name: file.name.replace(/\.[^.]+$/, "") + ".jpg" });
    };
    img.onerror = () => resolve({ dataUrl: raw, mime: file.type || "image/jpeg", name: file.name });
    img.src = raw;
  });
}

async function handleFile(file) {
  const err = $("#proofErr");
  err.textContent = "";
  if (!file) return;
  if (!/^image\//.test(file.type) && !/\.(heic|heif)$/i.test(file.name)) {
    err.textContent = "File harus berupa foto (JPG, PNG, HEIC).";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    err.textContent = "Ukuran foto maksimal 5 MB.";
    return;
  }
  state.proof = await compressImage(file);
  $("#proofPreview").src = state.proof.dataUrl;
  $("#proofPreview").hidden = false;
  $("#dropText").textContent = "Foto terpilih. Klik foto ini untuk menggantinya.";
  $("#dropzone").classList.add("has");
}

async function submitOrder() {
  const t = currentTicket();
  if (!state.proof) {
    $("#proofErr").textContent = "Upload bukti pembayaran dulu.";
    return;
  }
  $("#submitErr").textContent = "";
  showLoader("Mengirim pemesanan...", "Jangan tutup halaman ini");
  $("#btnSubmit").disabled = true;
  const payload = {
    ticketLabel: t.label,
    qty: state.people.length,
    promoCode: state.promo ? state.promo.code : "",
    people: state.people,
    proof: { name: state.proof.name, mime: state.proof.mime, data: state.proof.dataUrl.split(",")[1] }
  };
  try {
    let res;
    if (CONFIG.apiUrl) {
      const r = await fetch(CONFIG.apiUrl, { method: "POST", body: JSON.stringify(payload) });
      res = await r.json();
    } else {
      await new Promise((ok) => setTimeout(ok, 900));
      res = { ok: true, orderCode: "PBSI-DEMO-0000", total: totalOf(t, payload.qty) };
    }
    if (!res.ok) throw new Error(res.message || "Pemesanan gagal diproses.");
    finish(res, t);
  } catch (e) {
    $("#submitErr").textContent = e.message || "Terjadi kesalahan. Coba lagi.";
    await loadStock();
  } finally {
    hideLoader();
    $("#btnSubmit").disabled = false;
  }
}

function finish(res, t) {
  const n = state.people.length;
  $("#doneCode").textContent = res.orderCode;
  $("#doneKategori").textContent = categoryName(t);
  $("#doneQty").textContent = isBundle(t) ? "1 paket (" + n + " orang)" : n + " tiket";
  $("#doneName").textContent = state.people[0].nama + (n > 1 ? " +" + (n - 1) + " lainnya" : "");
  $("#doneDate").textContent = CONFIG.dateText;
  $("#doneLoc").textContent = CONFIG.location;
  $("#doneEvent").textContent = CONFIG.eventName;
  $("#doneTotal").textContent = rp(res.total);
  const emails = [...new Set(state.people.map((p) => p.email))];
  $("#doneMail").textContent = "Bukti pemesanan dikirim ke " + emails.join(", ") + ". Cek juga folder spam.";
  showView("view-done");
}

function resetAll() {
  state.selected = null;
  state.qty = 1;
  state.promo = null;
  state.people = [];
  state.idx = 0;
  state.proof = null;
  $("#promoInput").value = "";
  $("#promoMsg").textContent = "";
  $("#proofPreview").hidden = true;
  $("#proofInput").value = "";
  $("#dropText").textContent = "Klik atau seret foto bukti transfer ke sini";
  $("#dropzone").classList.remove("has");
  showView("view-home");
}

function initHome() {
  document.title = CONFIG.eventName + " - Tiket";
  $("#eventName").textContent = CONFIG.eventName;
  $("#metaDate").textContent = CONFIG.dateText;
  $("#metaLocation").textContent = CONFIG.location;
  $("#btnContact").href = "https://wa.me/" + CONFIG.contactWa + "?text=" + encodeURIComponent("Halo panitia " + CONFIG.eventName + ", saya ingin bertanya.");
}

document.querySelectorAll(".js-buy").forEach((b) => b.addEventListener("click", async () => {
  showView("view-tickets");
  $("#ticketGrid").innerHTML = "";
  showLoader("Memuat tiket...", "Mohon tunggu sebentar");
  await Promise.all([loadStock(), sleep(600)]);
  hideLoader();
  renderTickets();
}));
$("#btnBackHome").addEventListener("click", () => showView("view-home"));
$("#btnPromo").addEventListener("click", applyPromo);
$("#promoInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") applyPromo();
});
$("#mqMinus").addEventListener("click", () => {
  if (state.qty > 1) state.qty--;
  renderQtyModal();
});
$("#mqPlus").addEventListener("click", () => {
  const t = currentTicket();
  if (t && state.qty < maxQty(t)) state.qty++;
  renderQtyModal();
});
$("#mqCancel").addEventListener("click", () => {
  state.selected = null;
  closeModal("modalQty");
});
$("#mqOk").addEventListener("click", () => {
  renderConfirm();
  closeModal("modalQty");
  openModal("modalConfirm");
});
$("#cfBack").addEventListener("click", () => {
  closeModal("modalConfirm");
  renderQtyModal();
  openModal("modalQty");
});
$("#cfOk").addEventListener("click", async () => {
  if ($("#cfOk").disabled) return;
  $("#cfOk").disabled = true;
  closeModal("modalConfirm");
  showLoader("Menyiapkan formulir...", "Mohon tunggu sebentar");
  try {
    await Promise.all([loadStock(), sleep(600)]);
  } finally {
    hideLoader();
    $("#cfOk").disabled = false;
  }
  const t = currentTicket();
  if (!t || ticketState(t) !== "open") {
    state.selected = null;
    renderTickets();
    toast("Tiket sudah tidak tersedia.");
    return;
  }
  if (!isBundle(t) && state.qty > leftOf(t)) state.qty = leftOf(t);
  goData();
});
document.querySelectorAll(".modal").forEach((m) =>
  m.addEventListener("click", (e) => {
    if (e.target === m) {
      state.selected = null;
      m.hidden = true;
    }
  })
);
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".modal").forEach((m) => {
    if (!m.hidden) {
      state.selected = null;
      m.hidden = true;
    }
  });
});
let savingPerson = false;
$("#personForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (savingPerson) return;
  const v = validatePerson();
  if (!v) return;
  savingPerson = true;
  state.people[state.idx] = v;
  const last = state.idx >= state.people.length - 1;
  showLoader(last ? "Menyiapkan pembayaran..." : "Menyimpan data...", "Mohon tunggu sebentar");
  await sleep(600);
  hideLoader();
  savingPerson = false;
  if (!last) {
    state.idx++;
    renderPerson();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    goPay();
  }
});
$("#btnDataBack").addEventListener("click", () => {
  if (state.idx > 0) {
    state.idx--;
    renderPerson();
  } else {
    showView("view-tickets");
    renderTickets();
  }
});
$("#btnPayBack").addEventListener("click", () => {
  state.idx = state.people.length - 1;
  renderPerson();
  showView("view-data");
});
$("#btnCopy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(CONFIG.bank.number);
    toast("Nomor rekening disalin");
  } catch (e) {
    toast("Salin manual: " + CONFIG.bank.number);
  }
});

const dz = $("#dropzone");
dz.addEventListener("click", () => $("#proofInput").click());
dz.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    $("#proofInput").click();
  }
});
dz.addEventListener("dragover", (e) => {
  e.preventDefault();
  dz.classList.add("over");
});
dz.addEventListener("dragleave", () => dz.classList.remove("over"));
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  dz.classList.remove("over");
  handleFile(e.dataTransfer.files[0]);
});
$("#proofInput").addEventListener("change", (e) => handleFile(e.target.files[0]));
$("#btnSubmit").addEventListener("click", submitOrder);
$("#btnAgain").addEventListener("click", resetAll);
$("#btnCopyCode").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#doneCode").textContent);
    toast("Kode tiket disalin");
  } catch (e) {
    toast("Salin manual: " + $("#doneCode").textContent);
  }
});

initHome();
