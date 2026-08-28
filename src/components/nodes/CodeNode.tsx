import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Code2, Play, Terminal, CheckCircle2, Zap, ArrowDownLeft } from 'lucide-react';
import { transform } from 'sucrase';
import { playSpatialClick } from '../../services/soundSynth';

interface Props {
  node: CanvasNode;
  onUpdate: (id: string, updates: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
  onExecute?: (id: string, rawResult: any) => void;
}

export const CodeNode: React.FC<Props> = ({ node, onUpdate, onExecute }) => {
  const [isRunning, setIsRunning] = useState(false);
  const code = node.data.code || '';
  const language = node.data.language || 'typescript';

  const runCode = async () => {
    playSpatialClick(1200, 0.05);
    setIsRunning(true);
    const start = performance.now();

    try {
      // 1. Transpile real TypeScript (types, interfaces, enums, generics) using Sucrase
      const transpiled = transform(code, {
        transforms: ['typescript'],
        disableESTransforms: true,
      }).code;

      // 2. Safe execution environment with available global context & upstream input
      const inputPayload = node.data.lastReceivedInput;
      // eslint-disable-next-line no-new-func
      const fn = new Function('input', 'audioCtx', `
        try {
          ${transpiled.includes('return ') ? transpiled : transpiled + '\nreturn undefined;'}
        } catch (e) {
          throw e;
        }
      `);

      const res = fn(inputPayload, window.AudioContext ? new window.AudioContext() : null);
      const executionTime = Math.round((performance.now() - start) * 100) / 100;

      const formattedOutput =
        typeof res === 'object' && res !== null
          ? JSON.stringify(res, null, 2)
          : String(res ?? '✓ Executed cleanly (undefined return)');

      onUpdate(node.id, {
        data: {
          ...node.data,
          output: formattedOutput,
          rawReturnValue: res,
          executionTimeMs: executionTime,
          isRunning: false,
        },
      });

      // 3. Emit real output payload along connected graph edges
      if (onExecute && res !== undefined) {
        onExecute(node.id, res);
      }
    } catch (err: any) {
      const executionTime = Math.round((performance.now() - start) * 100) / 100;
      onUpdate(node.id, {
        data: {
          ...node.data,
          output: `Error: ${err.message}`,
          rawReturnValue: undefined,
          executionTimeMs: executionTime,
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
          <Code2 className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-xs font-semibold text-white tracking-tight truncate max-w-[150px]">{node.title}</span>
          <span className="bg-white/[0.06] text-zinc-300 text-[10px] font-mono px-1.5 py-0.2 rounded border border-white/[0.04]">
            TypeScript (Sucrase)
          </span>
        </div>
        <button
          onClick={runCode}
          disabled={isRunning}
          className="flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all active:scale-[0.97] disabled:opacity-50 shadow-md"
        >
          <Play className="w-2.5 h-2.5 fill-current" />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </button>
      </div>

      {/* Upstream Reactive Input Banner */}
      {node.data.lastReceivedInput !== undefined && (
        <div className="bg-[#30D158]/10 border-b border-[#30D158]/20 px-3 py-1 flex items-center justify-between text-[10px] font-mono text-[#30D158]">
          <span className="flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3" />
            <span>Upstream `input` payload received</span>
          </span>
          <span className="text-zinc-400 truncate max-w-[120px]">
            {typeof node.data.lastReceivedInput === 'object'
              ? JSON.stringify(node.data.lastReceivedInput)
              : String(node.data.lastReceivedInput)}
          </span>
        </div>
      )}

      {/* Code Editor */}
      <div className="p-3 flex-1 flex flex-col gap-2 overflow-hidden">
        <textarea
          value={code}
          onChange={(e) => onUpdate(node.id, { data: { ...node.data, code: e.target.value } })}
          className="w-full flex-1 bg-black/50 text-zinc-200 font-mono text-[11px] p-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-white/20 resize-none leading-relaxed select-text"
          spellCheck={false}
          placeholder="// Type real TypeScript code with interfaces, types, & return values..."
        />

        {/* Real Console Output */}
        <div className="bg-black/80 rounded-xl border border-white/[0.06] p-2.5 overflow-hidden flex flex-col max-h-[110px]">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-1 pb-1 border-b border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-zinc-400" />
              <span>Output</span>
            </div>
            {node.data.executionTimeMs !== undefined && (
              <div className="flex items-center gap-1 text-[#30D158]">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>{node.data.executionTimeMs}ms</span>
              </div>
            )}
          </div>
          <pre className="text-[10px] font-mono text-zinc-300 overflow-y-auto custom-scrollbar select-text leading-tight whitespace-pre-wrap">
            {node.data.output || <span className="text-zinc-600 italic">// Click 'Run' to execute and emit data to wires</span>}
          </pre>
        </div>
      </div>
    </div>
  );
};
