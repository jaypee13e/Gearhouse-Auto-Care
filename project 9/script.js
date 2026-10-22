const DEV = { name: "Your Name", email: "you@example.com" }; // edit these two lines

document.getElementById("devname").textContent = DEV.name;
document.getElementById("devmail").href =
  "mailto:" +
  DEV.email +
  "?subject=" +
  encodeURIComponent("Auto shop website quote");

// price = base price, hrs = labor hours, lvl = price changes with parts level
const SERVICES = [
  { id: "oil", name: "Oil and filter change", price: 60, hrs: 0.75, lvl: true },
  { id: "tire", name: "Tire rotation and balance", price: 55, hrs: 1, lvl: false },
  { id: "brake", name: "Brake pads and inspection", price: 180, hrs: 2, lvl: true },
  { id: "batt", name: "Battery test and replacement", price: 140, hrs: 0.5, lvl: true },
  { id: "ac", name: "Air conditioning service", price: 120, hrs: 1.5, lvl: false },
  { id: "detail", name: "Full interior and exterior detail", price: 150, hrs: 3, lvl: true },
  { id: "ceramic", name: "Ceramic paint protection", price: 380, hrs: 5, lvl: false },
];

const SIZES = {
  compact: { name: "Compact", m: 1 },
  mid: { name: "Sedan or SUV", m: 1.2 },
  large: { name: "Truck or van", m: 1.45 },
};

const LEVELS = {
  eco: { name: "Economy", m: 0.85 },
  std: { name: "Standard", m: 1 },
  prem: { name: "Premium", m: 1.4 },
};

const $id = (i) => document.getElementById(i);

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

const state = {
  size: "mid",
  level: "std",
  picked: new Set(["oil"]),
  summary: "",
  hours: 0,
};

function linePrice(s) {
  const lvl = s.lvl ? LEVELS[state.level].m : 1;
  return s.price * SIZES[state.size].m * lvl;
}

function fmtHours(h) {
  if (h < 1) return "under an hour";
  const r = Math.round(h * 2) / 2;
  return `about ${r} hour${r === 1 ? "" : "s"}`;
}

// Chips for vehicle size and parts level
function renderChips() {
  const make = (obj, key, attr) =>
    Object.entries(obj)
      .map(
        ([k, v]) =>
          `<button type="button" class="chip" data-${attr}="${k}" ` +
          `aria-pressed="${state[key] === k}">${v.name}</button>`,
      )
      .join("");

  $id("sizes").innerHTML = make(SIZES, "size", "size");
  $id("levels").innerHTML = make(LEVELS, "level", "level");
}

$id("sizes").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-size]");
  if (!btn) return;
  state.size = btn.dataset.size;
  update();
});

$id("levels").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-level]");
  if (!btn) return;
  state.level = btn.dataset.level;
  update();
});

// Service checkboxes
function renderServices() {
  $id("svc").innerHTML = SERVICES.map(
    (s) =>
      `<label class="opt"><input type="checkbox" value="${s.id}"` +
      `${state.picked.has(s.id) ? " checked" : ""} />` +
      `<span>${s.name}<small>${fmtHours(s.hrs)}</small></span>` +
      `<b>${money(linePrice(s))}</b></label>`,
  ).join("");
}

$id("svc").addEventListener("change", (e) => {
  if (e.target.checked) state.picked.add(e.target.value);
  else state.picked.delete(e.target.value);
  update();
});

// Quote
function update() {
  renderChips();
  renderServices();

  const chosen = SERVICES.filter((s) => state.picked.has(s.id));
  const total = chosen.reduce((sum, s) => sum + linePrice(s), 0);
  const lo = Math.round((total * 0.95) / 5) * 5;
  const hi = Math.round((total * 1.15) / 5) * 5;
  state.hours = chosen.reduce((sum, s) => sum + s.hrs, 0);

  $id("out").textContent = chosen.length
    ? `${money(lo)} to ${money(hi)}`
    : "Pick a service";

  $id("brk").innerHTML = chosen
    .map(
      (s) =>
        `<div class="row"><span>${s.name}</span><b>${money(linePrice(s))}</b></div>`,
    )
    .join("");

  $id("time").textContent = chosen.length
    ? `Estimated time: ${fmtHours(state.hours)}`
    : "";

  state.summary = chosen.length
    ? `Estimate ${money(lo)} to ${money(hi)} for a ${SIZES[state.size].name.toLowerCase()} ` +
      `(${LEVELS[state.level].name.toLowerCase()} level): ` +
      chosen.map((s) => s.name).join("; ") +
      "."
    : "";

  checkWait();
}

$id("use").onclick = () => {
  if (state.summary) $id("nt").value = state.summary;
  $id("book").scrollIntoView();
  $id("vh").focus();
};

// Booking: drop off or wait
function checkWait() {
  const wait = document.querySelector('input[name="mode"]:checked').value === "wait";
  $id("waitnote").hidden = !(wait && state.hours > 2);
  $id("waitnote").textContent =
    `Your jobs take ${fmtHours(state.hours)}, which is a long wait. ` +
    "Drop-off is usually easier. We can arrange a loan car or a ride.";
}

document
  .querySelectorAll('input[name="mode"]')
  .forEach((r) => r.addEventListener("change", checkWait));

const DATES = [];
for (let k = 1; DATES.length < 7; k++) {
  const d = new Date();
  d.setDate(d.getDate() + k);
  if (d.getDay() !== 0) {
    DATES.push(
      d.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
  }
}
$id("bd").innerHTML = DATES.map((d) => `<option>${d}</option>`).join("");

$id("bf").onsubmit = (e) => {
  e.preventDefault();

  if (!state.picked.size) {
    $id("err").textContent = "Please choose at least one service above.";
    $id("svc").scrollIntoView();
    return;
  }
  if ($id("nm").value.trim().length < 2 || $id("vh").value.trim().length < 3) {
    $id("err").textContent = "Please add your name and vehicle details.";
    return;
  }

  const wait = document.querySelector('input[name="mode"]:checked').value === "wait";

  $id("done").innerHTML =
    `<div class="ok" role="status">Thank you, ${esc($id("nm").value)}. ` +
    `We’ve pencilled in your ${esc($id("vh").value)} for ${$id("bd").value}, ` +
    `${wait ? "to wait" : "for drop-off"} (${esc($id("bt").value)}). ` +
    `We’ll email ${esc($id("em").value)} to confirm. ` +
    `(Demo: no message was sent.)</div>`;

  $id("bf").hidden = true;
  $id("done").scrollIntoView();
};

$id("bf").addEventListener("input", () => {
  $id("err").textContent = "";
});

// Before and after slider
$id("slide").addEventListener("input", (e) => {
  $id("ba").style.setProperty("--pos", e.target.value + "%");
});

update();