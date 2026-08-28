import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Code, Play, Terminal, CheckCircle2 } from 'lucide-react';
import { playSpatialClick } from '../../services/soundSynth';

interface Props {
  node: CanvasNode;
  onUpdate: (id: string, updates: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
}

export const CodeNode: React.FC<Props> = ({ node, onUpdate }) => {
  const [isRunning, setIsRunning] = useState(false);
  const code = node.data.code || '';
  const language = node.data.language || 'typescript';

  const runCode = async () => {
    playSpatialClick(1200, 0.05);
    setIsRunning(true);
    const start = performance.now();

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('audioCtx', `
        try {
          ${code.replace(/return\s+/, 'return ')}
        } catch (e) {
          return "Runtime error: " + e.message;
        }
      `);
      const res = fn(window.AudioContext ? new window.AudioContext() : null);
      const executionTime = Math.round((performance.now() - start) * 10) / 10;

      onUpdate(node.id, {
        data: {
          ...node.data,
          output: typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res ?? '✓ Code executed cleanly (0 return value)'),
          executionTimeMs: executionTime,
          isRunning: false,
        },
      });
    } catch (err: any) {
      onUpdate(node.id, {
        data: {
          ...node.data,
          output: `Error: ${err.message}`,
          executionTimeMs: Math.round((performance.now() - start) * 10) / 10,
          isRunning: false,
        },
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden group hover:border-white/20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/60 border-b border-white/[0.06] handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-xs font-semibold text-white tracking-tight truncate max-w-[160px]">{node.title}</span>
          <span className="bg-white/[0.06] text-zinc-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/[0.04] uppercase">
            {language}
          </span>
        </div>
        <button
          onClick={runCode}
          disabled={isRunning}
          className="flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <Play className="w-2.5 h-2.5 fill-current" />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </button>
      </div>

      {/* Editor */}
      <div className="p-3 flex-1 flex flex-col gap-2 overflow-hidden">
        <textarea
          value={code}
          onChange={(e) => onUpdate(node.id, { data: { ...node.data, code: e.target.value } })}
          className="w-full flex-1 bg-black/50 text-zinc-200 font-mono text-[11px] p-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-white/20 resize-none leading-relaxed select-text"
          spellCheck={false}
          placeholder="// Type JavaScript/TypeScript execution code..."
        />

        {/* Output Console */}
        <div className="bg-black/80 rounded-xl border border-white/[0.06] p-2.5 overflow-hidden flex flex-col max-h-[110px]">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-1 pb-1 border-b border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-zinc-400" />
              <span>Console</span>
            </div>
            {node.data.executionTimeMs !== undefined && (
              <div className="flex items-center gap-1 text-[#30D158]">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>{node.data.executionTimeMs}ms</span>
              </div>
            )}
          </div>
          <pre className="text-[10px] font-mono text-zinc-300 overflow-y-auto custom-scrollbar select-text leading-tight whitespace-pre-wrap">
            {node.data.output || <span className="text-zinc-600 italic">// Click 'Run' to execute</span>}
          </pre>
        </div>
      </div>
    </div>
  );
};
