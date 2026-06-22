const CATEGORY_CONFIG = [
  {
    role: "bazaar",
    title: "BAZAAR Editorial",
    layout: "triptych",
    classes: ["portrait", "portrait", "portrait"],
  },
  {
    role: "bloody",
    title: "Bloody Film Scenes",
    layout: "collage",
    classes: ["feature", "side", "side"],
  },
  {
    role: "prosthetics",
    title: "Silicone Prosthetics for Film Production",
    layout: "rows",
    classes: ["tall", "tall", "tall", "tall", "tall", "tall"],
  },
  {
    role: "commercial",
    title: "Commercial Photoshoot",
    layout: "commercial",
    classes: ["feature", "side", "side", "commercial-portrait", "commercial-portrait", "commercial-portrait"],
  },
  {
    role: "creative",
    title: "Creative Makeup with SFX Elements",
    layout: "triptych",
    classes: ["square", "square", "square"],
  },
];

const galleryRoot = document.querySelector("[data-gallery-root]");
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImg = document.querySelector("[data-lightbox-img]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const closeButton = document.querySelector("[data-lightbox-close]");
const prevButton = document.querySelector("[data-lightbox-prev]");
const nextButton = document.querySelector("[data-lightbox-next]");

let galleryImages = [];
let currentImageIndex = 0;
let lastFocusedElement = null;

function variantByWidth(item, width) {
  return item.variants.find((variant) => variant.width === width) || item.variants[item.variants.length - 1];
}

function largestVariant(item) {
  return item.variants[item.variants.length - 1];
}

function srcsetFor(item, format) {
  return item.variants.map((variant) => `${variant[format]} ${variant.width}w`).join(", ");
}

function renderPicture(item, layoutClass, index) {
  const fallback = variantByWidth(item, 900);
  const eager = index < 5 ? "eager" : "lazy";
  const sizes = ["wide", "landscape", "feature"].includes(layoutClass)
    ? "(max-width: 680px) 92vw, (max-width: 900px) 46vw, 50vw"
    : "(max-width: 680px) 92vw, (max-width: 900px) 46vw, 33vw";

  return `
    <picture>
      <source type="image/webp" srcset="${srcsetFor(item, "webp")}" sizes="${sizes}">
      <img
        src="${fallback.jpg}"
        srcset="${srcsetFor(item, "jpg")}"
        sizes="${sizes}"
        width="${fallback.width}"
        height="${fallback.height}"
        loading="${eager}"
        alt="${item.alt}"
      >
    </picture>
  `;
}

function createGalleryButton(item, layoutClass, globalIndex) {
  const button = document.createElement("button");
  button.className = `gallery-item ${layoutClass}`;
  button.type = "button";
  button.dataset.index = String(globalIndex);
  button.dataset.full = largestVariant(item).webp;
  button.dataset.alt = item.alt;
  button.setAttribute("aria-label", `Open image: ${item.alt}`);
  button.innerHTML = renderPicture(item, layoutClass, globalIndex);
  return button;
}

function renderGalleries(manifest) {
  const renderable = manifest.filter((item) => !["hero", "about"].includes(item.role));
  galleryImages = [];
  galleryRoot.textContent = "";

  for (const category of CATEGORY_CONFIG) {
    const section = document.createElement("section");
    section.className = `gallery-section layout-${category.layout}`;
    section.setAttribute("aria-labelledby", `${category.role}-title`);

    const heading = document.createElement("h2");
    heading.id = `${category.role}-title`;
    heading.textContent = category.title;

    const grid = document.createElement("div");
    grid.className = "gallery-grid";

    renderable
      .filter((item) => item.role === category.role)
      .forEach((item, index) => {
        const globalIndex = galleryImages.length;
        const layoutClass = category.classes[index % category.classes.length] || "portrait";
        galleryImages.push({ ...item, full: largestVariant(item).webp });
        grid.append(createGalleryButton(item, layoutClass, globalIndex));
      });

    section.append(heading, grid);
    galleryRoot.append(section);
  }

  observeReveals();
}

function openLightbox(index) {
  currentImageIndex = index;
  lastFocusedElement = document.activeElement;
  updateLightbox();
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  closeButton.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImg.removeAttribute("src");
  document.body.style.overflow = "";
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function updateLightbox() {
  const item = galleryImages[currentImageIndex];
  lightboxImg.src = item.full;
  lightboxImg.alt = item.alt;
  lightboxCaption.textContent = `${item.alt} (${currentImageIndex + 1} / ${galleryImages.length})`;
}

function showRelativeImage(offset) {
  currentImageIndex = (currentImageIndex + offset + galleryImages.length) % galleryImages.length;
  updateLightbox();
}

function observeReveals() {
  const revealItems = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );

  revealItems.forEach((item) => observer.observe(item));
}

async function initGallery() {
  galleryRoot.innerHTML = '<p class="gallery-loading">Loading portfolio...</p>';

  try {
    const response = await fetch("assets/images/manifest.json");
    if (!response.ok) {
      throw new Error(`Manifest request failed: ${response.status}`);
    }
    const manifest = await response.json();
    renderGalleries(manifest);
  } catch (error) {
    galleryRoot.innerHTML = '<p class="gallery-loading">Portfolio images could not be loaded.</p>';
    console.error(error);
  }
}

galleryRoot.addEventListener("click", (event) => {
  const button = event.target.closest(".gallery-item");
  if (!button) return;
  openLightbox(Number(button.dataset.index));
});

closeButton.addEventListener("click", closeLightbox);
prevButton.addEventListener("click", () => showRelativeImage(-1));
nextButton.addEventListener("click", () => showRelativeImage(1));

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (lightbox.hidden) return;

  if (event.key === "Escape") {
    closeLightbox();
  }

  if (event.key === "ArrowLeft") {
    showRelativeImage(-1);
  }

  if (event.key === "ArrowRight") {
    showRelativeImage(1);
  }
});

observeReveals();
initGallery();
