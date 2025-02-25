// Initialize map
const map = L.map("map").setView([56.1304, -106.3468], 4); // Centered on Canada
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Store markers and state
const markers = {};
let markersLayer = L.layerGroup().addTo(map);
let companiesArray = [];
let isLoading = false;

// Validation functions
function isValidLocation(location) {
  return typeof location === 'string' && location.length > 0;
}

function isValidCompany(company) {
  return (
    company &&
    typeof company.name === 'string' &&
    Array.isArray(company.locations) &&
    Array.isArray(company.workField) &&
    Array.isArray(company.coordinates) &&
    company.coordinates.length === 2 &&
    typeof company.website === 'string'
  );
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, '');
}

function updateCompanyCount(count) {
  const companyCountElement = document.querySelector(".company-count");
  if (companyCountElement) {
    companyCountElement.textContent = `${count}`;
  }
}

function setLoadingState(loading) {
  isLoading = loading;
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.style.display = loading ? "block" : "none";
  }
}

function filterCompanies() {
  try {
    const fieldFilter = document.getElementById("field-filter");
    const locationFilter = document.getElementById("location-filter");
    const searchInput = document.getElementById("search-input");
    const companyList = document.getElementById("company-list");

    if (!fieldFilter || !locationFilter || !searchInput || !companyList) {
      throw new Error("Required DOM elements not found");
    }

    const selectedField = fieldFilter.value;
    const selectedLocation = locationFilter.value;
    const searchTerm = sanitizeString(searchInput.value.toLowerCase());

    markersLayer.clearLayers();
    companyList.innerHTML = "";

    const filteredCompanies = companiesArray.filter((company) => {
      if (!isValidCompany(company)) return false;

      const fieldMatch = !selectedField || company.workField.includes(selectedField);
      const locationMatch = !selectedLocation || company.locations.some(loc => 
        loc.toLowerCase().includes(selectedLocation.toLowerCase())
      );
      const searchMatch = !searchTerm || 
        company.name.toLowerCase().includes(searchTerm) ||
        company.workField.some(field => field.toLowerCase().includes(searchTerm));

      return fieldMatch && locationMatch && searchMatch;
    });

    filteredCompanies.forEach((company) => {
      if (!isValidCompany(company)) return;

      const marker = L.marker(company.coordinates);
      markersLayer.addLayer(marker);
      marker.bindPopup(createPopupContent(company));
      const card = createCompanyCard(company, marker);
      companyList.appendChild(card);
    });

    updateCompanyCount(filteredCompanies.length);

    if (filteredCompanies.length > 0) {
      const bounds = L.latLngBounds(
        filteredCompanies.map(c => c.coordinates)
      );
      map.fitBounds(bounds);
    }
  } catch (error) {
    console.error("Error in filterCompanies:", error);
    showError("An error occurred while filtering companies");
  }
}

// Error handling
function showError(message) {
  const errorElement = document.createElement("div");
  errorElement.className = "error-message";
  errorElement.textContent = message;
  document.body.appendChild(errorElement);
  setTimeout(() => errorElement.remove(), 5000);
}

// Load and process data
async function loadCompaniesData() {
  try {
    setLoadingState(true);
    const response = await fetch("../static/companies.json");
    if (!response.ok) throw new Error("Failed to fetch companies data");
    
    const data = await response.json();
    return processCompaniesData(data);
  } catch (error) {
    console.error("Error loading companies:", error);
    showError("Failed to load companies data");
    return [];
  } finally {
    setLoadingState(false);
  }
}

function processCompaniesData(data) {
  if (!data || !data.companies) {
    throw new Error("Invalid data format");
  }

  return Object.entries(data.companies).map(([name, info]) => {
    try {
      const locationsList = info.locations.flatMap((loc) => {
        const locationName = Object.keys(loc)[0];
        return locationName.includes("[") 
          ? JSON.parse(locationName.replace(/'/g, '"')) 
          : locationName;
      }).filter(isValidLocation);

      return {
        name: sanitizeString(name),
        locations: locationsList,
        coordinates: Object.values(info.locations[0])[0],
        website: sanitizeString(info.links.website),
        linkedIn: sanitizeString(info.links.linkedin),
        workField: info.workFields.map(sanitizeString),
      };
    } catch (error) {
      console.error(`Error processing company ${name}:`, error);
      return null;
    }
  }).filter(Boolean);
}

// Initialize application
async function initializeApp() {
  try {
    companiesArray = await loadCompaniesData();
    
    const fieldFilter = document.getElementById("field-filter");
    const locationFilter = document.getElementById("location-filter");
    const searchInput = document.getElementById("search-input");

    if (!fieldFilter || !locationFilter || !searchInput) {
      throw new Error("Required filter elements not found");
    }

    // Set up filters
    const fields = new Set();
    const locations = new Set();

    companiesArray.forEach((company) => {
      if (!isValidCompany(company)) return;
      
      company.workField.forEach((field) => fields.add(field));
      company.locations.forEach((location) => {
        if (isValidLocation(location)) {
          locations.add(location);
        }
      });
    });

    // Populate filters
    [...fields].sort().forEach((field) => {
      fieldFilter.add(new Option(sanitizeString(field), sanitizeString(field)));
    });

    [...locations].sort().forEach((location) => {
      locationFilter.add(new Option(sanitizeString(location), sanitizeString(location)));
    });

    // Add event listeners
    fieldFilter.addEventListener("change", filterCompanies);
    locationFilter.addEventListener("change", filterCompanies);
    searchInput.addEventListener("input", filterCompanies);

    // Initial display
    filterCompanies();
  } catch (error) {
    console.error("Error initializing app:", error);
    showError("Failed to initialize application");
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);

function createPopupContent(company) {
  const mainLocation = company.locations[0];
  const additionalLocations = company.locations.slice(1);

  const content = `
    <div class="company-info">
        <div class="company-header">
                <span class="company-name">${company.name}</span>
            <div class="company-website-buttons">
                <a href="${company.website}" target="_blank"><i class="fas fa-globe"></i></a>
                ${company.linkedIn ? `<a href="${company.linkedIn}" target="_blank"><i class="fa-brands fa-linkedin"></i></a>` : ""}
            </div>
        </div>
    </div>
        <div class="tags">
          <i class="fas fa-tags"></i>
          <ul class="no-bullets">
            ${company.workField.map((field) => `<li class="tag" onclick="setFilter('${field}')">${field}</li>`).join(" ")}
          </ul>
        </div>
      <div class="company-details-popup">
        <div class="company-location"><i class="fas fa-location-dot"></i> ${mainLocation}</div>
        ${additionalLocations.length > 0 ? `
          <div class="additional-locations">
            <div class="location-header" onclick="toggleLocationList(this)">
              <i class="fas fa-chevron-down location-toggle"></i>
              <span>Additional Locations (${additionalLocations.length})</span>
            </div>
            <ul class="location-list no-bullets" style="display: none;">
              ${additionalLocations.map(location => `<li>${location}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

      </div>
    </div>
  `;

  return content;
}

// Add this function to handle location toggle globally
window.toggleLocationList = function(element) {
  const locationList = element.nextElementSibling;
  const toggle = element.querySelector('.location-toggle');
  const isHidden = locationList.style.display === 'none';
  
  locationList.style.display = isHidden ? 'block' : 'none';
  toggle.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0)';
};

function createCompanyCard(company, marker) {
  const card = document.createElement("div");
  card.className = "company-card";
  const mainLocation = company.locations[0];
  const additionalLocations = company.locations.slice(1);

  card.innerHTML = `
    <div class="company-header">
      <span class="company-name">${company.name}</span>
      <div class="company-website-buttons">
        <a href="${company.website}" target="_blank"><i class="fas fa-globe"></i></a>
        ${company.linkedIn ? `<a href="${company.linkedIn}" target="_blank"><i class="fa-brands fa-linkedin"></i></a>` : ""}
      </div>
    </div>
    <div class="company-details">
      <div class="tags">
        <i class="fas fa-tags"></i>
        <ul class="no-bullets">
          ${company.workField.map((field) => `<li class="tag" onclick="setFilter('${field}')">${field}</li>`).join(" ")}
        </ul>
      </div>
      <div class="location-section">
        <span class="company-location"><i class="fas fa-location-dot"></i> ${mainLocation}</span>
        ${additionalLocations.length > 0 ? `
          <div class="additional-locations">
            <div class="location-header" onclick="toggleLocationList(this)">
              <i class="fas fa-chevron-down location-toggle"></i>
              <span class="location-counter">${additionalLocations.length} more</span>
            </div>
            <ul class="location-list no-bullets" style="display: none;">
              ${additionalLocations.map(location => `<li>${location}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  if (additionalLocations.length > 0) {
    const locationCounter = card.querySelector('.location-counter');
    locationCounter.addEventListener('click', () => {
      const locationList = document.createElement('ul');
      locationList.className = 'location-list no-bullets';
      locationList.innerHTML = additionalLocations.map(location => `<li>${location}</li>`).join('');
      card.querySelector('.company-header').appendChild(locationList);
      locationCounter.style.display = 'none';
    });
  }

  card.addEventListener("click", () => {
    map.setView(company.coordinates, 13);
    marker.openPopup();
  });

  card.addEventListener("mouseover", () => {
    marker.setIcon(
      L.icon({
        iconUrl: "static/images/red-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })
    );
  });

  card.addEventListener("mouseout", () => {
    marker.setIcon(
      L.icon({
        iconUrl: "static/images/default-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })
    );
  });

  return card;
}

function setFilter(field) {
  const fieldFilter = document.getElementById("field-filter");
  fieldFilter.value = field;
  filterCompanies();
}

// Resizer functionality
const resizer = document.getElementById('resizer');
const sidebar = document.querySelector('.sidebar');
let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'ew-resize';
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    sidebar.style.width = `${newWidth}px`;
    resizer.style.right = `${newWidth}px`;
    document.getElementById('map').style.right = `${newWidth}px`;
});

document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.cursor = 'default';
});

function clearFilters() {
  const fieldFilter = document.getElementById("field-filter");
  const locationFilter = document.getElementById("location-filter");
  const searchInput = document.getElementById("search-input");

  fieldFilter.value = '';
  locationFilter.value = '';
  searchInput.value = '';
  filterCompanies();
}
