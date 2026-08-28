import { CanvasNode, CanvasEdge } from '../types/canvas';

interface PhysicsPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  width: number;
  height: number;
  isGroup: boolean;
}

export function applyForceDirectedLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  iterations = 80
): CanvasNode[] {
  if (nodes.length === 0) return nodes;

  const points: Record<string, PhysicsPoint> = {};
  nodes.forEach((n) => {
    points[n.id] = {
      x: n.x,
      y: n.y,
      vx: 0,
      vy: 0,
      mass: n.type === 'group' ? 4 : 1,
      width: n.width,
      height: n.height,
      isGroup: n.type === 'group',
    };
  });

  const kRepulsion = 450000;
  const kSpring = 0.04;
  const desiredDistance = 380;
  const damping = 0.82;

  for (let iter = 0; iter < iterations; iter++) {
    // 1. Repulsion between all pairs
    const nodeIds = Object.keys(points);
    for (let i = 0; i < nodeIds.length; i++) {
      const idA = nodeIds[i];
      const pA = points[idA];
      if (pA.isGroup) continue;

      for (let j = i + 1; j < nodeIds.length; j++) {
        const idB = nodeIds[j];
        const pB = points[idB];
        if (pB.isGroup) continue;

        const dx = pB.x + pB.width / 2 - (pA.x + pA.width / 2);
        const dy = pB.y + pB.height / 2 - (pA.y + pA.height / 2);
        const distSq = Math.max(1600, dx * dx + dy * dy);
        const dist = Math.sqrt(distSq);

        const force = kRepulsion / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        pA.vx -= fx / pA.mass;
        pA.vy -= fy / pA.mass;
        pB.vx += fx / pB.mass;
        pB.vy += fy / pB.mass;
      }
    }

    // 2. Spring Attraction along Edges
    edges.forEach((edge) => {
      const pA = points[edge.fromNode];
      const pB = points[edge.toNode];
      if (!pA || !pB || pA.isGroup || pB.isGroup) return;

      const dx = pB.x + pB.width / 2 - (pA.x + pA.width / 2);
      const dy = pB.y + pB.height / 2 - (pA.y + pA.height / 2);
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

      const displacement = dist - desiredDistance;
      const force = displacement * kSpring;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      pA.vx += fx / pA.mass;
      pA.vy += fy / pA.mass;
      pB.vx -= fx / pB.mass;
      pB.vy -= fy / pB.mass;
    });

    // 3. Update Positions with Damping
    nodeIds.forEach((id) => {
      const p = points[id];
      if (p.isGroup) return;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= damping;
      p.vy *= damping;
    });
  }

  return nodes.map((n) => {
    const p = points[n.id];
    if (!p || n.type === 'group') return n;
    return {
      ...n,
      x: Math.round(p.x),
      y: Math.round(p.y),
    };
  });
}
