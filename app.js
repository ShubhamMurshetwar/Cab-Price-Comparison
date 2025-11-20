document.getElementById("compareForm").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const pickup = document.getElementById("pickup").value.trim();
  const drop = document.getElementById("drop").value.trim();
  const distance = parseFloat(document.getElementById("distance").value);
  const cabType = document.getElementById("cabType").value;
  
  if (!pickup || !drop) {
    alert("Please enter both pickup and drop locations");
    return;
  }
  
  if (!distance || distance <= 0) {
    alert("Please enter a valid distance");
    return;
  }

  calculateFares(pickup, drop, distance, cabType);
});

function calculateFares(pickup, drop, distance, cabType) {
  const fareRates = {
    bike: {
      Uber: { base: 15, perKm: 5, minFare: 25 },
      Rapido: { base: 10, perKm: 4, minFare: 20 },
      Ola: null
    },
    auto: {
      Ola: { base: 30, perKm: 11, minFare: 45 },
      Uber: { base: 25, perKm: 10, minFare: 40 },
      Rapido: { base: 20, perKm: 9, minFare: 35 }
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
    const isAvailable = service !== null;
    
    const encodedPickup = encodeURIComponent(pickup);
    const encodedDrop = encodeURIComponent(drop);
    
    // Deep links for each app
    const appLinks = {
      Ola: `https://olacabs.com/mobile?pickup=${encodedPickup}&drop=${encodedDrop}&category=${cabType}`,
      Uber: `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${encodedPickup}&dropoff[formatted_address]=${encodedDrop}`,
      Rapido: `https://rapido.bike/?pickup=${encodedPickup}&drop=${encodedDrop}`
    };
    
    if (!isAvailable) {
      resultsHTML += `
        <div class="result-card unavailable">
          <div class="result-info">
            <div class="result-title">${app}</div>
            <div class="result-price">Not Available</div>
          </div>
          <a href="${appLinks[app]}" class="book-btn" target="_blank">Open App</a>
        </div>`;
    } else {
      const fare = Math.max(
        service.minFare,
        Math.round(service.base + (service.perKm * distance))
      );
      
      resultsHTML += `
        <div class="result-card ${app.toLowerCase()}">
          <div class="result-info">
            <div class="result-title">${app} ${cabType.charAt(0).toUpperCase() + cabType.slice(1)}</div>
            <div class="result-price">₹${fare}</div>
          </div>
          <a href="${appLinks[app]}" class="book-btn" target="_blank">Book Now</a>
        </div>`;
    }
  });
  
  // Add route info
  resultsHTML = `
    <div class="route-info">
      <h3><i class="fas fa-route"></i> ${pickup} to ${drop}</h3>
      <p>${distance} km • ${cabType.charAt(0).toUpperCase() + cabType.slice(1)}</p>
    </div>
    ${resultsHTML}
  `;
  
  document.getElementById("result").innerHTML = resultsHTML;
}