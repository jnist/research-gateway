# JNIST Research Gateway Implementation Plan

**Goal:** Implement the approved Astro research portal, integrate the existing HEC
explorer without changing site-aware filtering, and provide GitHub CI and Pages.

**Architecture:** Build-time Markdown content collections provide a shared home
and research template. The HEC module owns its native browser interaction;
versioned static assets are separate from the original release bundle.

**Design:** JNIST blue and white, official institution identity, compact navigation,
full-width sections, restrained typography, and wide scientific-tool containers.
No invented research items, authors, publication DOI, or data license.

**Source:** User-provided architecture proposal and `temp/Release code/Frontend/`.
Reference: https://www.jnist.cn/.

## Constraints

- Keep original source and archive unchanged.
- Multi-element matching means all selected symbols coexist at one lattice site.
- No selection returns no results, matching the old explorer.
- File indices remain zero-based original CSV record positions, never result positions.
- Imported CSV never uses official structure indexes, even if its row numbers coincide.
- Local imports are parsed in-browser without upload.
- Preserve original numerical data and code attribution.
- All site links and resource paths support `/research-gateway/` and root hosting.
- No commit, push, or live deployment without a separate request.

## Implementation

- [x] Read proposal, source, dataset, license, Git state, and reference website.
- [x] Scaffold Astro, shared tokens/components, content schema, and base-path helper.
- [x] Add failing unit tests for CSV, site matching, safe export, and asset paths.
- [x] Migrate original formula/DOI logic and official versioned resources.
- [x] Build home, reusable research page, accessible explorer, pagination and downloads.
- [x] Validate record counts, checksum, every indexed structure, and publication boundary.
- [x] Add PR checks and main-branch GitHub Pages deployment with pinned Node environment.
- [x] Run type checks, unit tests, production builds, desktop/mobile browser regression.
- [x] Document adding research, release validation, licensing, and Pages configuration.

## Verification Commands

```sh
npm ci
npm run check
npm test
npm run validate:data
npm run build
npm run test:e2e
SITE_BASE=/research-gateway/ npm run build
SITE_BASE=/research-gateway/ npm run test:e2e
```

## Knowledge Base

The project-memory detector reports this unbound repository is not a research
experiment candidate. This is an engineering portal repository. Do not import the
raw release into Obsidian. Keep implementation status here and durable maintenance
notes in `docs/`.

## Completion

2026-09-10: Implementation and local verification completed. See
`docs/verification.md`. No commit, push, GitHub configuration change, or remote
deployment was performed. Confirm data/image authorization and enable Pages before
publishing. The final root-path dev preview runs at http://127.0.0.1:4321/.
