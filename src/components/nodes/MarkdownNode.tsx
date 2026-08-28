import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { FileText, Edit2, Eye, CheckSquare, Square } from 'lucide-react';

interface Props {
  node: CanvasNode;
  onUpdate: (id: string, updates: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
}

export const MarkdownNode: React.FC<Props> = ({ node, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const text = node.data.text || '';

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Checkbox
      if (line.startsWith('- [x] ') || line.startsWith('- [ ] ')) {
        const checked = line.startsWith('- [x] ');
        const label = line.slice(6);
        return (
          <div
            key={idx}
            className="flex items-center gap-2 text-xs py-0.5 text-zinc-300 cursor-pointer hover:text-white transition-colors"
            onClick={() => {
              const newLines = [...lines];
              newLines[idx] = checked ? `- [ ] ${label}` : `- [x] ${label}`;
              onUpdate(node.id, { data: { ...node.data, text: newLines.join('\n') } });
            }}
          >
            {checked ? (
              <CheckSquare className="w-3.5 h-3.5 text-[#30D158] shrink-0" />
            ) : (
              <Square className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            )}
            <span className={checked ? 'line-through text-zinc-500' : ''}>{label}</span>
          </div>
        );
      }

      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-semibold text-white tracking-tight mt-1.5 mb-1">
            {line.slice(4)}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-sm font-semibold text-white tracking-tight mt-2 mb-1">
            {line.slice(3)}
          </h3>
        );
      }

      // Bullet points
      if (line.startsWith('- ')) {
        const bulletText = line.slice(2);
        const parsed = bulletText.split(/(\[\[.*?\]\]|`.*?`|\*\*.*?\*\*)/g).map((part, pIdx) => {
          if (part.startsWith('[[') && part.endsWith(']]')) {
            return (
              <span
                key={pIdx}
                className="bg-white/[0.08] text-[#0A84FF] px-1 py-0.5 rounded text-[11px] font-medium hover:underline cursor-pointer border border-white/[0.04]"
              >
                {part.slice(2, -2)}
              </span>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={pIdx} className="bg-black/60 text-zinc-200 px-1 py-0.5 rounded font-mono text-[10px] border border-white/[0.06]">
                {part.slice(1, -1)}
              </code>
            );
          }
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} className="text-white font-medium">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        return (
          <div key={idx} className="flex items-start gap-1.5 text-xs text-zinc-300 py-0.5 leading-relaxed">
            <span className="text-zinc-500 font-bold">•</span>
            <div>{parsed}</div>
          </div>
        );
      }

      if (!line.trim()) return <div key={idx} className="h-1" />;

      return <p key={idx} className="text-xs text-zinc-400 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden group hover:border-white/20 transition-all">
      {/* Apple-grade Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/60 border-b border-white/[0.06] handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-xs font-semibold text-white tracking-tight truncate max-w-[200px]">{node.title}</span>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.08] transition-colors"
          title={isEditing ? 'Preview Markdown' : 'Edit Note'}
        >
          {isEditing ? <Eye className="w-3.5 h-3.5 text-[#0A84FF]" /> : <Edit2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Node Content */}
      <div className="p-3.5 flex-1 overflow-y-auto custom-scrollbar select-text font-sans">
        {isEditing ? (
          <textarea
            value={text}
            onChange={(e) => onUpdate(node.id, { data: { ...node.data, text: e.target.value } })}
            className="w-full h-full bg-black/50 text-zinc-200 text-xs font-mono p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30 resize-none leading-relaxed"
            placeholder="Type markdown, [[Wikilinks]], or - [ ] tasks..."
          />
        ) : (
          <div className="space-y-1">{renderMarkdown(text)}</div>
        )}
      </div>
    </div>
  );
};
