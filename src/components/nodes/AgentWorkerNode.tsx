import React, { useState, useEffect } from 'react';
import { CanvasNode, AgentStep } from '../../types/canvas';
import {
  Bot,
  Terminal,
  Play,
  Key,
  Sparkles,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { playSpatialClick } from '../../services/soundSynth';

interface Props {
  node: CanvasNode;
  onUpdate: (id: string, updates: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
}

export const AgentWorkerNode: React.FC<Props> = ({ node, onUpdate }) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('aethergraph_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [prompt, setPrompt] = useState(node.data.agentPrompt || 'Optimize spatial tree layout algorithm in TypeScript');
  const [isStreaming, setIsStreaming] = useState(false);
  const [responseStream, setResponseStream] = useState(node.data.agentResponse || '');

  // Default scripted steps for offline demo demonstration
  const [demoStepIdx, setDemoStepIdx] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);

  const demoSteps: AgentStep[] = node.data.agentSteps || [
    {
      id: 'step_1',
      timestamp: '22:15:04',
      agent: 'AetherGraph Worker',
      tool: 'view_file',
      target: 'src/services/forceLayout.ts',
      status: 'completed',
      details: 'Inspected Coulomb repulsion matrix and Hooke spring constant bounds',
    },
    {
      id: 'step_2',
      timestamp: '22:15:08',
      agent: 'AetherGraph Worker',
      tool: 'replace_file_content',
      target: 'src/services/forceLayout.ts:L40-62',
      status: 'completed',
      details: 'Optimized spatial grid damping and boundary resistance',
      diff: {
        file: 'src/services/forceLayout.ts',
        additions: 6,
        deletions: 2,
        lines: [
          { type: 'context', text: '    // 3. Update Positions with Damping' },
          { type: 'del', text: '-     p.vx *= 0.82;' },
          { type: 'add', text: '+     p.vx *= damping;' },
          { type: 'add', text: '+     p.vy *= damping;' },
          { type: 'context', text: '    });' },
        ],
      },
    },
  ];

  useEffect(() => {
    if (!demoRunning) return;
    const interval = setInterval(() => {
      setDemoStepIdx((prev) => (prev + 1) % demoSteps.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [demoRunning, demoSteps.length]);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('aethergraph_api_key', key);
    setShowKeyModal(false);
  };

  // Real LLM API Call (OpenRouter / OpenAI compatible)
  const handleRunRealAgent = async () => {
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    playSpatialClick(1100, 0.04);
    setIsStreaming(true);
    setResponseStream('');

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5180',
          'X-Title': 'AetherGraph',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [
            {
              role: 'system',
              content:
                'You are an autonomous coding agent executing inside AetherGraph. Return concise, high-density architecture analysis, TypeScript implementations, or tool steps.',
            },
            { role: 'user', content: prompt },
          ],
          stream: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((l) => l.trim().startsWith('data: '));

          for (const line of lines) {
            const dataStr = line.replace(/^data: /, '').trim();
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              const token = parsed.choices?.[0]?.delta?.content || '';
              fullText += token;
              setResponseStream(fullText);
            } catch (_) {}
          }
        }
      }

      onUpdate(node.id, {
        data: {
          ...node.data,
          agentPrompt: prompt,
          agentResponse: fullText,
          agentStatus: 'idle',
        },
      });
    } catch (err: any) {
      setResponseStream(`Execution Error: ${err.message}. Please check API key.`);
    } finally {
      setIsStreaming(false);
    }
  };

  const currentStep = demoSteps[demoStepIdx] || demoSteps[0];

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden group hover:border-white/20 transition-all">
      {/* Apple-grade Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/60 border-b border-white/[0.06] handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2.5">
          <Bot className="w-4 h-4 text-white" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white tracking-tight">{node.title}</span>
              {/* Honest Badge */}
              {!apiKey ? (
                <span className="text-[9px] font-mono text-[#FF9F0A] bg-[#FF9F0A]/10 px-1.5 py-0.2 rounded border border-[#FF9F0A]/20 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>Scripted Demo</span>
                </span>
              ) : (
                <span className="text-[9px] font-mono text-[#30D158] bg-[#30D158]/10 px-1.5 py-0.2 rounded border border-[#30D158]/20 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  <span>Live API Connected</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowKeyModal(true)}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
            title="Configure Live API Key"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5 overflow-hidden font-sans">
        {/* Live Prompt Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>Agent Objective Prompt:</span>
            <button
              onClick={handleRunRealAgent}
              disabled={isStreaming}
              className="flex items-center gap-1 bg-white text-black hover:bg-zinc-200 text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all active:scale-[0.97] disabled:opacity-50"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>{isStreaming ? 'Streaming...' : 'Run Real Agent'}</span>
            </button>
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-black/60 text-white font-mono text-[11px] px-2.5 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-white/30"
            placeholder="Type task objective..."
          />
        </div>

        {/* Real Response or Offline Step Viewer */}
        <div className="flex-1 bg-black/70 rounded-xl p-2.5 border border-white/[0.05] overflow-y-auto custom-scrollbar flex flex-col justify-between">
          {responseStream ? (
            <div className="font-mono text-[10px] text-zinc-200 whitespace-pre-wrap leading-relaxed select-text">
              {responseStream}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-white/[0.04] text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Terminal className="w-3 h-3 text-[#0A84FF]" />
                  <span className="font-semibold text-white uppercase">{currentStep.tool}</span>
                  <span className="text-zinc-500 truncate max-w-[150px]">{currentStep.target}</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500">Example Step</span>
              </div>

              <div className="text-[11px] text-zinc-400 leading-relaxed">
                {currentStep.details}
              </div>

              {currentStep.diff && (
                <div className="bg-black/90 rounded-lg p-2 font-mono text-[9px] border border-white/[0.04] space-y-0.5">
                  <div className="flex items-center justify-between text-zinc-500 pb-0.5 border-b border-white/[0.04]">
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
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>{apiKey ? 'API Key stored locally' : 'No API key (showing scripted example)'}</span>
          <button
            onClick={() => setDemoRunning(!demoRunning)}
            className="text-zinc-400 hover:text-white underline text-[9px]"
          >
            {demoRunning ? 'Pause Demo' : 'Cycle Demo'}
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl p-4 flex flex-col justify-between z-30 animate-fade-in">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="text-xs font-semibold text-white">Configure Live Agent API</span>
              <button onClick={() => setShowKeyModal(false)} className="text-zinc-400 hover:text-white text-xs">
                ✕
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
              Enter your <strong>OpenRouter</strong> or OpenAI API key. Stored exclusively in your browser's local storage; never sent to any external server.
            </p>
            <input
              type="password"
              defaultValue={apiKey}
              placeholder="sk-or-v1-..."
              id="api-key-input"
              className="w-full mt-3 bg-black/80 text-white font-mono text-xs p-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-white/40"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                localStorage.removeItem('aethergraph_api_key');
                setApiKey('');
                setShowKeyModal(false);
              }}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg"
            >
              Clear Key
            </button>
            <button
              onClick={() => {
                const val = (document.getElementById('api-key-input') as HTMLInputElement)?.value;
                handleSaveKey(val);
              }}
              className="bg-white text-black text-xs font-semibold px-4 py-1.5 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Save Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
