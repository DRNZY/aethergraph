import React, { useRef } from 'react';
import {
  FileText,
  Code,
  Radio,
  ScanLine,
  Layers,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FolderSync,
  Upload,
  Camera,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { NodeType, JsonCanvasData } from '../types/canvas';
import { playSpatialClick } from '../services/soundSynth';

interface Props {
  onAddNode: (type: NodeType) => void;
  onAutoLayout: () => void;
  onExportObsidian: () => void;
  onImportObsidian: (data: JsonCanvasData) => void;
  onExportPng: () => void;
  onLoadTemplate: () => void;
  onClearCanvas: () => void;
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
  nodeCount: number;
  edgeCount: number;
}

export const Toolbar: React.FC<Props> = ({
  onAddNode,
  onAutoLayout,
  onExportObsidian,
  onImportObsidian,
  onExportPng,
  onLoadTemplate,
  onClearCanvas,
  onResetZoom,
  onZoomIn,
  onZoomOut,
  zoom,
  nodeCount,
  edgeCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.nodes && Array.isArray(json.nodes)) {
          onImportObsidian(json);
        }
      } catch (err) {
        console.error('Invalid JSON Canvas file', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".canvas,.json"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header Bar */}
      <header className="absolute top-4 left-4 right-4 h-12 bg-[#0C0C0E]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl px-4 flex items-center justify-between z-30 shadow-2xl">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white text-black flex items-center justify-center shadow-md">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-semibold tracking-tight text-white font-sans">AetherGraph</h1>
              <span className="bg-white/[0.08] text-zinc-300 text-[9px] font-mono px-1.5 py-0.2 rounded border border-white/[0.04]">
                Spatial Studio
              </span>
            </div>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2">
          {nodeCount > 0 && (
            <div className="hidden lg:flex items-center gap-2.5 text-[10px] font-mono bg-black/40 px-3 py-1 rounded-xl border border-white/[0.05]">
              <span className="text-zinc-400">
                Nodes <strong className="text-white">{nodeCount}</strong>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">
                Wires <strong className="text-white">{edgeCount}</strong>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">
                Zoom <strong className="text-zinc-200">{Math.round(zoom * 100)}%</strong>
              </span>
            </div>
          )}

          {nodeCount > 1 && (
            <button
              onClick={() => {
                playSpatialClick(1000, 0.05);
                onAutoLayout();
              }}
              className="hidden sm:flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-xl border border-white/[0.06] transition-all active:scale-[0.97]"
              title="Auto-organize with Force-Directed simulation"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Layout</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-xl border border-white/[0.06] transition-all active:scale-[0.97]"
            title="Import Obsidian .canvas file"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Import .canvas</span>
          </button>

          <button
            onClick={() => {
              playSpatialClick(800, 0.05);
              onExportPng();
            }}
            className="flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-xl border border-white/[0.06] transition-all active:scale-[0.97]"
            title="Export high-res PNG image"
          >
            <Camera className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Export PNG</span>
          </button>

          <button
            onClick={() => {
              playSpatialClick(800, 0.05);
              onExportObsidian();
            }}
            className="flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-[0.97] shadow-md"
            title="Export to Obsidian JSON Canvas 1.0"
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>Export .canvas</span>
          </button>

          {nodeCount > 0 && (
            <button
              onClick={onClearCanvas}
              className="p-1.5 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all active:scale-95"
              title="Clear Canvas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Floating Bottom Creator Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0C0C0E]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-1.5 flex items-center gap-1 z-30 shadow-2xl shadow-black/90">
        <button
          onClick={() => onAddNode('markdown')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-all active:scale-[0.97]"
        >
          <FileText className="w-3.5 h-3.5 text-zinc-400" />
          <span>Note</span>
        </button>

        <button
          onClick={() => onAddNode('code')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-all active:scale-[0.97]"
        >
          <Code className="w-3.5 h-3.5 text-zinc-400" />
          <span>TypeScript REPL</span>
        </button>

        <button
          onClick={() => onAddNode('audio')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-all active:scale-[0.97]"
        >
          <Radio className="w-3.5 h-3.5 text-zinc-400" />
          <span>Audio Synth</span>
        </button>

        <button
          onClick={() => onAddNode('metric')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-all active:scale-[0.97]"
        >
          <ScanLine className="w-3.5 h-3.5 text-zinc-400" />
          <span>Barcode Gen</span>
        </button>

        <button
          onClick={() => onAddNode('group')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-all active:scale-[0.97]"
        >
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <span>Group</span>
        </button>

        <div className="w-[1px] h-5 bg-white/[0.08] mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onZoomOut}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all active:scale-90"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all active:scale-90"
            title="Fit 100%"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomIn}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all active:scale-90"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};
