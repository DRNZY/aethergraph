import React from 'react';
import { CanvasNode, CanvasViewport } from '../types/canvas';

interface Props {
  nodes: CanvasNode[];
  viewport: CanvasViewport;
  onPanTo: (x: number, y: number) => void;
}

export const MiniMap: React.FC<Props> = ({ nodes, viewport, onPanTo }) => {
  const mapWidth = 160;
  const mapHeight = 100;

  const minX = Math.min(...nodes.map((n) => n.x), -400);
  const maxX = Math.max(...nodes.map((n) => n.x + n.width), 2200);
  const minY = Math.min(...nodes.map((n) => n.y), -400);
  const maxY = Math.max(...nodes.map((n) => n.y + n.height), 1600);

  const totalWidth = Math.max(1, maxX - minX);
  const totalHeight = Math.max(1, maxY - minY);

  const scaleX = mapWidth / totalWidth;
  const scaleY = mapHeight / totalHeight;
  const scale = Math.min(scaleX, scaleY);

  const toMapX = (x: number) => (x - minX) * scale;
  const toMapY = (y: number) => (y - minY) * scale;

  const vpWidth = window.innerWidth / viewport.zoom;
  const vpHeight = window.innerHeight / viewport.zoom;
  const vpLeft = -viewport.x / viewport.zoom;
  const vpTop = -viewport.y / viewport.zoom;

  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetCanvasX = clickX / scale + minX - vpWidth / 2;
    const targetCanvasY = clickY / scale + minY - vpHeight / 2;

    onPanTo(-targetCanvasX * viewport.zoom, -targetCanvasY * viewport.zoom);
  };

  return (
    <div
      onClick={handleMiniMapClick}
      className="absolute bottom-6 right-6 w-[160px] h-[100px] bg-[#0C0C0E]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl z-30 cursor-crosshair group hover:border-white/20 transition-all"
    >
      <div className="relative w-full h-full p-1.5">
        {/* Nodes */}
        {nodes.map((node) => {
          const x = toMapX(node.x);
          const y = toMapY(node.y);
          const w = Math.max(3, node.width * scale);
          const h = Math.max(3, node.height * scale);

          let color = '#52525B';
          if (node.type === 'agent') color = '#30D158';
          if (node.type === 'code') color = '#0A84FF';
          if (node.type === 'markdown') color = '#E4E4E7';

          return (
            <div
              key={node.id}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${w}px`,
                height: `${h}px`,
                backgroundColor: color,
                opacity: node.type === 'group' ? 0.15 : 0.8,
              }}
              className="absolute rounded-[1px]"
            />
          );
        })}

        {/* Viewport Box */}
        <div
          style={{
            left: `${Math.max(0, toMapX(vpLeft))}px`,
            top: `${Math.max(0, toMapY(vpTop))}px`,
            width: `${Math.min(mapWidth, vpWidth * scale)}px`,
            height: `${Math.min(mapHeight, vpHeight * scale)}px`,
          }}
          className="absolute border border-white/40 bg-white/[0.06] rounded pointer-events-none"
        />
      </div>
    </div>
  );
};
