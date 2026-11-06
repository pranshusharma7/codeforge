import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  PenTool,
  Square,
  Circle,
  MoveRight,
  Eraser,
  Trash2,
  Download,
  Undo2,
} from 'lucide-react';
import type { WhiteboardElement } from '../../lib/collab/types';
import whiteboardStore from '../../lib/collab/whiteboardStore';

interface CollaborativeWhiteboardProps {
  roomId: string;
}

export const CollaborativeWhiteboard: React.FC<CollaborativeWhiteboardProps> = ({ roomId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'rect' | 'circle' | 'arrow' | 'eraser'>('pen');
  const [color, setColor] = useState<string>('#8b5cf6');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const colors = ['#8b5cf6', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#ffffff'];

  // Subscribe to shared whiteboard store
  useEffect(() => {
    const unsub = whiteboardStore.subscribe((sharedElements) => {
      setElements([...sharedElements]);
    });
    return unsub;
  }, []);

  // Redraw canvas whenever elements change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const el of elements) {
      ctx.strokeStyle = el.color;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'freehand' && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (el.type === 'rectangle' && el.x !== undefined && el.y !== undefined && el.width && el.height) {
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (el.type === 'circle' && el.x !== undefined && el.y !== undefined && el.width) {
        ctx.beginPath();
        const radius = Math.abs(el.width / 2);
        ctx.arc(el.x + radius, el.y + radius, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (el.type === 'arrow' && el.points && el.points.length >= 2) {
        const from = el.points[0];
        const to = el.points[1];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const headLen = 10;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    }
  }, [elements]);

  useEffect(() => {
    redrawCanvas();
  }, [elements, redrawCanvas]);

  // Adjust canvas size to container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight - 48; // offset for toolbar
      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // ── Mouse & Touch Event Handlers ───────────────────────────────────────────
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    startPosRef.current = coords;

    if (tool === 'pen' || tool === 'eraser') {
      currentPathRef.current = [coords];
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);

    if (tool === 'pen' || tool === 'eraser') {
      currentPathRef.current.push(coords);

      // Realtime local preview
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && currentPathRef.current.length > 1) {
        ctx.strokeStyle = tool === 'eraser' ? '#0c0e14' : color;
        ctx.lineWidth = tool === 'eraser' ? 16 : strokeWidth;
        ctx.lineCap = 'round';
        const p1 = currentPathRef.current[currentPathRef.current.length - 2];
        const p2 = currentPathRef.current[currentPathRef.current.length - 1];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const coords = getCanvasCoords(e);

    const newElementId = 'el_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    if (tool === 'pen' || tool === 'eraser') {
      if (currentPathRef.current.length > 1) {
        whiteboardStore.addElement({
          id: newElementId,
          type: 'freehand',
          points: [...currentPathRef.current],
          color: tool === 'eraser' ? '#0c0e14' : color,
          strokeWidth: tool === 'eraser' ? 16 : strokeWidth,
        });
      }
      currentPathRef.current = [];
    } else if (tool === 'rect') {
      const x = Math.min(startPosRef.current.x, coords.x);
      const y = Math.min(startPosRef.current.y, coords.y);
      const width = Math.abs(coords.x - startPosRef.current.x);
      const height = Math.abs(coords.y - startPosRef.current.y);

      if (width > 2 && height > 2) {
        whiteboardStore.addElement({
          id: newElementId,
          type: 'rectangle',
          x,
          y,
          width,
          height,
          color,
          strokeWidth,
        });
      }
    } else if (tool === 'circle') {
      const x = Math.min(startPosRef.current.x, coords.x);
      const y = Math.min(startPosRef.current.y, coords.y);
      const width = Math.abs(coords.x - startPosRef.current.x);
      const height = Math.abs(coords.y - startPosRef.current.y);

      if (width > 2) {
        whiteboardStore.addElement({
          id: newElementId,
          type: 'circle',
          x,
          y,
          width: Math.max(width, height),
          height: Math.max(width, height),
          color,
          strokeWidth,
        });
      }
    } else if (tool === 'arrow') {
      whiteboardStore.addElement({
        id: newElementId,
        type: 'arrow',
        points: [startPosRef.current, coords],
        color,
        strokeWidth,
      });
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-panel)] overflow-hidden select-none">
      {/* Whiteboard Toolbar */}
      <div
        style={{
          background: 'var(--bg-header)',
          borderColor: 'var(--border)',
        }}
        className="h-12 px-3 border-b flex items-center justify-between gap-2 shrink-0 flex-wrap"
      >
        {/* Tool selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTool('pen')}
            style={{
              background: tool === 'pen' ? 'var(--accent)' : 'var(--bg-hover)',
              color: tool === 'pen' ? '#fff' : 'var(--text-muted)',
            }}
            className="p-1.5 rounded-lg text-xs transition-colors"
            title="Pen (Freehand)"
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('rect')}
            style={{
              background: tool === 'rect' ? 'var(--accent)' : 'var(--bg-hover)',
              color: tool === 'rect' ? '#fff' : 'var(--text-muted)',
            }}
            className="p-1.5 rounded-lg text-xs transition-colors"
            title="Rectangle"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('circle')}
            style={{
              background: tool === 'circle' ? 'var(--accent)' : 'var(--bg-hover)',
              color: tool === 'circle' ? '#fff' : 'var(--text-muted)',
            }}
            className="p-1.5 rounded-lg text-xs transition-colors"
            title="Circle"
          >
            <Circle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('arrow')}
            style={{
              background: tool === 'arrow' ? 'var(--accent)' : 'var(--bg-hover)',
              color: tool === 'arrow' ? '#fff' : 'var(--text-muted)',
            }}
            className="p-1.5 rounded-lg text-xs transition-colors"
            title="Arrow"
          >
            <MoveRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            style={{
              background: tool === 'eraser' ? 'var(--accent)' : 'var(--bg-hover)',
              color: tool === 'eraser' ? '#fff' : 'var(--text-muted)',
            }}
            className="p-1.5 rounded-lg text-xs transition-colors"
            title="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                backgroundColor: c,
                borderColor: color === c ? 'var(--text-base)' : 'transparent',
              }}
              className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-110"
              title={`Color: ${c}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => whiteboardStore.clear()}
            style={{ color: 'var(--red)', background: 'var(--bg-hover)' }}
            className="p-1.5 rounded-lg text-xs transition-colors"
            title="Clear Canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportPNG}
            style={{ color: 'var(--accent)', background: 'var(--bg-hover)' }}
            className="p-1.5 rounded-lg text-xs transition-colors"
            title="Export as PNG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="flex-1 w-full h-full relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};

export default CollaborativeWhiteboard;

