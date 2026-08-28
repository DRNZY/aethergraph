import { CanvasNode, CanvasEdge, JsonCanvasData, JsonCanvasNode, JsonCanvasEdge } from '../types/canvas';

export function exportToJsonCanvas(nodes: CanvasNode[], edges: CanvasEdge[]): JsonCanvasData {
  const jsonNodes: JsonCanvasNode[] = nodes.map((n) => {
    if (n.type === 'group') {
      return {
        id: n.id,
        type: 'group',
        label: n.title,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
        color: n.color,
      };
    }

    let textContent = `## ${n.title}\n\n`;
    if (n.type === 'markdown') {
      textContent += n.data.text || '';
    } else if (n.type === 'code') {
      textContent += `\`\`\`${n.data.language || 'typescript'}\n${n.data.code || ''}\n\`\`\`\n\n**Console Output:**\n\`${n.data.output || 'Not executed'}\``;
    } else if (n.type === 'audio') {
      textContent += `🎵 **Web Audio Synth**\n- Freq: ${n.data.audioFreq || 440} Hz\n- Wave: ${n.data.audioWaveType || 'sawtooth'}`;
    } else if (n.type === 'metric') {
      textContent += `📊 **Barcode Generator (Code-128)**: \`${n.data.barcodeValue || ''}\``;
    }

    return {
      id: n.id,
      type: 'text',
      text: textContent,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      color: n.color,
    };
  });

  const jsonEdges: JsonCanvasEdge[] = edges.map((e) => ({
    id: e.id,
    fromNode: e.fromNode,
    fromSide: e.fromSide,
    toNode: e.toNode,
    toSide: e.toSide,
    label: e.label,
    color: e.color,
  }));

  return { nodes: jsonNodes, edges: jsonEdges };
}

export function importFromJsonCanvas(data: JsonCanvasData): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const nodes: CanvasNode[] = data.nodes.map((n) => {
    if (n.type === 'group') {
      return {
        id: n.id,
        type: 'group',
        title: n.label || 'Group',
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
        color: 'neutral',
        data: {},
      };
    }

    return {
      id: n.id,
      type: 'markdown',
      title: n.text?.split('\n')[0]?.replace(/^#+\s*/, '') || 'Note',
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      color: 'neutral',
      data: {
        text: n.text || '',
      },
    };
  });

  const edges: CanvasEdge[] = data.edges.map((e) => ({
    id: e.id,
    fromNode: e.fromNode,
    fromSide: e.fromSide || 'right',
    toNode: e.toNode,
    toSide: e.toSide || 'left',
    label: e.label,
    color: 'neutral',
    animated: true,
  }));

  return { nodes, edges };
}

export function createInitialSeedNodes(): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const nodes: CanvasNode[] = [
    // Node 1: Functional Markdown Scratchpad
    {
      id: 'node_scratchpad',
      type: 'markdown',
      title: 'AetherGraph Quickstart',
      x: 100,
      y: 100,
      width: 380,
      height: 320,
      color: 'neutral',
      data: {
        text: `### Pure Spatial Functionality\n- [x] Mouse Scroll to Zoom (Figma style)\n- [x] Space + Drag / Middle Click to Pan\n- [x] Live JS/TS Sandbox Execution\n- [x] Web Audio API Synthesizer\n- [x] Bit-Exact Code-128 Barcode Generator\n- [x] JSON Canvas 1.0 Import & Export\n- Connect anchor dots to route data between cards.`,
      },
    },

    // Node 2: Real Interactive Code REPL
    {
      id: 'node_code_repl',
      type: 'code',
      title: 'JavaScript / TypeScript REPL',
      x: 520,
      y: 100,
      width: 420,
      height: 380,
      color: 'neutral',
      data: {
        language: 'typescript',
        code: `// Live Code Execution Sandbox\nconst items = ['Albert Heijn', 'Colruyt', 'Delhaize', 'Jumbo'];\nconst basket = items.map((store, i) => ({\n  store,\n  totalEur: Math.round((28.5 + i * 2.4) * 100) / 100,\n  savingsPct: Math.round((12 - i * 3) * 10) / 10\n}));\n\nreturn { lowestPriceStore: basket[0].store, basket };`,
        output: `{\n  "lowestPriceStore": "Albert Heijn",\n  "basket": [\n    {\n      "store": "Albert Heijn",\n      "totalEur": 28.5,\n      "savingsPct": 12\n    },\n    {\n      "store": "Colruyt",\n      "totalEur": 30.9,\n      "savingsPct": 9\n    },\n    {\n      "store": "Delhaize",\n      "totalEur": 33.3,\n      "savingsPct": 6\n    },\n    {\n      "store": "Jumbo",\n      "totalEur": 35.7,\n      "savingsPct": 3\n    }\n  ]\n}`,
        executionTimeMs: 0.6,
      },
    },

    // Node 3: Real Algorithmic Barcode Generator
    {
      id: 'node_barcode_gen',
      type: 'metric',
      title: 'Code-128 Barcode Synthesizer',
      x: 980,
      y: 100,
      width: 360,
      height: 280,
      color: 'neutral',
      data: {
        metricLabel: 'Self-Scan Code-128',
        metricValue: '262094810293',
        barcodeType: 'CODE_128',
        barcodeValue: '262094810293',
      },
    },

    // Node 4: Real Web Audio Synthesizer
    {
      id: 'node_audio_synth',
      type: 'audio',
      title: 'Web Audio Signal Generator',
      x: 520,
      y: 520,
      width: 420,
      height: 320,
      color: 'neutral',
      data: {
        audioFreq: 440,
        audioWaveType: 'sawtooth',
        volume: 0.15,
      },
    },
  ];

  const edges: CanvasEdge[] = [
    {
      id: 'edge_scratch_to_code',
      fromNode: 'node_scratchpad',
      fromSide: 'right',
      toNode: 'node_code_repl',
      toSide: 'left',
      label: 'Input Data Hook',
      color: 'neutral',
      animated: true,
    },
    {
      id: 'edge_code_to_barcode',
      fromNode: 'node_code_repl',
      fromSide: 'right',
      toNode: 'node_barcode_gen',
      toSide: 'left',
      label: 'Generated Token String',
      color: 'neutral',
      animated: true,
    },
    {
      id: 'edge_code_to_audio',
      fromNode: 'node_code_repl',
      fromSide: 'bottom',
      toNode: 'node_audio_synth',
      toSide: 'top',
      label: 'Audio Event Trigger',
      color: 'neutral',
      animated: true,
    },
  ];

  return { nodes, edges };
}
