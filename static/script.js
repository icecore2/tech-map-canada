// Initialize map
const map = L.map('map').setView([39.8283, -98.5795], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Store markers for reference
const markers = {};
let markersLayer = L.layerGroup().addTo(map);

// Updated fetch path to use static file
fetch('../static/companies.json')
    .then(response => response.json())
    .then(data => {
        const companyList = document.getElementById('company-list');
        const fieldFilter = document.getElementById('field-filter');
        const locationFilter = document.getElementById('location-filter');
        const searchInput = document.getElementById('search-input');
        const fields = new Set();
        const locations = new Set();

        // Populate filters
        data.companies.forEach(company => {
            company.workField.forEach(field => fields.add(field));
            locations.add(company.location);
        });

        fields.forEach(field => {
            fieldFilter.add(new Option(field, field));
        });

        locations.forEach(location => {
            locationFilter.add(new Option(location, location));
        });

        function filterCompanies() {
            const selectedField = fieldFilter.value;
            const selectedLocation = locationFilter.value;
            const searchTerm = searchInput.value.toLowerCase();

            // Clear existing markers and list
            markersLayer.clearLayers();
            companyList.innerHTML = '';

            const filteredCompanies = data.companies.filter(company => {
                const fieldMatch = !selectedField || company.workField.includes(selectedField);
                const locationMatch = !selectedLocation || company.location === selectedLocation;
                const searchMatch = !searchTerm ||
                    company.name.toLowerCase().includes(searchTerm) ||
                    company.workField.some(field => field.toLowerCase().includes(searchTerm));
                return fieldMatch && locationMatch && searchMatch;
            });

            filteredCompanies.forEach(company => {
                const marker = L.marker(company.coordinates);
                markersLayer.addLayer(marker);

                // Create and bind popup
                marker.bindPopup(createPopupContent(company));

                // Create sidebar card
                const card = createCompanyCard(company, marker);
                companyList.appendChild(card);
            });

            // Adjust map view if we have filtered companies
            if (filteredCompanies.length > 0) {
                const bounds = L.latLngBounds(filteredCompanies.map(c => c.coordinates));
                map.fitBounds(bounds);
            }
        }

        function createPopupContent(company) {
            return `
                <div class="company-info">
                    <div class="company-name">${company.name}</div>
                    <div class="company-details-popup">
                        <div class="company-location"><i class="fas fa-location-dot"></i> ${company.location}</div>
                        <div class="tags">
                            <i class="fas fa-tags"></i>
                            <ul class="no-bullets">
                                ${company.workField.map(field => `<li class="tag">${field}</li>`).join(' ')}
                            </ul>
                        </div>
                        <div class="company-details">
                            <span class="company-website-buttons"><a href="${company.website}" target="_blank"><i class="fas fa-globe"></i> Website</a></span>
                            ${company.linkedIn ? `
                            <span class="company-website-buttons"><a href="${company.linkedIn}" target="_blank"><i class="fa-brands fa-linkedin"></i> LinkedIn</a></span>
                            ` : ' '}
                        </div>
                    </div>
                </div>
            `;
        }

        function createCompanyCard(company, marker) {
            const card = document.createElement('div');
            card.className = 'company-card';
            card.innerHTML = `
                <div class="company-header">
                    <span class="company-name">${company.name}</span>
                    <span class="company-location"><i class="fas fa-location-dot"></i> ${company.location}</span>
                </div>
                <div class="company-details">
                <div class="tags">
                    <i class="fas fa-tags"></i>
                    <ul class="no-bullets">
                        ${company.workField.map(field => `<li class="tag">${field}</li>`).join(' ')}
                    </ul>
                </div>
                    <span class="company-website-buttons"><i class="fas fa-globe"></i> <a href="${company.website}" target="_blank"> Website</a></span>
                    ${company.linkedIn ? `
                        <span class="company-website-buttons"><i class="fa-brands fa-linkedin"></i> <a href="${company.linkedIn}" target="_blank"> LinkedIn</a></span>
                    ` : ' '}
                </div>
            `;
        
            card.addEventListener('click', () => {
                map.setView(company.coordinates, 13);
                marker.openPopup();
            });
        
            card.addEventListener('mouseover', () => {
                marker.setIcon(L.icon({
                    iconUrl: 'static/images/red-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                }));
            });
        
            card.addEventListener('mouseout', () => {
                marker.setIcon(L.icon({
                    iconUrl: 'static/images/default-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                }));
            });
        
            return card;
        }

        // Event listeners
        fieldFilter.addEventListener('change', filterCompanies);
        locationFilter.addEventListener('change', filterCompanies);
        searchInput.addEventListener('input', filterCompanies);

        window.clearFilters = function() {
            fieldFilter.value = '';
            locationFilter.value = '';
            searchInput.value = '';
            filterCompanies();
        };

        // Initial display
        filterCompanies();
    })
    .catch(error => {
        console.error('Error loading companies:', error);
        document.getElementById('company-list').innerHTML =
            `<div class="error">Error loading companies: ${error.message}</div>`;
    });

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
