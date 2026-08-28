import React, { useRef, useState, useEffect } from 'react';
import { CanvasNode, CanvasEdge, CanvasViewport, EdgeSide, NodeType } from '../types/canvas';
import { MarkdownNode } from './nodes/MarkdownNode';
import { CodeNode } from './nodes/CodeNode';
import { AudioNode } from './nodes/AudioNode';
import { MetricNode } from './nodes/MetricNode';
import { GroupNode } from './nodes/GroupNode';
import { AgentWorkerNode } from './nodes/AgentWorkerNode';
import { playSpatialClick, playConnectChord } from '../services/soundSynth';

interface Props {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: CanvasViewport;
  onUpdateViewport: (viewport: CanvasViewport) => void;
  onUpdateNode: (id: string, updates: Partial<CanvasNode>) => void;
  onDeleteNode: (id: string) => void;
  onAddEdge: (edge: CanvasEdge) => void;
  onDeleteEdge: (id: string) => void;
  onSelectNode: (id: string | null) => void;
}

export const Canvas: React.FC<Props> = ({
  nodes,
  edges,
  viewport,
  onUpdateViewport,
  onUpdateNode,
  onDeleteNode,
  onAddEdge,
  onDeleteEdge,
  onSelectNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connection Dragging
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; side: EdgeSide } | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Convert screen coordinates to canvas space
  const screenToCanvas = (screenX: number, screenY: number) => {
    return {
      x: (screenX - viewport.x) / viewport.zoom,
      y: (screenY - viewport.y) / viewport.zoom,
    };
  };

  // Direct Mouse Scroll to Zoom (Figma / Apple Freeform style)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    // If scrolling horizontally on trackpad, pan horizontally
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2) {
      onUpdateViewport({
        x: viewport.x - e.deltaX,
        y: viewport.y - e.deltaY,
        zoom: viewport.zoom,
      });
      return;
    }

    // Direct Wheel Zoom centered on cursor
    const zoomIntensity = 0.0015;
    const wheelFactor = Math.exp(-e.deltaY * zoomIntensity);
    const newZoom = Math.min(Math.max(0.15, viewport.zoom * wheelFactor), 3.0);

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
    const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);

    onUpdateViewport({ x: newX, y: newY, zoom: newZoom });
  };

  // Background Drag Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.button === 1 || // Middle mouse
      isSpacePressed ||
      (e.button === 0 && (e.target === containerRef.current || (e.target as HTMLElement).id === 'canvas-bg'))
    ) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      onSelectNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setMouseCanvasPos(canvasPos);

    if (isPanning) {
      onUpdateViewport({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
        zoom: viewport.zoom,
      });
    } else if (draggingNodeId) {
      const node = nodes.find((n) => n.id === draggingNodeId);
      if (node) {
        onUpdateNode(draggingNodeId, {
          x: Math.round(canvasPos.x - dragOffset.x),
          y: Math.round(canvasPos.y - dragOffset.y),
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (draggingNodeId) setDraggingNodeId(null);
    if (connectingFrom) setConnectingFrom(null);
  };

  // Calculate Node Anchor Point
  const getAnchorPos = (node: CanvasNode, side: EdgeSide) => {
    switch (side) {
      case 'top':
        return { x: node.x + node.width / 2, y: node.y };
      case 'right':
        return { x: node.x + node.width, y: node.y + node.height / 2 };
      case 'bottom':
        return { x: node.x + node.width / 2, y: node.y + node.height };
      case 'left':
        return { x: node.x, y: node.y + node.height / 2 };
    }
  };

  const handleConnectStart = (nodeId: string, side: EdgeSide, e: React.MouseEvent) => {
    e.stopPropagation();
    playSpatialClick(700, 0.04);
    setConnectingFrom({ nodeId, side });
  };

  const handleConnectEnd = (toNodeId: string, toSide: EdgeSide, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFrom && connectingFrom.nodeId !== toNodeId) {
      playConnectChord();
      onAddEdge({
        id: `edge_${Date.now()}`,
        fromNode: connectingFrom.nodeId,
        fromSide: connectingFrom.side,
        toNode: toNodeId,
        toSide: toSide,
        color: 'neutral',
        animated: true,
      });
    }
    setConnectingFrom(null);
  };

  const handleNodeMouseDown = (node: CanvasNode, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.handle')) {
      e.stopPropagation();
      playSpatialClick(900, 0.03);
      setDraggingNodeId(node.id);
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setDragOffset({ x: canvasPos.x - node.x, y: canvasPos.y - node.y });
      onSelectNode(node.id);
    }
  };

  const renderEdgePath = (from: { x: number; y: number }, to: { x: number; y: number }, fromSide: EdgeSide, toSide: EdgeSide) => {
    const dx = Math.abs(to.x - from.x) * 0.5;
    const dy = Math.abs(to.y - from.y) * 0.5;

    let c1 = { ...from };
    let c2 = { ...to };

    if (fromSide === 'right') c1.x += dx;
    if (fromSide === 'left') c1.x -= dx;
    if (fromSide === 'bottom') c1.y += dy;
    if (fromSide === 'top') c1.y -= dy;

    if (toSide === 'right') c2.x += dx;
    if (toSide === 'left') c2.x -= dx;
    if (toSide === 'bottom') c2.y += dy;
    if (toSide === 'top') c2.y -= dy;

    return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      id="canvas-bg"
      className={`w-screen h-screen overflow-hidden relative ${
        isSpacePressed || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      style={{
        backgroundColor: '#000000',
        backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.06) 1px, transparent 1px)`,
        backgroundSize: `${28 * viewport.zoom}px ${28 * viewport.zoom}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
    >
      {/* Canvas Transform Space */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* SVG Edge Layer */}
        <svg className="absolute inset-0 w-[10000px] h-[10000px] overflow-visible pointer-events-none">
          <defs>
            <filter id="appleGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Render Existing Edges */}
          {edges.map((edge) => {
            const fromNode = nodes.find((n) => n.id === edge.fromNode);
            const toNode = nodes.find((n) => n.id === edge.toNode);
            if (!fromNode || !toNode) return null;

            const fromPos = getAnchorPos(fromNode, edge.fromSide);
            const toPos = getAnchorPos(toNode, edge.toSide);
            const pathD = renderEdgePath(fromPos, toPos, edge.fromSide, edge.toSide);

            return (
              <g key={edge.id} className="pointer-events-auto group">
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={20}
                  className="cursor-pointer"
                  onClick={() => onDeleteEdge(edge.id)}
                />
                {/* Clean Silver Apple Wire */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth={1.75}
                  filter="url(#appleGlow)"
                  className="transition-colors group-hover:stroke-[#FF453A] group-hover:stroke-[2.5]"
                />
                {/* Moving Pulse Particle */}
                {edge.animated && (
                  <circle r={2.5} fill="#FFFFFF">
                    <animateMotion path={pathD} dur="2.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Label Badge */}
                {edge.label && (
                  <foreignObject
                    x={(fromPos.x + toPos.x) / 2 - 90}
                    y={(fromPos.y + toPos.y) / 2 - 12}
                    width={180}
                    height={24}
                    className="overflow-visible"
                  >
                    <div className="bg-[#0C0C0E]/95 border border-white/[0.08] text-zinc-300 text-[10px] font-mono px-2.5 py-0.5 rounded-full text-center truncate shadow-xl">
                      {edge.label}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* Active Connection Line while Dragging */}
          {connectingFrom && (
            (() => {
              const fromNode = nodes.find((n) => n.id === connectingFrom.nodeId);
              if (!fromNode) return null;
              const fromPos = getAnchorPos(fromNode, connectingFrom.side);
              const pathD = renderEdgePath(fromPos, mouseCanvasPos, connectingFrom.side, 'left');
              return (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#0A84FF"
                  strokeWidth={2}
                  strokeDasharray="4,4"
                  className="animate-pulse"
                />
              );
            })()
          )}
        </svg>

        {/* Node Components */}
        {nodes.map((node) => {
          const isGroup = node.type === 'group';

          return (
            <div
              key={node.id}
              style={{
                transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                width: `${node.width}px`,
                height: `${node.height}px`,
                zIndex: isGroup ? 1 : 10,
              }}
              onMouseDown={(e) => handleNodeMouseDown(node, e)}
              className="absolute pointer-events-auto"
            >
              {node.type === 'markdown' && (
                <MarkdownNode node={node} onUpdate={onUpdateNode} onDelete={onDeleteNode} />
              )}
              {node.type === 'code' && (
                <CodeNode node={node} onUpdate={onUpdateNode} onDelete={onDeleteNode} />
              )}
              {node.type === 'audio' && (
                <AudioNode node={node} onUpdate={onUpdateNode} onDelete={onDeleteNode} />
              )}
              {node.type === 'metric' && (
                <MetricNode node={node} onUpdate={onUpdateNode} onDelete={onDeleteNode} />
              )}
              {node.type === 'agent' && (
                <AgentWorkerNode node={node} onUpdate={onUpdateNode} onDelete={onDeleteNode} />
              )}
              {node.type === 'group' && (
                <GroupNode node={node} onUpdate={onUpdateNode} onDelete={onDeleteNode} />
              )}

              {/* Anchor Handles */}
              {!isGroup && (
                <>
                  {(['top', 'right', 'bottom', 'left'] as const).map((side) => {
                    let posClass = '';
                    if (side === 'top') posClass = 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2';
                    if (side === 'right') posClass = 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2';
                    if (side === 'bottom') posClass = 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2';
                    if (side === 'left') posClass = 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2';

                    return (
                      <div
                        key={side}
                        onMouseDown={(e) => handleConnectStart(node.id, side, e)}
                        onMouseUp={(e) => handleConnectEnd(node.id, side, e)}
                        className={`absolute ${posClass} w-3 h-3 bg-black border border-white/40 rounded-full cursor-crosshair opacity-0 group-hover:opacity-100 hover:opacity-100 hover:scale-125 hover:border-[#0A84FF] transition-all z-20 shadow-md`}
                        title={`Connect ${side}`}
                      />
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
