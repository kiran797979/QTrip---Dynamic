import config from "../conf/index.js";

// ✅ Get the Adventure ID from the URL query parameter
function getAdventureIdFromURL(search) {
  const params = new URLSearchParams(search);
  return params.get('adventure');
}

// ✅ Fetch details of the adventure using its ID
async function fetchAdventureDetails(adventureId) {
  try {
    const response = await fetch(`${config.backendEndpoint}/adventures/detail?adventure=${adventureId}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching adventure details:", error);
    return null;
  }
}

// ✅ Add adventure details to the page (name, subtitle, images, content)
function addAdventureDetailsToDOM(adventure) {
  document.getElementById("adventure-name").textContent = adventure.name;
  document.getElementById("adventure-subtitle").textContent = adventure.subtitle;

  adventure.images.forEach(image => {
    const div = document.createElement("div");
    const img = document.createElement("img");
    img.className = "activity-card-image";
    img.src = image;
    div.appendChild(img);
    document.getElementById("photo-gallery").appendChild(div);
  });

  document.getElementById("adventure-content").textContent = adventure.content;
}

// ✅ Convert images to Bootstrap carousel
function addBootstrapPhotoGallery(images) {
  const gallery = document.getElementById("photo-gallery");
  gallery.innerHTML = `
    <div id="carouselExampleIndicators" class="carousel slide" data-bs-ride="carousel">
      <div class="carousel-indicators">
        ${images.map((_, i) => `
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="${i}" 
            ${i === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${i + 1}">
          </button>
        `).join("")}
      </div>
      <div class="carousel-inner" id="carousel-inner"></div>
      <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>
  `;

  images.forEach((imgUrl, index) => {
    const div = document.createElement("div");
    div.className = `carousel-item ${index === 0 ? "active" : ""}`;
    div.innerHTML = `<img src="${imgUrl}" class="activity-card-image pb-3" />`;
    document.getElementById("carousel-inner").appendChild(div);
  });
}

// ✅ Show correct reservation panel (available or sold out)
function conditionalRenderingOfReservationPanel(adventure) {
  const soldOutPanel = document.getElementById("reservation-panel-sold-out");
  const availablePanel = document.getElementById("reservation-panel-available");
  const costPerHead = document.getElementById("reservation-person-cost");

  if (adventure.available) {
    soldOutPanel.style.display = "none";
    availablePanel.style.display = "block";
    costPerHead.textContent = adventure.costPerHead;
  } else {
    soldOutPanel.style.display = "block";
    availablePanel.style.display = "none";
  }
}

// ✅ Calculate and show total reservation cost
function calculateReservationCostAndUpdateDOM(adventure, persons) {
  const totalCost = persons * adventure.costPerHead;
  document.getElementById("reservation-cost").textContent = totalCost;
}

// ✅ Handle reservation form submission
function captureFormSubmit(adventure) {
  const form = document.getElementById("myForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = {
      name: form.elements["name"].value,
      date: form.elements["date"].value,
      person: form.elements["person"].value,
      adventure: adventure.id
    };

    try {
      const response = await fetch(`${config.backendEndpoint}/reservations/new`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert("Success!");
        window.location.reload();
      } else {
        alert("Failed!");
      }
    } catch (error) {
      console.error("Reservation failed:", error);
      alert("Failed!");
    }
  });
}

// ✅ Show "Already Reserved" banner if applicable
function showBannerIfAlreadyReserved(adventure) {
  const banner = document.getElementById("reserved-banner");
  banner.style.display = adventure.reserved ? "block" : "none";
}

export {
  getAdventureIdFromURL,
  fetchAdventureDetails,
  addAdventureDetailsToDOM,
  addBootstrapPhotoGallery,
  conditionalRenderingOfReservationPanel,
  captureFormSubmit,
  calculateReservationCostAndUpdateDOM,
  showBannerIfAlreadyReserved,
};
