const siteConfig = typeof window.siteConfig === "object" && window.siteConfig ? window.siteConfig : {};
const locations = Array.isArray(window.locationEntries) ? window.locationEntries : [];

const state = {
  activeTab: "home",
  activeIndex: locations.length > 0 ? 0 : -1,
};

const navTabs = Array.from(document.querySelectorAll(".nav-tab"));
const panels = {
  home: document.getElementById("home-panel"),
  locations: document.getElementById("locations-panel"),
  about: document.getElementById("about-panel"),
};
const galleryGrid = document.getElementById("gallery-grid");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarToggleImage = document.getElementById("sidebar-toggle-image");
const homeButton = document.getElementById("home-button");
const homeMessage = document.getElementById("home-message");
const sidebarBrandName = document.getElementById("sidebar-brand-name");
const sidebarBrandImage = document.getElementById("sidebar-brand-image");
const locationsHeading = document.getElementById("locations-heading");
const lightbox = document.getElementById("lightbox");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");
const detailImage = document.getElementById("detail-image");
const detailCityName = document.getElementById("detail-city-name");
const detailTitle = document.getElementById("detail-title");
const detailDescription = document.getElementById("detail-description");
const detailCoordinates = document.getElementById("detail-coordinates");
const detailMapLink = document.getElementById("detail-map-link");

function applySiteConfig() {
  const siteName = typeof siteConfig.siteName === "string" ? siteConfig.siteName : "Fur Josie";
  const homeHeadline =
    typeof siteConfig.homeHeadline === "string" ? siteConfig.homeHeadline : "Happy birthday";
  const headingText =
    typeof siteConfig.locationsHeading === "string"
      ? siteConfig.locationsHeading
      : "在地图上写下一本过去的日记";

  document.title = siteName;

  if (sidebarBrandName) {
    sidebarBrandName.textContent = siteName;
  }

  if (homeMessage) {
    homeMessage.textContent = homeHeadline;
  }

  if (locationsHeading) {
    locationsHeading.textContent = headingText;
  }

  if (
    sidebarToggle &&
    sidebarToggleImage &&
    typeof siteConfig.sidebarToggleImage === "object" &&
    siteConfig.sidebarToggleImage &&
    typeof siteConfig.sidebarToggleImage.src === "string" &&
    siteConfig.sidebarToggleImage.src.trim().length > 0
  ) {
    sidebarToggleImage.src = siteConfig.sidebarToggleImage.src;
    sidebarToggleImage.alt =
      typeof siteConfig.sidebarToggleImage.alt === "string"
        ? siteConfig.sidebarToggleImage.alt
        : "Sidebar toggle";
    sidebarToggleImage.hidden = false;
    sidebarToggle.classList.add("has-custom-image");
  }

  if (
    sidebarBrandImage &&
    typeof siteConfig.sidebarBrandImage === "object" &&
    siteConfig.sidebarBrandImage &&
    typeof siteConfig.sidebarBrandImage.src === "string" &&
    siteConfig.sidebarBrandImage.src.trim().length > 0
  ) {
    sidebarBrandImage.src = siteConfig.sidebarBrandImage.src;
    sidebarBrandImage.alt =
      typeof siteConfig.sidebarBrandImage.alt === "string"
        ? siteConfig.sidebarBrandImage.alt
        : siteName;
    sidebarBrandImage.hidden = false;
  }
}

function renderGallery() {
  if (!galleryGrid) {
    return;
  }

  galleryGrid.innerHTML = "";

  for (const [index, location] of locations.entries()) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "location-card";
    card.setAttribute("aria-label", `Open ${location.title}`);
    card.innerHTML = `
      <span class="location-card-frame">
        <img src="${location.image.src}" alt="${location.image.alt}">
      </span>
    `;
    card.addEventListener("click", () => openLocation(index));
    galleryGrid.appendChild(card);
  }
}

function updateLightboxNav() {
  const hasPrevious = state.activeIndex > 0;
  const hasNext = state.activeIndex >= 0 && state.activeIndex < locations.length - 1;

  if (lightboxPrev) {
    lightboxPrev.disabled = !hasPrevious;
  }

  if (lightboxNext) {
    lightboxNext.disabled = !hasNext;
  }
}

function setActiveTab(tabId) {
  state.activeTab = tabId;

  if (homeButton) {
    homeButton.classList.toggle("is-active", tabId === "home");
  }

  for (const tab of navTabs) {
    tab.classList.toggle("is-active", tab.dataset.tab === tabId);
  }

  for (const [panelId, panelNode] of Object.entries(panels)) {
    if (!panelNode) {
      continue;
    }
    panelNode.classList.toggle("is-active", panelId === tabId);
  }
}

function renderLocation(index) {
  const location = locations[index];
  if (
    !location ||
    !detailImage ||
    !detailCityName ||
    !detailTitle ||
    !detailDescription ||
    !detailCoordinates ||
    !detailMapLink
  ) {
    return;
  }

  state.activeIndex = index;
  detailImage.src = location.image.src;
  detailImage.alt = location.image.alt;
  detailCityName.textContent = location.cityName;
  detailTitle.textContent = location.title;
  detailDescription.textContent = location.description;
  detailCoordinates.textContent = location.coordinates;
  detailMapLink.href = location.googleMapsLink;
  updateLightboxNav();
}

function openLocation(index) {
  if (index < 0 || index >= locations.length) {
    return;
  }

  renderLocation(index);
  if (!lightbox) {
    return;
  }

  lightbox.hidden = false;
  document.body.classList.add("is-modal-open");
}

function closeLocation() {
  if (!lightbox) {
    return;
  }

  lightbox.hidden = true;
  document.body.classList.remove("is-modal-open");
}

function navigateLocation(delta) {
  const nextIndex = state.activeIndex + delta;
  if (nextIndex < 0 || nextIndex >= locations.length) {
    return;
  }

  renderLocation(nextIndex);
}

applySiteConfig();
renderGallery();
setActiveTab("home");

if (homeButton) {
  homeButton.addEventListener("click", () => setActiveTab("home"));
}

for (const tab of navTabs) {
  tab.addEventListener("click", () => {
    const { tab: tabId } = tab.dataset;
    if (tabId) {
      setActiveTab(tabId);
    }
  });
}

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    const collapsed = document.body.classList.toggle("sidebar-collapsed");
    const expanded = !collapsed;
    sidebarToggle.setAttribute("aria-expanded", String(expanded));
    sidebarToggle.setAttribute("aria-label", expanded ? "Close sidebar" : "Open sidebar");
  });
}

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLocation);
}

if (lightboxPrev) {
  lightboxPrev.addEventListener("click", () => navigateLocation(-1));
}

if (lightboxNext) {
  lightboxNext.addEventListener("click", () => navigateLocation(1));
}

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.dataset.close === "lightbox") {
      closeLocation();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (lightbox?.hidden !== false) {
    return;
  }

  if (event.key === "Escape") {
    closeLocation();
  } else if (event.key === "ArrowLeft") {
    navigateLocation(-1);
  } else if (event.key === "ArrowRight") {
    navigateLocation(1);
  }
});
