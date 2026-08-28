import React, { useState, useCallback, useEffect } from 'react';
import { CanvasNode, CanvasEdge, CanvasViewport, NodeType, JsonCanvasData } from './types/canvas';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { MiniMap } from './components/MiniMap';
import { applyForceDirectedLayout } from './services/forceLayout';
import { exportToJsonCanvas, importFromJsonCanvas, createInitialSeedNodes, createExamplePipeline } from './services/canvasIo';
import { playSpatialClick, playConnectChord } from './services/soundSynth';
import { toPng } from 'html-to-image';
import { Compass, FileText, Code2, Sparkles, Upload, ArrowDown, X } from 'lucide-react';

const STORAGE_NODES_KEY = 'aethergraph_nodes_v1';
const STORAGE_EDGES_KEY = 'aethergraph_edges_v1';
const STORAGE_VIEWPORT_KEY = 'aethergraph_viewport_v1';

export default function App() {
  // 1. Session Persistence from localStorage
  const [nodes, setNodes] = useState<CanvasNode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NODES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return createInitialSeedNodes().nodes;
  });

  const [edges, setEdges] = useState<CanvasEdge[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EDGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return createInitialSeedNodes().edges;
  });

  const [viewport, setViewport] = useState<CanvasViewport>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VIEWPORT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.zoom) return parsed;
      }
    } catch (_) {}
    return { x: 80, y: 80, zoom: 0.9 };
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Save session to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NODES_KEY, JSON.stringify(nodes));
      localStorage.setItem(STORAGE_EDGES_KEY, JSON.stringify(edges));
      localStorage.setItem(STORAGE_VIEWPORT_KEY, JSON.stringify(viewport));
    } catch (_) {}
  }, [nodes, edges, viewport]);

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

  // Reactive Pipeline Execution
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

      showToast(`⚡ Emitted payload along ${outgoingEdges.length} wire(s)`);
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
            code: `// Live TypeScript Code Execution\ninterface Signal {\n  frequency: number;\n  waveform: 'triangle';\n}\nconst sig: Signal = { frequency: 528, waveform: 'triangle' };\nreturn sig;`,
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
    a.download = `AetherGraph_${Date.now()}.canvas`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Exported .canvas with round-trip metadata');
  };

  const handleImportObsidian = (json: JsonCanvasData) => {
    const imported = importFromJsonCanvas(json);
    setNodes(imported.nodes);
    setEdges(imported.edges);
    showToast(`Imported ${imported.nodes.length} nodes from .canvas`);
  };

  const handleExportPng = async () => {
    const canvasBg = document.getElementById('canvas-bg');
    if (!canvasBg) return;

    try {
      playSpatialClick(800, 0.05);
      showToast('Generating high-res PNG...');

      const dataUrl = await toPng(canvasBg, {
        backgroundColor: '#000000',
        pixelRatio: 2,
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `AetherGraph_Capture_${Date.now()}.png`;
      a.click();

      showToast('📸 Exported high-res PNG image');
    } catch (err: any) {
      console.error('PNG export failed', err);
      showToast('Failed to export PNG');
    }
  };

  const handleLoadStarterTemplate = () => {
    const example = createExamplePipeline();
    setNodes(example.nodes);
    setEdges(example.edges);
    setViewport({ x: 80, y: 80, zoom: 0.9 });
    showToast('Loaded Starter Reactive Pipeline');
  };

  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    showToast('Cleared canvas');
  };

  return (
    <div className="w-screen h-screen bg-[#000000] overflow-hidden relative select-none font-sans text-white">
      {/* Top Bar */}
      <Toolbar
        onAddNode={handleAddNode}
        onAutoLayout={handleAutoLayout}
        onExportObsidian={handleExportObsidian}
        onImportObsidian={handleImportObsidian}
        onExportPng={handleExportPng}
        onLoadTemplate={handleLoadStarterTemplate}
        onClearCanvas={handleClearCanvas}
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

      {/* Empty State Onboarding Hint (Visible only when canvas is empty) */}
      {nodes.length === 0 && showOnboarding && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0C0C0E]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl z-20 max-w-md w-full animate-fade-in text-center">
          <button
            onClick={() => setShowOnboarding(false)}
            className="absolute top-4 right-4 p-1 text-zinc-500 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Compass className="w-5 h-5" />
          </div>

          <h2 className="text-sm font-semibold text-white tracking-tight">AetherGraph Spatial Canvas</h2>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            Create an executable card below to start, or load a template. Wires carry live computed data between nodes.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => handleAddNode('markdown')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white border border-white/[0.04] transition-all active:scale-[0.97]"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>Add Note</span>
            </button>

            <button
              onClick={() => handleAddNode('code')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white border border-white/[0.04] transition-all active:scale-[0.97]"
            >
              <Code2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Add REPL</span>
            </button>
          </div>

          <div className="mt-2.5">
            <button
              onClick={handleLoadStarterTemplate}
              className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-all active:scale-[0.97] shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Reactive Pipeline Example</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] font-mono text-zinc-500">
            <ArrowDown className="w-3 h-3 animate-bounce" />
            <span>Or click any card type in the bottom dock</span>
          </div>
        </div>
      )}

      {/* MiniMap */}
      {nodes.length > 0 && (
        <MiniMap nodes={nodes} viewport={viewport} onPanTo={(x, y) => setViewport((v) => ({ ...v, x, y }))} />
      )}

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
