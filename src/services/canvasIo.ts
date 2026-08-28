import { CanvasNode, CanvasEdge, JsonCanvasData, JsonCanvasNode, JsonCanvasEdge } from '../types/canvas';

const META_BLOCK_START = '```aethergraph-meta';
const META_BLOCK_END = '```';

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

    // 1. Human-readable Markdown for native Obsidian Canvas viewers
    let humanText = `## ${n.title}\n\n`;
    if (n.type === 'markdown') {
      humanText += n.data.text || '';
    } else if (n.type === 'code') {
      humanText += `\`\`\`${n.data.language || 'typescript'}\n${n.data.code || ''}\n\`\`\`\n\n**Output:**\n\`${n.data.output || 'Not executed'}\``;
    } else if (n.type === 'audio') {
      humanText += `🎵 **Web Audio Synth**\n- Frequency: ${n.data.audioFreq || 440} Hz\n- Waveform: ${n.data.audioWaveType || 'sawtooth'}`;
    } else if (n.type === 'metric') {
      humanText += `📊 **Barcode (Code-128)**: \`${n.data.barcodeValue || ''}\``;
    } else if (n.type === 'agent') {
      humanText += `🤖 **Agent Worker**: ${n.data.agentPrompt || ''}`;
    }

    // 2. Lossless metadata block enabling 100% round-trip fidelity
    const serializedMeta = {
      version: '1.0',
      type: n.type,
      title: n.title,
      color: n.color,
      data: n.data,
    };

    const combinedText = `${humanText.trim()}\n\n${META_BLOCK_START}\n${JSON.stringify(serializedMeta, null, 2)}\n${META_BLOCK_END}`;

    return {
      id: n.id,
      type: 'text',
      text: combinedText,
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
  const META_REGEX = /```aethergraph-meta\s*\n([\s\S]*?)\n```/;

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

    const rawText = n.text || '';
    const match = rawText.match(META_REGEX);

    if (match && match[1]) {
      try {
        const meta = JSON.parse(match[1]);
        return {
          id: n.id,
          type: meta.type || 'markdown',
          title: meta.title || n.label || 'Card',
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
          color: meta.color || 'neutral',
          data: meta.data || {},
        };
      } catch (err) {
        console.warn('Failed to parse aethergraph-meta block', err);
      }
    }

    // Clean human markdown fallback for external Obsidian notes
    const cleanedText = rawText.replace(META_REGEX, '').trim();
    const titleMatch = cleanedText.match(/^#+\s*(.*)/m);
    const title = titleMatch ? titleMatch[1] : n.label || 'Note';

    return {
      id: n.id,
      type: 'markdown',
      title,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      color: 'neutral',
      data: {
        text: cleanedText,
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
    // 1. Reactive TypeScript Code Node (Real TS types + returns signal data)
    {
      id: 'node_code_signal',
      type: 'code',
      title: 'Signal & Frequency Generator',
      x: 120,
      y: 120,
      width: 440,
      height: 380,
      color: 'neutral',
      data: {
        language: 'typescript',
        code: `// Real TypeScript interface transpiled via Sucrase in-browser
interface SignalPipeline {
  frequency: number;
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
  barcode: string;
  timestamp: string;
}

// Compute Solfeggio 528Hz Transformation Tone & Barcode Payload
const pipeline: SignalPipeline = {
  frequency: 528,
  waveform: 'triangle',
  barcode: '8710400012345',
  timestamp: new Date().toISOString()
};

// Return value automatically flows to connected Audio & Barcode nodes!
return pipeline;`,
        output: `{\n  "frequency": 528,\n  "waveform": "triangle",\n  "barcode": "8710400012345",\n  "timestamp": "${new Date().toISOString()}"\n}`,
        executionTimeMs: 0.8,
      },
    },

    // 2. Real Web Audio Oscillator Node (Reacts to frequency from Code Node)
    {
      id: 'node_audio_synth',
      type: 'audio',
      title: 'Web Audio Oscillator',
      x: 620,
      y: 120,
      width: 380,
      height: 340,
      color: 'neutral',
      data: {
        audioFreq: 528,
        audioWaveType: 'triangle',
        volume: 0.15,
        lastReceivedInput: { frequency: 528, waveform: 'triangle' },
      },
    },

    // 3. Real Code-128 Barcode Synthesizer (Reacts to barcode string from Code Node)
    {
      id: 'node_barcode_gen',
      type: 'metric',
      title: 'Code-128 Barcode Synthesizer',
      x: 620,
      y: 500,
      width: 380,
      height: 280,
      color: 'neutral',
      data: {
        metricLabel: 'Self-Scan Code-128',
        metricValue: '8710400012345',
        barcodeType: 'CODE_128',
        barcodeValue: '8710400012345',
        lastReceivedInput: { barcode: '8710400012345' },
      },
    },

    // 4. Interactive Obsidian Note Scratchpad
    {
      id: 'node_scratchpad',
      type: 'markdown',
      title: 'Reactive Visual Computing Guide',
      x: 120,
      y: 540,
      width: 440,
      height: 280,
      color: 'neutral',
      data: {
        text: `### Real Graph Execution Pipeline\n- **1. Click 'Run' on TypeScript REPL:** Code executes in < 1ms via in-browser \`sucrase\`.\n- **2. Live Wire Emission:** Return value flows across connected wires.\n- **3. Downstream Reactivity:** Audio node updates pitch (528Hz) & Barcode node updates bitstream.\n- **4. Lossless .canvas Round-Trip:** Export to Obsidian and reimport with 100% node type retention.`,
      },
    },
  ];

  const edges: CanvasEdge[] = [
    {
      id: 'edge_code_to_audio',
      fromNode: 'node_code_signal',
      fromSide: 'right',
      toNode: 'node_audio_synth',
      toSide: 'left',
      label: '528Hz Frequency Stream',
      color: 'neutral',
      animated: true,
    },
    {
      id: 'edge_code_to_barcode',
      fromNode: 'node_code_signal',
      fromSide: 'bottom',
      toNode: 'node_barcode_gen',
      toSide: 'top',
      label: 'Barcode Token Payload',
      color: 'neutral',
      animated: true,
    },
  ];

  return { nodes, edges };
}
