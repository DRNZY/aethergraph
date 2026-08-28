# AetherGraph

> A local-first, GPU-accelerated spatial visual programming & knowledge canvas for Obsidian with real in-browser TypeScript execution, Web Audio synthesis, bit-exact barcode generation, and JSON Canvas 1.0 lossless sync.

---

## ⚡ Core Architecture & Capabilities

### 1. Reactive Graph Computing Pipeline (Visual Programming)
- **Live Wire Data Flow:** Connected wires carry real computational payloads between cards.
- **Upstream $\rightarrow$ Downstream Reactivity:**
  - A **TypeScript Code Node** evaluating `{ frequency: 528, barcode: "8710400012345" }` automatically sets connected **Web Audio Oscillators** to 528 Hz and renders scannable **Code-128 Barcodes** on downstream nodes in real time.
  - Downstream Code nodes receive upstream return values as an injected `input` variable.

### 2. Real In-Browser TypeScript Transpilation (Sucrase)
- Executes real TypeScript code with **interfaces, type annotations, enums, generics, and type assertions** in < 1ms using in-browser [Sucrase](https://github.com/alangpierce/sucrase).
- Sub-millisecond execution timers with live console capture and error stack tracing.

### 3. Lossless Obsidian JSON Canvas 1.0 Round-Trip Fidelity
- Fully compliant with the [JSON Canvas 1.0](https://jsoncanvas.org/) specification.
- **Lossless Serialization:** Encodes structured node metadata (`code`, `audio`, `metric`, `agent`) in Obsidian-safe metadata blocks, ensuring that exporting to `.canvas` and reimporting into AetherGraph preserves 100% of node types, code, frequencies, and parameters without flattening them into generic markdown.

### 4. Precision Web Audio Signal Generator
- Built on the native Web Audio API (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`, `AnalyserNode`).
- Live 32-band FFT audio spectrum visualizer with real-time frequency modulation (20Hz–20,000Hz) and selectable waveforms (`sine`, `square`, `sawtooth`, `triangle`).

### 5. Bit-Exact Algorithmic Code-128 Barcode Synthesizer
- Implements the complete Code-128 Set B Modulo 103 checksum algorithm.
- Dynamically renders true, scannable laser barcodes from any user-supplied string with 1-click clipboard copying.

### 6. Live Agent Worker & Honest Offline Demo Mode
- **Live LLM Integration:** Configure an OpenRouter / OpenAI API key (stored exclusively in browser `localStorage`) to stream real model completions and code diffs directly into spatial cards.
- **Honest Disclosure:** When no API key is configured, the node is visibly and transparently labeled as a scripted offline example.

### 7. Apple-Grade Human Interface & Direct Mouse Zoom
- **Pointer-Centered Exponential Zoom:** Figma & Apple Freeform style mouse wheel zoom.
- **Navigation:** Spacebar + Drag, Middle-Click, or background drag to pan.
- **Design:** OLED Deep Void (`#000000`), dark frosted glass (`#0C0C0E` / `backdrop-blur-2xl`), hairline `border-white/[0.08]`, and restrained functional accents.

---

## 🚀 Quickstart

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

## Verification & Tests

```bash
# Run integrity test suite (TS transpilation & JSON Canvas round-trip fidelity)
npx tsx scripts/verify_integrity.ts

# Production build
npm run build
```

---

## License

MIT © [DRNZY](https://github.com/DRNZY)
