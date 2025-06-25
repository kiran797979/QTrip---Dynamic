import config from "../conf/index.js";

// Extract city from query params
function getCityFromURL(search) {
  let params = new URLSearchParams(search);
  let city = params.get("city");
  return city;
}

// Fetch adventures from backend based on city
async function fetchAdventures(city) {
  try {
    const response = await fetch(`${config.backendEndpoint}/adventures?city=${city}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching adventures:", error);
    return null;
  }
}

// Add adventure cards to the DOM
function addAdventureToDOM(adventures) {
  if (!adventures || adventures.length === 0) return;

  document.getElementById("data").innerHTML = ""; // Clear previous content

  for (let i = 0; i < adventures.length; i++) {
    const adv = adventures[i];
    const div = document.createElement("div");
    div.setAttribute("class", "col-12 col-sm-6 col-lg-3 mb-3");

    div.innerHTML = `
      <a id=${adv.id} href="detail/?adventure=${adv.id}">
        <div class="card activity-card">
          <img src=${adv.image} class="activity-card-img" />
          <div class="category-banner">${adv.category}</div>
          <div class="card-body col-md-12 mt-2">
            <div class="d-flex justify-content-between">
              <p>${adv.name}</p>
              <p>₹${adv.costPerHead}</p>
            </div>
            <div class="d-flex justify-content-between">
              <p>Duration</p>
              <p>${adv.duration} Hours</p>
            </div>
          </div>
        </div>
      </a>
    `;

    document.getElementById("data").append(div);
  }
}

// Filter by duration
function filterByDuration(list, low, high) {
  return list.filter((e) => e.duration >= low && e.duration <= high);
}

// Filter by category
function filterByCategory(list, categoryList) {
  return list.filter((e) => categoryList.includes(e.category));
}

// Apply combined filters
function filterFunction(list, filters) {
  let filteredList = list;

  if (filters.category && filters.category.length > 0) {
    filteredList = filterByCategory(filteredList, filters.category);
  }

  if (filters.duration && filters.duration.length > 0) {
    const [low, high] = filters.duration.split("-").map(Number);
    filteredList = filterByDuration(filteredList, low, high);
  }

  return filteredList;
}

// Save filters to local storage
function saveFiltersToLocalStorage(filters) {
  window.localStorage.setItem("filters", JSON.stringify(filters));
  return true;
}

// Get filters from local storage
function getFiltersFromLocalStorage() {
  let filters = window.localStorage.getItem("filters");
  return filters ? JSON.parse(filters) : { duration: "", category: [] };
}

// Generate category pills and update DOM
function generateFilterPillsAndUpdateDOM(filters) {
  const categoryList = filters.category || [];

  const container = document.getElementById("category-list");
  container.innerHTML = ""; // Clear existing

  for (let i = 0; i < categoryList.length; i++) {
    const div = document.createElement("div");
    div.setAttribute("class", "category-filter");
    div.innerText = categoryList[i];
    container.appendChild(div);
  }

  // Set selected duration in dropdown
  if (filters.duration) {
    const durationSelect = document.getElementById("duration-select");
    if (durationSelect) {
      durationSelect.value = filters.duration;
    }
  }
}

// ====================
// ✅ Add these methods below
// ====================

function selectDuration(event, adventureList, filters) {
  filters.duration = event.target.value;
  saveFiltersToLocalStorage(filters);

  const filtered = filterFunction(adventureList, filters);
  addAdventureToDOM(filtered);
  generateFilterPillsAndUpdateDOM(filters);
}

function clearDuration(adventureList, filters) {
  filters.duration = "";

  const durationSelect = document.getElementById("duration-select");
  if (durationSelect) {
    durationSelect.value = "";
  }

  saveFiltersToLocalStorage(filters);

  const filtered = filterFunction(adventureList, filters);
  addAdventureToDOM(filtered);
  generateFilterPillsAndUpdateDOM(filters);
}

export {
  getCityFromURL,
  fetchAdventures,
  addAdventureToDOM,
  filterByDuration,
  filterByCategory,
  filterFunction,
  saveFiltersToLocalStorage,
  getFiltersFromLocalStorage,
  generateFilterPillsAndUpdateDOM,
  selectDuration,
  clearDuration,
};
