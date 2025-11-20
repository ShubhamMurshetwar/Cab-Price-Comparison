document.getElementById("compareForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const pickup = document.getElementById("pickup").value.trim();
  const drop = document.getElementById("drop").value.trim();
  const cabType = document.getElementById("cabType").value;

  if (pickup.toLowerCase() === drop.toLowerCase()) {
    alert("Pickup and drop cannot be the same!");
    return;
  }

  await getDistance(pickup, drop);
  const distance = parseFloat(document.getElementById("distance").value);

  if (!distance || distance <= 0) {
    alert("Enter a valid distance manually.");
    return;
  }

  calculateFares(pickup, drop, distance, cabType);
});


async function getDistance(pickup, drop) {
  try {
    const geo1 = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup)}`
    );
    const loc1 = await geo1.json();

    const geo2 = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(drop)}`
    );
    const loc2 = await geo2.json();

    if (!loc1.length || !loc2.length) {
      alert("Could not find the locations. Try typing a more accurate address.");
      return;
    }

    const pickupLat = loc1[0].lat;
    const pickupLon = loc1[0].lon;
    const dropLat = loc2[0].lat;
    const dropLon = loc2[0].lon;

    const route = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${pickupLon},${pickupLat};${dropLon},${dropLat}?overview=false`
    );
    const data = await route.json();

    if (data.routes && data.routes.length > 0) {
      const km = (data.routes[0].distance / 1000).toFixed(2);
      document.getElementById("distance").value = km;
    } else {
      alert("Could not fetch distance automatically.");
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong. Please try again.");
  }
}


function setupAutocomplete(inputId, suggestionId) {
  const input = document.getElementById(inputId);
  const suggestionsBox = document.getElementById(suggestionId);
  let debounceTimer;

  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);

    const query = input.value.trim();
    if (query.length < 3) {
      suggestionsBox.innerHTML = "";
      return;
    }

    Object.assign(suggestionsBox.style, {
      position: "absolute",
      background: "white",
      border: "1px solid #ccc",
      borderRadius: "8px",
      zIndex: "999",
      width: "100%",
      maxHeight: "150px",
      overflowY: "auto"
    });

    suggestionsBox.innerHTML = `<div style="padding:8px; color:#666;">Searching...</div>`;

    debounceTimer = setTimeout(async () => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${encodeURIComponent(query)}`
      );
      const results = await response.json();

      suggestionsBox.innerHTML = results.length
        ? results.map(place => {
            const name = place.display_name.replace(/'/g, "\\'");
            return `<div style="padding:10px; cursor:pointer;" onclick="selectLocation('${inputId}', '${name}')">
                ${place.display_name}
              </div>`;
          }).join("")
        : `<div style="padding:8px; color:#666;">No results found</div>`;
    }, 500);
  });
}

function selectLocation(inputId, location) {
  document.getElementById(inputId).value = location;
  document.getElementById(inputId + "-suggestions").innerHTML = "";
}

window.onload = function () {
  setupAutocomplete("pickup", "pickup-suggestions");
  setupAutocomplete("drop", "drop-suggestions");
};


function calculateFares(pickup, drop, distance, cabType) {
  const fareRates = {
    bike: {
      Uber: { base: 15, perKm: 5, minFare: 25 },
      Rapido: { base: 10, perKm: 4, minFare: 20 },
      Ola: null
    },
    auto: {
      Ola: { base: 40, perKm: 11, minFare: 45 },
      Uber: { base: 35, perKm: 10, minFare: 40 },
      Rapido: { base: 30, perKm: 9, minFare: 40 }
    },
    mini: {
      Ola: { base: 50, perKm: 13, minFare: 75 },
      Uber: { base: 45, perKm: 12, minFare: 70 },
      Rapido: { base: 40, perKm: 11, minFare: 65 }
    },
    sedan: {
      Ola: { base: 70, perKm: 16, minFare: 100 },
      Uber: { base: 65, perKm: 15, minFare: 95 },
      Rapido: { base: 60, perKm: 14, minFare: 90 }
    },
    suv: {
      Ola: { base: 100, perKm: 20, minFare: 150 },
      Uber: { base: 95, perKm: 19, minFare: 140 },
      Rapido: null
    }
  };

  let resultsHTML = '';
  const apps = ['Ola', 'Uber', 'Rapido'];

  apps.forEach(app => {
    const service = fareRates[cabType][app];
    const encodedPickup = encodeURIComponent(pickup);
    const encodedDrop = encodeURIComponent(drop);

    const appLinks = {
      Ola: `https://olacabs.com/mobile?pickup=${encodedPickup}&drop=${encodedDrop}&category=${cabType}`,
      Uber: `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${encodedPickup}&dropoff[formatted_address]=${encodedDrop}`,
      Rapido: `https://rapido.bike/?pickup=${encodedPickup}&drop=${encodedDrop}`
    };

    if (!service) {
      resultsHTML += `<div class="result-card unavailable">
        <div class="result-info">
          <div class="result-title">${app}</div>
          <div class="result-price">Not Available</div>
        </div>
        <a href="${appLinks[app]}" class="book-btn" target="_blank">Open App</a>
      </div>`;
    } else {
      const fare = Math.max(service.minFare, Math.round(service.base + (service.perKm * distance)));
      resultsHTML += `<div class="result-card ${app.toLowerCase()}">
        <div class="result-info">
          <div class="result-title">${app} ${cabType}</div>
          <div class="result-price">₹${fare}</div>
        </div>
        <a href="${appLinks[app]}" class="book-btn" target="_blank">Book Now</a>
      </div>`;
    }
  });

  document.getElementById("result").innerHTML = `
    <div class="route-info">
      <h3><i class="fas fa-route"></i> ${pickup} → ${drop}</h3>
      <p>${distance} km • ${cabType}</p>
    </div>
    ${resultsHTML}
  `;
}
