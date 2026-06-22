#!/usr/bin/env python3
"""Prepare portfolio images for the static GitHub Pages site.

The source image folder stays outside the repo. This script exports metadata-free
WebP/JPEG variants into assets/images/ and writes a compact manifest.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO = Path("/Users/ekaterina/Desktop/Портфолио")
ABOUT_PORTRAIT = Path("/Users/ekaterina/Desktop/D6FA32C8-B5FC-42F3-B323-0BA4179CC675.PNG")
OUT = ROOT / "assets" / "images"


@dataclass(frozen=True)
class ImageItem:
    slug: str
    source: Path
    alt: str
    role: str
    widths: tuple[int, ...] = (520, 900, 1400)


def p(name: str) -> Path:
    return PORTFOLIO / name


ITEMS: tuple[ImageItem, ...] = (
    ImageItem("hero-backstage-makeup", p("30.jpg"), "Cinematic production scene used as the portfolio hero", "hero", (900, 1600, 2400)),
    ImageItem("about-katy-portrait", ABOUT_PORTRAIT, "Portrait of Katy Ilicheva", "about", (420, 720, 1080)),
    ImageItem("bazaar-sculptural-floor", p("HBZVN_VOYAGEUR TEMPOREL_6.JPEG"), "BAZAAR editorial portrait with sculptural styling", "bazaar"),
    ImageItem("bazaar-white-collar", p("HBZVN_VOYAGEUR TEMPOREL_13.JPEG"), "BAZAAR editorial portrait with a white sculptural collar", "bazaar"),
    ImageItem("bazaar-seated-gloves", p("HBZVN_VOYAGEUR TEMPOREL_16.JPEG"), "BAZAAR editorial portrait with black gloves", "bazaar"),
    ImageItem("bloody-practical-effect", p("23.jpeg"), "Practical effects makeup for a film scene", "bloody"),
    ImageItem("bloody-wide-scene", p("31.jpg"), "Wide cinematic scene with practical SFX makeup", "bloody"),
    ImageItem("bloody-wide-production", p("24.jpg"), "Wide nighttime film production scene with SFX makeup", "bloody"),
    ImageItem("prosthetics-worktable", p("21.jpeg"), "SFX prosthetics tools and pigments on a worktable", "prosthetics"),
    ImageItem("prosthetics-neck-detail", p("14.jpeg"), "Silicone prosthetic application detail for film makeup", "prosthetics"),
    ImageItem("prosthetics-finger-piece", p("16.jpeg"), "Silicone finger prosthetic detail in progress", "prosthetics"),
    ImageItem("prosthetics-character-makeup", p("18.jpeg"), "Character SFX makeup on set", "prosthetics"),
    ImageItem("prosthetics-bruising-test", p("19.jpeg"), "SFX bruising and character makeup test", "prosthetics"),
    ImageItem("prosthetics-character-night", p("22.jpeg"), "Finished character SFX makeup at night", "prosthetics"),
    ImageItem("commercial-green-field", p("4.jpg"), "Commercial fashion photoshoot in a green field", "commercial"),
    ImageItem("commercial-blue-sky-duo", p("13.jpg"), "Commercial fashion portrait under a blue sky", "commercial"),
    ImageItem("commercial-grass-duo", p("10.jpg"), "Commercial fashion composition with two models on grass", "commercial"),
    ImageItem("commercial-white-look-two", p("28.png"), "Commercial studio portrait with white styling", "commercial"),
    ImageItem("commercial-white-full-look", p("29.png"), "Full-length commercial fashion look in white", "commercial"),
    ImageItem("commercial-white-look-one", p("26.png"), "Commercial fashion portrait in a white headpiece", "commercial"),
    ImageItem("creative-green-face", p("7.png"), "Creative makeup portrait with green and black face paint", "creative"),
    ImageItem("creative-practical-face", p("462E1342-5237-44B4-83A8-789917B55EC3.JPG"), "Creative practical SFX face makeup", "creative"),
    ImageItem("creative-dark-eyes", p("1.png"), "Creative SFX makeup portrait with dark eye treatment", "creative"),
)


def save_variants(item: ImageItem) -> dict[str, object]:
    if not item.source.exists():
        raise FileNotFoundError(f"Missing source: {item.source}")

    with Image.open(item.source) as opened:
        original = ImageOps.exif_transpose(opened).convert("RGB")

    width, height = original.size
    variants: list[dict[str, object]] = []
    exported_widths: set[int] = set()
    for target_width in item.widths:
        if target_width >= width:
            resized = original.copy()
            actual_width = width
        else:
            ratio = target_width / width
            resized = original.resize((target_width, round(height * ratio)), Image.Resampling.LANCZOS)
            actual_width = target_width

        if actual_width in exported_widths:
            continue
        exported_widths.add(actual_width)

        webp_path = OUT / f"{item.slug}-{actual_width}.webp"
        jpg_path = OUT / f"{item.slug}-{actual_width}.jpg"
        resized.save(webp_path, "WEBP", quality=82, method=6)
        resized.save(jpg_path, "JPEG", quality=84, optimize=True, progressive=True)
        variants.append(
            {
                "width": resized.width,
                "height": resized.height,
                "webp": webp_path.relative_to(ROOT).as_posix(),
                "jpg": jpg_path.relative_to(ROOT).as_posix(),
            }
        )

    return {
        "slug": item.slug,
        "role": item.role,
        "alt": item.alt,
        "source": str(item.source),
        "originalWidth": width,
        "originalHeight": height,
        "variants": variants,
    }


def main(items: Iterable[ImageItem] = ITEMS) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for stale in OUT.glob("*"):
        if stale.suffix.lower() in {".jpg", ".jpeg", ".webp", ".json"}:
            stale.unlink()
    manifest = [save_variants(item) for item in items]
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(manifest)} images into {OUT}")


if __name__ == "__main__":
    main()
