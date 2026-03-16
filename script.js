const siteConfig = typeof window.siteConfig === "object" && window.siteConfig ? window.siteConfig : {};
const baseLocations = Array.isArray(window.locationEntries) ? window.locationEntries : [];

function shuffleLocations(entries) {
  const shuffled = [...entries];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

const locations = shuffleLocations(baseLocations);

const state = {
  activeTab: "home",
  activeIndex: locations.length > 0 ? 0 : -1,
};
const SIDEBAR_EXPAND_MS = 220;
const SIDEBAR_FADE_MS = 130;
let sidebarTransitionTimer = 0;
const pageUrl = new URL(window.location.href);

const navTabs = Array.from(document.querySelectorAll(".nav-tab"));
const panels = {
  home: document.getElementById("home-panel"),
  locations: document.getElementById("locations-panel"),
  about: document.getElementById("about-panel"),
};
const siteFavicon = document.getElementById("site-favicon");
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
const lightboxCloseImage = document.getElementById("lightbox-close-image");
const lightboxCloseCopy = document.getElementById("lightbox-close-copy");
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");
const detailImage = document.getElementById("detail-image");
const detailCityName = document.getElementById("detail-city-name");
const detailTitle = document.getElementById("detail-title");
const detailDescription = document.getElementById("detail-description");
const detailCoordinates = document.getElementById("detail-coordinates");
const detailMapLink = document.getElementById("detail-map-link");

function getFaviconType(src) {
  if (src.endsWith(".png")) {
    return "image/png";
  }
  if (src.endsWith(".jpg") || src.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (src.endsWith(".ico")) {
    return "image/x-icon";
  }
  if (src.endsWith(".svg")) {
    return "image/svg+xml";
  }
  return "";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setMultilineText(node, text) {
  node.innerHTML = text
    .split("\n")
    .map((line) => `<span class="locations-heading-line">${escapeHtml(line)}</span>`)
    .join("");
}

function applySiteConfig() {
  const siteName = typeof siteConfig.siteName === "string" ? siteConfig.siteName : "Fur Josie";
  const homeHeadline =
    typeof siteConfig.homeHeadline === "string" ? siteConfig.homeHeadline : "Happy birthday";
  const headingText =
    typeof siteConfig.locationsHeading === "string"
      ? siteConfig.locationsHeading
      : "在地图上写下一本过去的日记";

  document.title = siteName;

  if (
    siteFavicon instanceof HTMLLinkElement &&
    typeof siteConfig.faviconImage === "object" &&
    siteConfig.faviconImage &&
    typeof siteConfig.faviconImage.src === "string" &&
    siteConfig.faviconImage.src.trim().length > 0
  ) {
    siteFavicon.href = siteConfig.faviconImage.src;
    const iconType = getFaviconType(siteConfig.faviconImage.src.toLowerCase());
    if (iconType) {
      siteFavicon.type = iconType;
    } else {
      siteFavicon.removeAttribute("type");
    }
  }

  if (sidebarBrandName) {
    sidebarBrandName.textContent = siteName;
  }

  if (homeMessage) {
    homeMessage.textContent = homeHeadline;
  }

  if (locationsHeading) {
    setMultilineText(locationsHeading, headingText);
  }

  if (
    lightboxCloseImage &&
    lightboxCloseCopy &&
    typeof siteConfig.lightboxCloseImage === "object" &&
    siteConfig.lightboxCloseImage &&
    typeof siteConfig.lightboxCloseImage.src === "string" &&
    siteConfig.lightboxCloseImage.src.trim().length > 0
  ) {
    lightboxCloseImage.src = siteConfig.lightboxCloseImage.src;
    lightboxCloseImage.alt =
      typeof siteConfig.lightboxCloseImage.alt === "string" ? siteConfig.lightboxCloseImage.alt : "Close";
    lightboxCloseImage.hidden = false;
    lightboxCloseCopy.hidden = true;
    lightboxClose?.classList.add("has-custom-image");
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

function clearSidebarTransitionTimer() {
  if (sidebarTransitionTimer) {
    window.clearTimeout(sidebarTransitionTimer);
    sidebarTransitionTimer = 0;
  }
}

function setSidebarExpanded(expanded) {
  clearSidebarTransitionTimer();

  if (expanded) {
    document.body.classList.remove("sidebar-collapsed");
    sidebarToggle?.setAttribute("aria-expanded", "true");
    sidebarToggle?.setAttribute("aria-label", "Close sidebar");
    sidebarTransitionTimer = window.setTimeout(() => {
      document.body.classList.remove("sidebar-content-hidden");
      sidebarTransitionTimer = 0;
    }, SIDEBAR_EXPAND_MS);
    return;
  }

  document.body.classList.add("sidebar-content-hidden");
  sidebarToggle?.setAttribute("aria-expanded", "false");
  sidebarToggle?.setAttribute("aria-label", "Open sidebar");
  sidebarTransitionTimer = window.setTimeout(() => {
    document.body.classList.add("sidebar-collapsed");
    sidebarTransitionTimer = 0;
  }, SIDEBAR_FADE_MS);
}

function applyInitialUiFromUrl() {
  const sidebarParam = pageUrl.searchParams.get("sidebar");
  const tabParam = pageUrl.searchParams.get("tab");
  const lightboxParam = pageUrl.searchParams.get("lightbox");

  if (sidebarParam === "open") {
    clearSidebarTransitionTimer();
    document.body.classList.remove("sidebar-collapsed", "sidebar-content-hidden");
    sidebarToggle?.setAttribute("aria-expanded", "true");
    sidebarToggle?.setAttribute("aria-label", "Close sidebar");
  }

  if (tabParam && Object.hasOwn(panels, tabParam)) {
    setActiveTab(tabParam);
  }

  if (lightboxParam !== null) {
    const index = Number.parseInt(lightboxParam, 10);
    if (!Number.isNaN(index)) {
      openLocation(index);
    }
  }
}

applySiteConfig();
renderGallery();
setActiveTab("home");
applyInitialUiFromUrl();

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
    const shouldExpand = document.body.classList.contains("sidebar-collapsed");
    setSidebarExpanded(shouldExpand);
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
