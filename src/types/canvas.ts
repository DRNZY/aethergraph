export type NodeType = 'markdown' | 'code' | 'audio' | 'metric' | 'group' | 'agent';

export type NodeColor = 'neutral' | 'emerald' | 'blue' | 'amber' | 'purple' | 'red';

export type EdgeSide = 'top' | 'right' | 'bottom' | 'left';

export interface AgentStep {
  id: string;
  timestamp: string;
  agent: string;
  tool: string;
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
    language?: 'typescript' | 'javascript';
    output?: string;
    rawReturnValue?: any;
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
    // Reactive Data Flow Payload
    lastReceivedInput?: any;
    lastReceivedTime?: string;
    // Agent Node
    agentName?: string;
    agentModel?: string;
    agentStatus?: 'active' | 'idle' | 'awaiting_key' | 'streaming';
    agentActiveTask?: string;
    agentPrompt?: string;
    agentResponse?: string;
    agentSteps?: AgentStep[];
    isScriptedDemo?: boolean;
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
  lastDataPayload?: any;
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
