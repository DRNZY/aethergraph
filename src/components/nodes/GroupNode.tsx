import React from 'react';
import { CanvasNode } from '../../types/canvas';
import { Layers } from 'lucide-react';

interface Props {
  node: CanvasNode;
  onUpdate: (id: string, updates: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
}

export const GroupNode: React.FC<Props> = ({ node }) => {
  return (
    <div className="w-full h-full rounded-3xl border border-white/[0.08] bg-white/[0.015] backdrop-blur-sm p-4 pointer-events-none relative transition-all">
      <div className="pointer-events-auto absolute top-3 left-3 flex items-center gap-2 bg-[#0C0C0E]/90 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/[0.08] shadow-lg">
        <Layers className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-xs font-semibold text-zinc-200 tracking-tight">{node.title}</span>
      </div>
    </div>
  );
};
