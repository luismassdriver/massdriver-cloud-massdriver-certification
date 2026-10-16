"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * A small Massdriver-style canvas for the home page: each track is a bundle
 * node you can drag around, joined by a connection from the Ops / Platform
 * node's output port to the Developer node's input port. Positions are kept
 * in localStorage per browser; "Reset layout" puts them back.
 *
 * No dependencies: pointer events for dragging, an SVG for the edge.
 */

export interface CanvasNode {
  id: string;
  content: ReactNode;
}

type Pos = { x: number; y: number };
type Layout = Record<string, Pos>;

const NODE_W = 320;
const PAD = 16; // keeps the rosette (which overhangs the card) inside the canvas
const CANVAS_H = 460;
const CANVAS_H_NARROW = 620;
const NARROW_BELOW = NODE_W * 2 + 56; // below this the nodes stack vertically
const LAYOUT_KEY = "md-cert-home-layout-v1";
const DRAG_THRESHOLD = 4;

// The saved layout lives in localStorage; read through useSyncExternalStore so
// the server render (no storage) and the client agree, and changes re-render.
const LAYOUT_EVENT = "md-cert-layout";
function subscribeSaved(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LAYOUT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LAYOUT_EVENT, onChange);
  };
}
function readSaved(): string | null {
  try {
    return localStorage.getItem(LAYOUT_KEY);
  } catch {
    return null;
  }
}
function writeSaved(layout: Layout | null) {
  try {
    if (layout) localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
    else localStorage.removeItem(LAYOUT_KEY);
  } catch {
    // storage unavailable: layout just won't persist
  }
  window.dispatchEvent(new Event(LAYOUT_EVENT));
}

function defaultLayout(width: number, ids: string[], heights: Record<string, number>): Layout {
  const [left, right] = ids;
  if (width < NARROW_BELOW) {
    // Stacked: the top node's output runs down into the bottom node's input.
    const x = Math.max(PAD, (width - NODE_W) / 2);
    return { [left]: { x, y: PAD + 8 }, [right]: { x, y: PAD + 8 + (heights[left] ?? 240) + 72 } };
  }
  return {
    [left]: { x: PAD, y: 48 },
    [right]: { x: width - NODE_W - PAD, y: 120 },
  };
}

export function TrackCanvas({ nodes, edge }: { nodes: CanvasNode[]; edge: [string, string] }) {
  const ids = nodes.map((n) => n.id);
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [width, setWidth] = useState(0);
  // Positions while dragging (or after a drag), on top of what is saved.
  const [live, setLive] = useState<Layout | null>(null);
  const savedRaw = useSyncExternalStore(subscribeSaved, readSaved, () => null);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const drag = useRef<{ id: string; startX: number; startY: number; origin: Pos; moved: boolean } | null>(null);

  // Measure the canvas and the nodes so the edge can be drawn between real ports.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWidth(el.clientWidth);
      const h: Record<string, number> = {};
      for (const id of ids) h[id] = nodeRefs.current[id]?.offsetHeight ?? 0;
      setHeights(h);
    });
    ro.observe(el);
    for (const id of ids) {
      const n = nodeRefs.current[id];
      if (n) ro.observe(n);
    }
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  let layout: Layout | null = null;
  if (width) {
    let saved: Layout | null = null;
    try {
      saved = savedRaw ? (JSON.parse(savedRaw) as Layout) : null;
    } catch {
      saved = null;
    }
    const fits = saved && ids.every((id) => saved![id] && saved![id].x + NODE_W <= width + 1);
    layout = live ?? (fits ? saved! : defaultLayout(width, ids, heights));
  }
  const narrow = width > 0 && width < NARROW_BELOW;
  const canvasH = narrow ? CANVAS_H_NARROW : CANVAS_H;

  function clamp(p: Pos, id: string): Pos {
    const h = heights[id] ?? 200;
    return {
      x: Math.min(Math.max(PAD, p.x), Math.max(PAD, width - NODE_W - PAD)),
      y: Math.min(Math.max(PAD, p.y), Math.max(PAD, canvasH - h - PAD)),
    };
  }

  function onPointerDown(id: string, e: ReactPointerEvent<HTMLDivElement>) {
    // Buttons and links inside the card keep working as normal clicks.
    if ((e.target as HTMLElement).closest("a, button, input, label")) return;
    if (!layout) return;
    drag.current = { id, startX: e.clientX, startY: e.clientY, origin: layout[id], moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || !layout) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    setDragging(d.id);
    setLive({ ...layout, [d.id]: clamp({ x: d.origin.x + dx, y: d.origin.y + dy }, d.id) });
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setDragging(null);
    if (d?.moved && layout) writeSaved(layout);
  }

  function reset() {
    setLive(null);
    writeSaved(null);
  }

  // Edge: from the right port of the source node to the left port of the target.
  const [from, to] = edge;
  let path = "";
  let mid: Pos | null = null;
  if (layout && layout[from] && layout[to]) {
    if (narrow) {
      // Ports on the bottom / top edges; the curve runs vertically.
      const a = { x: layout[from].x + NODE_W / 2, y: layout[from].y + (heights[from] ?? 200) };
      const b = { x: layout[to].x + NODE_W / 2, y: layout[to].y };
      const bend = Math.max(32, Math.abs(b.y - a.y) / 2);
      path = `M ${a.x} ${a.y} C ${a.x} ${a.y + bend}, ${b.x} ${b.y - bend}, ${b.x} ${b.y}`;
      mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    } else {
      const a = { x: layout[from].x + NODE_W, y: layout[from].y + (heights[from] ?? 200) / 2 };
      const b = { x: layout[to].x, y: layout[to].y + (heights[to] ?? 200) / 2 };
      const bend = Math.max(40, Math.abs(b.x - a.x) / 2);
      path = `M ${a.x} ${a.y} C ${a.x + bend} ${a.y}, ${b.x - bend} ${b.y}, ${b.x} ${b.y}`;
      mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  }

  return (
    <div className="space-y-2">
      <div
        ref={canvasRef}
        className={`track-canvas ${narrow ? "is-narrow" : ""}`}
        style={{ height: canvasH }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <svg className="track-canvas-edges" aria-hidden>
          {path && (
            <>
              <path d={path} className="track-canvas-edge" />
              {mid && (
                <g transform={`translate(${mid.x} ${mid.y})`} className="track-canvas-edge-mid">
                  <circle r="7" />
                  <path d="M -2.5 -2.5 L 2.5 2.5 M 2.5 -2.5 L -2.5 2.5" />
                </g>
              )}
            </>
          )}
        </svg>

        {nodes.map((n) => {
          const pos = layout?.[n.id];
          const isSource = n.id === from;
          const isTarget = n.id === to;
          return (
            <div
              key={n.id}
              ref={(el) => {
                nodeRefs.current[n.id] = el;
              }}
              className={`track-canvas-node ${dragging === n.id ? "is-dragging" : ""}`}
              style={{
                width: NODE_W,
                transform: pos ? `translate(${pos.x}px, ${pos.y}px)` : undefined,
                visibility: pos ? "visible" : "hidden",
              }}
              onPointerDown={(e) => onPointerDown(n.id, e)}
            >
              {isTarget && <span className="track-canvas-port track-canvas-port-in" aria-hidden />}
              {isSource && <span className="track-canvas-port track-canvas-port-out" aria-hidden />}
              {n.content}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-muted">
        <span>Drag the bundles around · Ops / Platform provisions what Developers deploy onto</span>
        <button type="button" onClick={reset} className="text-muted transition hover:text-brand">
          Reset layout
        </button>
      </div>
    </div>
  );
}
