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
    classes: [
      "feature",
      "side",
      "side",
      "commercial-portrait",
      "commercial-portrait",
      "commercial-portrait",
      "commercial-pair",
      "commercial-pair",
      "commercial-wide",
    ],
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
const primaryNavLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];

let galleryImages = [];
let currentImageIndex = 0;
let lastFocusedElement = null;
const assetVersion = "20260623-green-shutters";

function variantByWidth(item, width) {
  return item.variants.find((variant) => variant.width === width) || item.variants[item.variants.length - 1];
}

function largestVariant(item) {
  return item.variants[item.variants.length - 1];
}

function srcsetFor(item, format) {
  return item.variants.map((variant) => `${withAssetVersion(variant[format])} ${variant.width}w`).join(", ");
}

function withAssetVersion(url) {
  return `${url}?v=${assetVersion}`;
}

function sizesFor(layoutClass) {
  if (layoutClass === "commercial-wide") {
    return "(max-width: 680px) 92vw, (max-width: 1100px) calc(100vw - 2.5rem), 980px";
  }

  if (["wide", "landscape", "feature"].includes(layoutClass)) {
    return "(max-width: 680px) 92vw, (max-width: 900px) 46vw, 50vw";
  }

  return "(max-width: 680px) 92vw, (max-width: 900px) 46vw, 33vw";
}

function renderPicture(item, layoutClass, index) {
  const fallback = variantByWidth(item, 900);
  const eager = index < 5 ? "eager" : "lazy";
  const sizes = sizesFor(layoutClass);

  return `
    <picture>
      <source type="image/webp" srcset="${srcsetFor(item, "webp")}" sizes="${sizes}">
      <img
        src="${withAssetVersion(fallback.jpg)}"
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
  button.className = `gallery-item ${layoutClass} reveal`;
  button.type = "button";
  button.dataset.index = String(globalIndex);
  button.dataset.full = withAssetVersion(largestVariant(item).webp);
  button.dataset.alt = item.alt;
  button.setAttribute("aria-label", `Open image: ${item.alt}`);
  button.innerHTML = renderPicture(item, layoutClass, globalIndex);
  return button;
}

function renderGalleries(manifest) {
  const renderable = manifest.filter((item) => !["hero", "about"].includes(item.role));
  galleryImages = [];
  galleryRoot.textContent = "";
  galleryRoot.setAttribute("aria-busy", "false");

  for (const category of CATEGORY_CONFIG) {
    const section = document.createElement("section");
    section.className = `gallery-section gallery-role-${category.role} layout-${category.layout}`;
    section.setAttribute("aria-labelledby", `${category.role}-title`);

    const headingGroup = document.createElement("div");
    headingGroup.className = "gallery-heading";

    const heading = document.createElement("h2");
    heading.id = `${category.role}-title`;
    heading.textContent = category.title;

    const hint = document.createElement("span");
    hint.className = "gallery-hint";
    hint.textContent = "Swipe to view";
    hint.setAttribute("aria-hidden", "true");
    headingGroup.append(heading, hint);

    const grid = document.createElement("div");
    grid.className = "gallery-grid";

    const categoryItems = renderable.filter((item) => item.role === category.role);
    const commercialGroups = category.role === "commercial"
      ? [
          { className: "commercial-group--collage", items: categoryItems.slice(0, 3) },
          { className: "commercial-group--triptych", items: categoryItems.slice(3, 6) },
          { className: "commercial-group--duo", items: categoryItems.slice(6, 9) },
        ]
      : [{ className: "", items: categoryItems }];

    commercialGroups.forEach((group, groupIndex) => {
      const groupRoot = category.role === "commercial" ? document.createElement("div") : grid;
      if (category.role === "commercial") {
        groupRoot.className = `commercial-group ${group.className}`;
      }

      group.items.forEach((item, itemIndex) => {
        const index = category.role === "commercial" ? groupIndex * 3 + itemIndex : itemIndex;
        const globalIndex = galleryImages.length;
        const layoutClass = category.classes[index % category.classes.length] || "portrait";
        galleryImages.push({ ...item, full: withAssetVersion(largestVariant(item).webp) });
        const button = createGalleryButton(item, layoutClass, globalIndex);
        button.style.setProperty("--reveal-delay", `${Math.min(itemIndex, 2) * 90}ms`);
        groupRoot.append(button);
      });

      if (category.role === "commercial") grid.append(groupRoot);
    });

    section.append(headingGroup, grid);
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
  galleryRoot.setAttribute("aria-busy", "true");
  galleryRoot.innerHTML = '<p class="gallery-loading">Loading selected work…</p>';

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("assets/images/manifest.json?v=20260623-green-shutters", {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Manifest request failed: ${response.status}`);
    }
    const manifest = await response.json();
    if (!Array.isArray(manifest) || manifest.length === 0) {
      throw new Error("Portfolio manifest is empty");
    }
    renderGalleries(manifest);
  } catch (error) {
    galleryRoot.setAttribute("aria-busy", "false");
    galleryRoot.innerHTML = `
      <div class="gallery-message" role="alert">
        <p>The portfolio could not load. Check your connection and try again.</p>
        <button class="gallery-retry" type="button" data-gallery-retry>Try again</button>
      </div>
    `;
  } finally {
    window.clearTimeout(timeout);
  }
}

function observeSections() {
  if (!("IntersectionObserver" in window)) return;

  const sections = primaryNavLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      primaryNavLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${visible.target.id}`;
        if (isCurrent) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-62% 0px -30%", threshold: [0, 0.15, 0.5] },
  );

  sections.forEach((section) => observer.observe(section));
}

galleryRoot.addEventListener("click", (event) => {
  const retryButton = event.target.closest("[data-gallery-retry]");
  if (retryButton) {
    retryButton.disabled = true;
    initGallery();
    return;
  }

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

  if (event.key === "Tab") {
    const controls = [closeButton, prevButton, nextButton];
    const currentControl = controls.indexOf(document.activeElement);
    const direction = event.shiftKey ? -1 : 1;
    const nextControl = (currentControl + direction + controls.length) % controls.length;
    event.preventDefault();
    controls[nextControl].focus();
  }
});

observeReveals();
observeSections();
initGallery();
