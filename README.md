# AetherGraph

A local-first visual programming and knowledge canvas compatible with Obsidian JSON Canvas 1.0, featuring in-browser TypeScript execution, Web Audio synthesis, and Code-128 barcode generation.

---

## Core architecture

### Reactive graph computing pipeline
Connected wires pass computational outputs between cards. For example, a TypeScript node returning `{ frequency: 528, barcode: "8710400012345" }` sets connected Web Audio oscillators to 528 Hz and updates downstream Code-128 barcode cards in real time. Downstream code nodes receive upstream outputs through an injected `input` variable.

### In-browser TypeScript execution
Executes TypeScript code with interfaces, type annotations, enums, and generics in under 1 ms using [Sucrase](https://github.com/alangpierce/sucrase). Includes execution timers, live console capture, and error stack traces.

### Obsidian JSON Canvas 1.0 round-trip support
Compliant with the [JSON Canvas 1.0](https://jsoncanvas.org/) specification. Encodes structured node metadata (`code`, `audio`, `metric`, `agent`) in Obsidian-safe metadata blocks so exporting to `.canvas` and reimporting into AetherGraph preserves node types and configurations.

### Web Audio signal generator
Built on the native Web Audio API (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`, `AnalyserNode`). Includes a 32-band FFT audio spectrum visualizer with real-time frequency modulation (20 Hz to 20,000 Hz) and selectable waveforms (`sine`, `square`, `sawtooth`, `triangle`).

### Code-128 barcode generator
Implements Code-128 Set B with Modulo 103 checksum calculation, rendering scannable barcodes with one-click clipboard copying.

### Agent worker and offline demo mode
Configure an OpenRouter or OpenAI API key (saved locally in browser `localStorage`) to stream model completions and code diffs into spatial cards. When no API key is set, the node runs an offline example script.

### Interface and navigation
Pointer-centered zoom via mouse wheel, pan with Spacebar + drag or middle click, and a dark low-contrast theme.

---

## Quickstart

```bash
# Clone repository
git clone https://github.com/DRNZY/aethergraph.git
cd aethergraph

# Install dependencies
npm install

# Run local dev server
npm run dev
# Active at http://localhost:5180
```

## Verification and tests

```bash
# Run integrity test suite (TS transpilation & JSON Canvas round-trip fidelity)
npx tsx scripts/verify_integrity.ts

# Production build
npm run build
```

---

## License

MIT (c) [DRNZY](https://github.com/DRNZY)
