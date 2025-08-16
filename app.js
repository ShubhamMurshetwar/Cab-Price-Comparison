// Cab price comparison logic (static site)

const providers = [
  {
    name: "Rapido",
    type: "Bike",
    base: 30,
    perKm: 9,
    perMin: 1.2,
    minFare: 50,
    eta: "6-12 min"
  },
  {
    name: "Uber",
    type: "Cab",
    base: 45,
    perKm: 12,
    perMin: 1.5,
    minFare: 70,
    eta: "7-15 min"
  },
  {
    name: "Ola",
    type: "Cab",
    base: 40,
    perKm: 11,
    perMin: 1.6,
    minFare: 75,
    eta: "8-16 min"
  }
];

const TAX_RATE = 0.05; // 5%

function estimateFare(provider, km, mins, surge=1.0, discount=0) {
  const raw = (provider.base + provider.perKm * km + provider.perMin * mins);
  const surged = raw * Math.max(1, surge);
  const withMin = Math.max(provider.minFare, surged);
  const taxed = withMin * (1 + TAX_RATE);
  const finalFare = Math.max(0, Math.round(taxed - discount));
  return finalFare;
}

function formatINR(v){ return `₹${v.toLocaleString("en-IN")}`; }

function saveHistory(entry) {
  const key = "cab_history";
  const prev = JSON.parse(localStorage.getItem(key) || "[]");
  prev.unshift(entry);
  const trimmed = prev.slice(0, 8);
  localStorage.setItem(key, JSON.stringify(trimmed));
  renderHistory();
}

function renderHistory(){
  const list = document.getElementById("historyList");
  const prev = JSON.parse(localStorage.getItem("cab_history") || "[]");
  list.innerHTML = "";
  if(prev.length === 0){
    const li = document.createElement("li");
    li.textContent = "No recent searches yet.";
    li.style.color = "#9fb0c0";
    list.appendChild(li);
    return;
  }
  prev.forEach((item, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${idx+1}. ${item.pickup} → ${item.drop} • ${item.km} km, ${item.mins} mins • Surge x${item.surge}</span>`;
    const btn = document.createElement("button");
    btn.textContent = "Re-run";
    btn.onclick = () => {
      document.getElementById("pickup").value = item.pickup;
      document.getElementById("drop").value = item.drop;
      document.getElementById("distance").value = item.km;
      document.getElementById("duration").value = item.mins;
      document.getElementById("surge").value = item.surge;
      document.getElementById("discount").value = item.discount || 0;
      runComparison();
    };
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function runComparison() {
  const pickup = document.getElementById("pickup").value.trim();
  const drop = document.getElementById("drop").value.trim();
  const km = parseFloat(document.getElementById("distance").value);
  const mins = parseFloat(document.getElementById("duration").value);
  const surge = parseFloat(document.getElementById("surge").value || "1");
  const discount = parseFloat(document.getElementById("discount").value || "0");

  if(!pickup || !drop || isNaN(km) || isNaN(mins)) return;

  const tbody = document.querySelector("#resultsTable tbody");
  tbody.innerHTML = "";

  const rows = providers.map(p => {
    const fare = estimateFare(p, km, mins, surge, discount);
    return {
      provider: p.name,
      base: p.base,
      perKm: p.perKm,
      perMin: p.perMin,
      fare,
      eta: p.eta
    };
  });

  // Determine cheapest
  const minFare = Math.min(...rows.map(r => r.fare));

  rows
    .sort((a,b) => a.fare - b.fare)
    .forEach(row => {
      const tr = document.createElement("tr");
      if(row.fare === minFare) tr.classList.add("highlight");
      tr.innerHTML = `
        <td>${row.provider}</td>
        <td>${formatINR(row.base)}</td>
        <td>${formatINR(row.perKm)}</td>
        <td>${formatINR(row.perMin)}</td>
        <td><strong>${formatINR(row.fare)}</strong> ${row.fare===minFare ? '<span class="badge cheapest" style="margin-left:6px;">Cheapest</span>':''}</td>
        <td>${row.eta}</td>
      `;
      tbody.appendChild(tr);
    });

  document.getElementById("resultsSection").hidden = false;

  saveHistory({pickup, drop, km, mins, surge, discount});
}

document.getElementById("compareForm").addEventListener("submit", (e) => {
  e.preventDefault();
  runComparison();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("compareForm").reset();
  document.querySelector("#resultsTable tbody").innerHTML = "";
  document.getElementById("resultsSection").hidden = true;
});

renderHistory();
