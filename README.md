# AetherGraph

> A local-first, GPU-accelerated spatial infinite canvas designed for knowledge mapping, live code evaluation, Web Audio synthesis, and JSON Canvas 1.0 sync for Obsidian.

---

## Features

- **Direct Mouse Scroll to Zoom:** Figma / Apple Freeform style exponential zoom centered directly at the pointer position. Pan with Spacebar + Drag, Middle-Click, or background drag.
- **Apple Monochrome Design:** Built with pure OLED black (`#000000`), frosted glass (`#0C0C0E` / `backdrop-blur-2xl`), hairline borders (`border-white/[0.08]`), and precise typographic hierarchy.
- **Pure Functionality Nodes:**
  - **Interactive Markdown Scratchpad:** Real-time note editing, task checklist toggle (`- [x]`), inline code, and `[[Wikilinks]]`.
  - **JavaScript / TypeScript REPL:** In-browser execution sandbox with console capture and sub-millisecond execution timers.
  - **Web Audio Signal Generator:** Real Web Audio API oscillator with low-pass filters, frequency controls (20Hz–20,000Hz), and a live 32-band FFT audio spectrum visualizer.
  - **Algorithmic Barcode Synthesizer:** Bit-exact Code-128 (Modulo 103 checksum) barcode generator with live user input.
- **Obsidian JSON Canvas 1.0 Compatibility:** Direct two-way `.canvas` file import and export with standard JSON Canvas specification support.
- **Force-Directed Physics Layout:** One-click spatial simulation (Coulomb repulsion + Hooke spring attraction) to auto-arrange complex node graphs.

---

## Tech Stack

- **Framework:** React 19, TypeScript
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS v4
- **Audio Engine:** Web Audio API (`AudioContext`, `OscillatorNode`, `AnalyserNode`)
- **Icons:** Lucide React

---

## Quickstart

```bash
# Clone repository
git clone https://github.com/DRNZY/aethergraph.git
cd aethergraph

# Install dependencies
npm install

# Start local dev server
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

---

## License

MIT © [DRNZY](https://github.com/DRNZY)
