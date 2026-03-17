window.siteConfig = {
  siteName: "Fur Josie",
  homeHeadline: "Happy birthday",
  locationsHeading: "在地图上写下\n一本过去的日记",
  faviconImage: {
    src: "images/division-bell.jpg",
  },
  sidebarToggleImage: {
    src: "images/sidebar-drawer.webp",
    alt: "Open or close sidebar",
  },
  lightboxCloseImage: {
    src: "images/capybara.webp",
    alt: "Close",
  },
  fullscreenCloseImage: {
    src: "images/ricky-rain-frog.webp",
    alt: "Close fullscreen image",
  },
  sidebarBrandImage: {
    src: "",
    alt: "Fur Josie",
  },
};

const galleryAssetVersion = "20260317e";

// Gallery and lightbox order follow this array from top to bottom.
window.locationEntries = Array.from({ length: 64 }, (_, index) => {
  const imageNumber = String(index + 1).padStart(2, "0");

  return {
    cityName: `Placeholder location ${imageNumber}`,
    title: `Placeholder title ${imageNumber}`,
    description: "Placeholder description. You can fill in the memory details later.",
    coordinates: "00.0000, 00.0000",
    googleMapsLink: "https://maps.google.com",
    image: {
      src: `images/photos/${imageNumber}.webp?v=${galleryAssetVersion}`,
      alt: `Photo ${imageNumber}`,
    },
  };
});
