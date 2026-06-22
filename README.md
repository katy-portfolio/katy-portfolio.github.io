# Katy Ilicheva Portfolio

Static GitHub Pages-ready portfolio site for Katy Ilicheva, Film and SFX Makeup Artist based in Munich.

## Local Preview

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Image Workflow

Raw source photos stay outside the repo:

- `/Users/ekaterina/Desktop/Портфолио/`
- `/Users/ekaterina/Desktop/D6FA32C8-B5FC-42F3-B323-0BA4179CC675.PNG`

Regenerate optimized, metadata-stripped web images with:

```bash
/Users/ekaterina/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/prepare_images.py
```

The script writes responsive WebP/JPEG variants and `assets/images/manifest.json`.

## GitHub Pages

Publish from the repository root on `master` or the branch selected in GitHub Pages settings. No `CNAME` file is included yet; add one after the custom domain is chosen.
