import React, { useState, useCallback } from 'react';
import { CanvasNode, CanvasEdge, CanvasViewport, NodeType, JsonCanvasData } from './types/canvas';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { MiniMap } from './components/MiniMap';
import { applyForceDirectedLayout } from './services/forceLayout';
import { exportToJsonCanvas, importFromJsonCanvas, createInitialSeedNodes } from './services/canvasIo';
import { playSpatialClick, playConnectChord } from './services/soundSynth';

export default function App() {
  const [initialData] = useState(() => createInitialSeedNodes());
  const [nodes, setNodes] = useState<CanvasNode[]>(initialData.nodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(initialData.edges);
  const [viewport, setViewport] = useState<CanvasViewport>({ x: 80, y: 80, zoom: 0.9 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateNode = useCallback((id: string, updates: Partial<CanvasNode>) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== id) return node;
        return {
          ...node,
          ...updates,
          data: updates.data ? { ...node.data, ...updates.data } : node.data,
        };
      })
    );
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.fromNode !== id && e.toNode !== id));
  }, []);

  const handleAddEdge = useCallback((edge: CanvasEdge) => {
    setEdges((prev) => {
      const exists = prev.some((e) => e.fromNode === edge.fromNode && e.toNode === edge.toNode);
      if (exists) return prev;
      return [...prev, edge];
    });
    showToast('Connected wire');
  }, []);

  const handleDeleteEdge = useCallback((id: string) => {
    playSpatialClick(400, 0.05);
    setEdges((prev) => prev.filter((e) => e.id !== id));
    showToast('Wire disconnected');
  }, []);

  // Real Reactive Graph Pipeline: Code Output -> Wire -> Downstream Node
  const handleExecuteCode = useCallback(
    (sourceId: string, result: any) => {
      const outgoingEdges = edges.filter((e) => e.fromNode === sourceId);
      if (outgoingEdges.length === 0) return;

      playConnectChord();

      setNodes((prevNodes) => {
        return prevNodes.map((targetNode) => {
          const edge = outgoingEdges.find((e) => e.toNode === targetNode.id);
          if (!edge) return targetNode;

          const updatedData = { ...targetNode.data, lastReceivedInput: result };

          // 1. Audio Node: reactive frequency / waveform update
          if (targetNode.type === 'audio') {
            if (typeof result === 'number') {
              updatedData.audioFreq = Math.min(Math.max(20, Math.round(result)), 20000);
            } else if (typeof result === 'object' && result !== null) {
              if (result.frequency || result.freq) {
                updatedData.audioFreq = Math.min(Math.max(20, Math.round(result.frequency || result.freq)), 20000);
              }
              if (result.waveform || result.wave) {
                updatedData.audioWaveType = result.waveform || result.wave;
              }
              if (result.volume !== undefined) {
                updatedData.volume = result.volume;
              }
            }
          }

          // 2. Metric / Barcode Node: reactive barcode update
          if (targetNode.type === 'metric') {
            let barcodeVal = '';
            if (typeof result === 'string' || typeof result === 'number') {
              barcodeVal = String(result);
            } else if (typeof result === 'object' && result !== null) {
              barcodeVal = String(result.barcode || result.value || result.code || result.id || JSON.stringify(result));
            }
            if (barcodeVal) {
              updatedData.barcodeValue = barcodeVal;
              updatedData.metricValue = barcodeVal;
            }
          }

          // 3. Markdown Node: data append
          if (targetNode.type === 'markdown' && typeof result === 'object') {
            if (result.markdown || result.text) {
              updatedData.text = result.markdown || result.text;
            }
          }

          return {
            ...targetNode,
            data: updatedData,
          };
        });
      });

      showToast(`⚡ Emitted data payload along ${outgoingEdges.length} connected wire(s)`);
    },
    [edges]
  );

  const handleAddNode = (type: NodeType) => {
    playSpatialClick(1100, 0.04);
    const canvasCenterX = (-viewport.x + window.innerWidth / 2) / viewport.zoom;
    const canvasCenterY = (-viewport.y + window.innerHeight / 2) / viewport.zoom;

    const id = `node_${Date.now()}`;
    let newNode: CanvasNode;

    switch (type) {
      case 'markdown':
        newNode = {
          id,
          type: 'markdown',
          title: 'Note Card',
          x: Math.round(canvasCenterX - 170),
          y: Math.round(canvasCenterY - 120),
          width: 360,
          height: 260,
          color: 'neutral',
          data: {
            text: '### Scratchpad\n- [ ] Type your note here\n- Connect wires to route live data',
          },
        };
        break;
      case 'code':
        newNode = {
          id,
          type: 'code',
          title: 'TypeScript REPL',
          x: Math.round(canvasCenterX - 190),
          y: Math.round(canvasCenterY - 160),
          width: 420,
          height: 360,
          color: 'neutral',
          data: {
            language: 'typescript',
            code: `// Live TypeScript Code Execution\ninterface AudioSignal {\n  frequency: number;\n  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';\n}\n\n// Compute 528Hz Solfeggio Tone & Route to Connected Audio Node\nconst signal: AudioSignal = {\n  frequency: 528,\n  waveform: 'triangle'\n};\n\nreturn signal;`,
          },
        };
        break;
      case 'audio':
        newNode = {
          id,
          type: 'audio',
          title: 'Audio Oscillator',
          x: Math.round(canvasCenterX - 170),
          y: Math.round(canvasCenterY - 150),
          width: 360,
          height: 320,
          color: 'neutral',
          data: {
            audioFreq: 440,
            audioWaveType: 'sawtooth',
          },
        };
        break;
      case 'metric':
        newNode = {
          id,
          type: 'metric',
          title: 'Barcode Synthesizer',
          x: Math.round(canvasCenterX - 170),
          y: Math.round(canvasCenterY - 130),
          width: 360,
          height: 280,
          color: 'neutral',
          data: {
            metricLabel: 'Self-Scan Code-128',
            metricValue: '262094810293',
            barcodeType: 'CODE_128',
            barcodeValue: '262094810293',
          },
        };
        break;
      case 'agent':
        newNode = {
          id,
          type: 'agent',
          title: 'Agent Worker',
          x: Math.round(canvasCenterX - 200),
          y: Math.round(canvasCenterY - 180),
          width: 400,
          height: 380,
          color: 'neutral',
          data: {
            agentPrompt: 'Analyze graph layout complexity and optimize Hooke spring constants',
            isScriptedDemo: true,
          },
        };
        break;
      case 'group':
        newNode = {
          id,
          type: 'group',
          title: 'Spatial Group',
          x: Math.round(canvasCenterX - 250),
          y: Math.round(canvasCenterY - 200),
          width: 520,
          height: 420,
          color: 'neutral',
          data: {},
        };
        break;
      default:
        return;
    }

    setNodes((prev) => [...prev, newNode]);
    showToast(`Added ${newNode.title}`);
  };

  const handleAutoLayout = () => {
    const arranged = applyForceDirectedLayout(nodes, edges);
    setNodes([...arranged]);
    showToast('Auto-arranged nodes');
  };

  const handleExportObsidian = () => {
    const jsonCanvas = exportToJsonCanvas(nodes, edges);
    const jsonStr = JSON.stringify(jsonCanvas, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AetherGraph_Export.canvas';
    a.click();
    URL.revokeObjectURL(url);

    showToast('Exported AetherGraph_Export.canvas (with round-trip metadata)');
  };

  const handleImportObsidian = (json: JsonCanvasData) => {
    const imported = importFromJsonCanvas(json);
    setNodes(imported.nodes);
    setEdges(imported.edges);
    showToast(`Imported ${imported.nodes.length} nodes from .canvas`);
  };

  return (
    <div className="w-screen h-screen bg-[#000000] overflow-hidden relative select-none font-sans text-white">
      {/* Top Bar */}
      <Toolbar
        onAddNode={handleAddNode}
        onAutoLayout={handleAutoLayout}
        onExportObsidian={handleExportObsidian}
        onImportObsidian={handleImportObsidian}
        onResetZoom={() => setViewport((v) => ({ ...v, zoom: 1.0 }))}
        onZoomIn={() => setViewport((v) => ({ ...v, zoom: Math.min(2.5, v.zoom + 0.15) }))}
        onZoomOut={() => setViewport((v) => ({ ...v, zoom: Math.max(0.25, v.zoom - 0.15) }))}
        zoom={viewport.zoom}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      {/* Infinite Canvas */}
      <Canvas
        nodes={nodes}
        edges={edges}
        viewport={viewport}
        onUpdateViewport={setViewport}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onAddEdge={handleAddEdge}
        onDeleteEdge={handleDeleteEdge}
        onSelectNode={() => {}}
        onExecuteCode={handleExecuteCode}
      />

      {/* MiniMap */}
      <MiniMap nodes={nodes} viewport={viewport} onPanTo={(x, y) => setViewport((v) => ({ ...v, x, y }))} />

      {/* Apple-grade Toast */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#0C0C0E]/90 border border-white/[0.08] text-white text-xs font-medium px-4 py-2 rounded-2xl shadow-2xl z-50 backdrop-blur-2xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
