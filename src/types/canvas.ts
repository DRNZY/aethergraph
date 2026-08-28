export type NodeType = 'markdown' | 'code' | 'audio' | 'metric' | 'group' | 'agent';

export type NodeColor = 'neutral' | 'emerald' | 'blue' | 'amber' | 'purple' | 'red';

export type EdgeSide = 'top' | 'right' | 'bottom' | 'left';

export interface AgentStep {
  id: string;
  timestamp: string;
  agent: 'Antigravity' | 'Claude Code' | 'OpenCode' | 'Codex';
  tool: 'view_file' | 'replace_file_content' | 'run_command' | 'write_to_file' | 'think';
  target: string;
  status: 'running' | 'completed' | 'failed';
  details?: string;
  diff?: {
    file: string;
    additions: number;
    deletions: number;
    lines: { type: 'add' | 'del' | 'context'; text: string }[];
  };
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: NodeColor;
  title: string;
  data: {
    // Markdown
    text?: string;
    // Code
    code?: string;
    language?: 'typescript' | 'javascript' | 'python' | 'rust';
    output?: string;
    executionTimeMs?: number;
    isRunning?: boolean;
    // Audio
    audioFreq?: number;
    audioWaveType?: 'sine' | 'square' | 'sawtooth' | 'triangle';
    isPlaying?: boolean;
    volume?: number;
    // Metric / Barcode
    metricLabel?: string;
    metricValue?: string;
    metricChange?: string;
    barcodeType?: 'EAN_13' | 'CODE_128' | 'QR';
    barcodeValue?: string;
    // Agent Node
    agentName?: 'Antigravity' | 'Claude Code' | 'OpenCode' | 'Codex';
    agentModel?: string;
    agentStatus?: 'active' | 'idle' | 'awaiting_approval' | 'thinking';
    agentRole?: string;
    agentActiveTask?: string;
    agentSteps?: AgentStep[];
    tokenSpeed?: number;
    // Group
    groupLabel?: string;
  };
  zIndex?: number;
  selected?: boolean;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide: EdgeSide;
  toNode: string;
  toSide: EdgeSide;
  label?: string;
  color?: NodeColor;
  animated?: boolean;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface JsonCanvasNode {
  id: string;
  type: 'text' | 'file' | 'link' | 'group';
  text?: string;
  file?: string;
  url?: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface JsonCanvasEdge {
  id: string;
  fromNode: string;
  fromSide?: EdgeSide;
  toNode: string;
  toSide?: EdgeSide;
  label?: string;
  color?: string;
}

export interface JsonCanvasData {
  nodes: JsonCanvasNode[];
  edges: JsonCanvasEdge[];
}
