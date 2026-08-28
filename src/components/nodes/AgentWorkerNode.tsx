import React, { useState, useEffect } from 'react';
import { CanvasNode, AgentStep } from '../../types/canvas';
import {
  Bot,
  Terminal,
  FileCode2,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  GitCommit,
  Clock,
  Zap,
} from 'lucide-react';
import { playSpatialClick } from '../../services/soundSynth';

interface Props {
  node: CanvasNode;
  onUpdate: (id: string, updates: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
}

export const AgentWorkerNode: React.FC<Props> = ({ node, onUpdate }) => {
  const agentName = node.data.agentName || 'Antigravity';
  const agentModel = node.data.agentModel || 'Gemini 3.7 Flash';
  const [isRunning, setIsRunning] = useState(node.data.agentStatus === 'active');
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [showDiff, setShowDiff] = useState(true);

  const steps: AgentStep[] = node.data.agentSteps || [
    {
      id: 'step_1',
      timestamp: '21:58:10',
      agent: agentName,
      tool: 'view_file',
      target: 'src/services/parser.ts',
      status: 'completed',
      details: 'Analyzing multilingual NLP parsing heuristics and ingredient token bounds',
    },
    {
      id: 'step_2',
      timestamp: '21:58:14',
      agent: agentName,
      tool: 'replace_file_content',
      target: 'src/services/parser.ts:L42-88',
      status: 'completed',
      details: 'Refactored unit normalizer with Benelux measurement synonyms',
      diff: {
        file: 'src/services/parser.ts',
        additions: 14,
        deletions: 4,
        lines: [
          { type: 'context', text: 'export function parseIngredient(raw: string): Ingredient {' },
          { type: 'del', text: '-  const units = ["g", "kg", "ml", "l", "tbsp", "tsp"];' },
          { type: 'add', text: '+  const units = [...STANDARD_UNITS, ...BENELUX_SYNONYMS];' },
          { type: 'add', text: '+  const fractions = normalizeCompoundFractions(raw);' },
          { type: 'context', text: '   return matchQuantityAndUnit(fractions, units);' },
        ],
      },
    },
    {
      id: 'step_3',
      timestamp: '21:58:19',
      agent: agentName,
      tool: 'run_command',
      target: 'npx tsc --noEmit',
      status: 'running',
      details: 'Type checking codebase across 42 modules (0 errors emitted)',
    },
  ];

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isRunning, steps.length]);

  const toggleExecution = () => {
    playSpatialClick(isRunning ? 600 : 1000, 0.04);
    setIsRunning(!isRunning);
    onUpdate(node.id, {
      data: { ...node.data, agentStatus: isRunning ? 'idle' : 'active' },
    });
  };

  const currentStep = steps[currentStepIdx] || steps[0];

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden group hover:border-white/20 transition-all">
      {/* Apple-grade Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/60 border-b border-white/[0.06] handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Bot className="w-4 h-4 text-white" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                isRunning ? 'bg-[#30D158] ring-2 ring-[#30D158]/30 animate-pulse' : 'bg-zinc-600'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white tracking-tight">{agentName}</span>
              <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.06] px-1.5 py-0.2 rounded border border-white/[0.04]">
                {agentModel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleExecution}
            className="flex items-center gap-1 bg-white/[0.08] hover:bg-white/15 text-zinc-200 hover:text-white text-[11px] font-medium px-2 py-1 rounded-lg border border-white/[0.06] transition-all active:scale-[0.97]"
            title={isRunning ? 'Pause Agent' : 'Resume Agent'}
          >
            {isRunning ? (
              <>
                <Pause className="w-3 h-3 text-[#FF9F0A]" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-[#30D158] fill-current" />
                <span>Resume</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-Time Agent Stream & Trajectory */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5 overflow-hidden font-sans">
        {/* Active Task / Trajectory Header */}
        <div className="bg-black/40 rounded-xl p-2.5 border border-white/[0.05]">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#30D158]" />
              <span>Active Objective</span>
            </span>
            <span className="text-zinc-500">Step {currentStepIdx + 1}/{steps.length}</span>
          </div>
          <div className="text-xs font-medium text-zinc-200 truncate">
            {node.data.agentActiveTask || 'Automating parallel media pipeline & cross-vault sync'}
          </div>
        </div>

        {/* Live Step Card */}
        <div className="flex-1 bg-black/60 rounded-xl p-2.5 border border-white/[0.05] flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04] text-[10px] font-mono">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Terminal className="w-3 h-3 text-[#0A84FF]" />
              <span className="font-semibold text-white uppercase">{currentStep.tool}</span>
              <span className="text-zinc-500 truncate max-w-[140px]">{currentStep.target}</span>
            </div>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase ${
                currentStep.status === 'running'
                  ? 'bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/20'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {currentStep.status}
            </span>
          </div>

          <div className="py-2 text-[11px] text-zinc-300 leading-relaxed truncate">
            {currentStep.details}
          </div>

          {/* Interactive Live Diff Preview */}
          {currentStep.diff && (
            <div className="bg-black/90 rounded-lg p-2 font-mono text-[10px] border border-white/[0.04] space-y-0.5 overflow-hidden">
              <div className="flex items-center justify-between text-[9px] text-zinc-500 pb-1 border-b border-white/[0.04]">
                <span>{currentStep.diff.file}</span>
                <span className="text-[#30D158]">+{currentStep.diff.additions}</span>
                <span className="text-[#FF453A]">-{currentStep.diff.deletions}</span>
              </div>
              {currentStep.diff.lines.map((line, lIdx) => (
                <div
                  key={lIdx}
                  className={`truncate px-1 rounded-[2px] ${
                    line.type === 'add'
                      ? 'bg-[#30D158]/15 text-[#30D158]'
                      : line.type === 'del'
                      ? 'bg-[#FF453A]/15 text-[#FF453A]'
                      : 'text-zinc-500'
                  }`}
                >
                  {line.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Telemetry Footer */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            <span>Updated {currentStep.timestamp}</span>
          </span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Sparkles className="w-2.5 h-2.5 text-[#0A84FF]" />
            <span>94 t/s streaming</span>
          </span>
        </div>
      </div>
    </div>
  );
};
