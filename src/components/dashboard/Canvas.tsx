import { useRef, useEffect, useState, useCallback } from 'react';
import { Board, BoardElement as BoardElementType, ElementType } from '@/types/board';
import BoardElement from './BoardElement';

interface CanvasProps {
  board: Board;
  selectedElementId: string | null;
  onAddElement: (type: ElementType, x: number, y: number) => string;
  onUpdateElement: (id: string, updates: Partial<BoardElementType>) => void;
  onDeleteElement: (id: string) => void;
  onSelectElement: (id: string | null) => void;
  onBringToFront: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onSetCamera: (camera: { x: number; y: number }) => void;
  onSetZoom: (zoom: number) => void;
  onInteraction?: () => void;
  snapToGrid?: boolean;
}

const Canvas = ({
  board, selectedElementId, onAddElement, onUpdateElement,
  onDeleteElement, onSelectElement, onBringToFront,
  onDuplicateElement, onSetCamera, onSetZoom, onInteraction,
  snapToGrid = true,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const isDraggingElement = useRef(false);
  const isResizing = useRef(false);
  const panStart = useRef({ x: 0, y: 0, camX: 0, camY: 0 });
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0, elementId: '' });
  const resizeStart = useRef({ x: 0, y: 0, elW: 0, elH: 0, elementId: '', corner: '' });
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const [cursorClass, setCursorClass] = useState('cursor-grab');

  const cameraRef = useRef(board.camera);
  const zoomRef = useRef(board.zoom);
  const zoomLockedRef = useRef(board.zoomLocked);
  useEffect(() => { cameraRef.current = board.camera; }, [board.camera]);
  useEffect(() => { zoomRef.current = board.zoom; }, [board.zoom]);
  useEffect(() => { zoomLockedRef.current = board.zoomLocked; }, [board.zoomLocked]);

  const snap = (val: number) => snapToGrid ? Math.round(val / 20) * 20 : val;

  // Wheel zoom - blocked when locked
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (zoomLockedRef.current) return;
      e.preventDefault();
      onInteraction?.();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const cam = cameraRef.current;
      const z = zoomRef.current;
      const worldX = (mouseX - cam.x) / z;
      const worldY = (mouseY - cam.y) / z;
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Math.min(3, Math.max(0.1, z * factor));
      onSetZoom(newZoom);
      onSetCamera({ x: mouseX - worldX * newZoom, y: mouseY - worldY * newZoom });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [onSetZoom, onSetCamera, onInteraction]);

  // Document-level mousemove/mouseup
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        onSetCamera({ x: panStart.current.camX + dx, y: panStart.current.camY + dy });
      }
      if (isDraggingElement.current) {
        const z = zoomRef.current;
        const dx = (e.clientX - dragStart.current.x) / z;
        const dy = (e.clientY - dragStart.current.y) / z;
        const newX = snap(dragStart.current.elX + dx);
        const newY = snap(dragStart.current.elY + dy);
        onUpdateElement(dragStart.current.elementId, { x: newX, y: newY });
      }
      if (isResizing.current) {
        const z = zoomRef.current;
        const dx = (e.clientX - resizeStart.current.x) / z;
        const dy = (e.clientY - resizeStart.current.y) / z;
        const newW = Math.max(60, snap(resizeStart.current.elW + dx));
        const newH = Math.max(20, snap(resizeStart.current.elH + dy));
        onUpdateElement(resizeStart.current.elementId, { width: newW, height: newH });
      }
    };
    const handleUp = (e: MouseEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - mouseDownPos.current.x;
        const dy = e.clientY - mouseDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) < 5) onSelectElement(null);
      }
      isPanning.current = false;
      isDraggingElement.current = false;
      isResizing.current = false;
      setCursorClass('cursor-grab');
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => { document.removeEventListener('mousemove', handleMove); document.removeEventListener('mouseup', handleUp); };
  }, [onSetCamera, onUpdateElement, onSelectElement, snapToGrid]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (board.zoomLocked) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, camX: board.camera.x, camY: board.camera.y };
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    setCursorClass('cursor-grabbing');
    onInteraction?.();
  };

  const handleElementMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = board.elements.find(el => el.id === id);
    if (!el) return;
    isDraggingElement.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, elX: el.x, elY: el.y, elementId: id };
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    onBringToFront(id);
    onSelectElement(id);
    setCursorClass('cursor-grabbing');
  }, [board.elements, onBringToFront, onSelectElement]);

  const handleResizeMouseDown = useCallback((id: string, corner: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = board.elements.find(el => el.id === id);
    if (!el) return;
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, elW: el.width, elH: el.height, elementId: id, corner };
    setCursorClass('cursor-nwse-resize');
  }, [board.elements]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('element-type') as ElementType;
    if (!type) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - board.camera.x) / board.zoom;
    const y = (e.clientY - rect.top - board.camera.y) / board.zoom;
    onAddElement(type, x, y);
  };

  const gridSize = 20 * board.zoom;
  const gridStyle = board.showGrid ? {
    backgroundImage: `radial-gradient(circle, ${board.gridColor} 1px, transparent 1px)`,
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundPosition: `${board.camera.x % gridSize}px ${board.camera.y % gridSize}px`,
  } : {};

  return (
    <div
      ref={canvasRef}
      className={`flex-1 relative overflow-hidden ${cursorClass}`}
      style={{ backgroundColor: board.bgColor, ...gridStyle }}
      onMouseDown={handleCanvasMouseDown}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div
        style={{
          transform: `translate(${board.camera.x}px, ${board.camera.y}px) scale(${board.zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {board.elements.map(el => (
          <BoardElement
            key={el.id}
            element={el}
            selected={el.id === selectedElementId}
            onMouseDown={(e) => handleElementMouseDown(el.id, e)}
            onUpdate={(updates) => onUpdateElement(el.id, updates)}
            onDelete={() => onDeleteElement(el.id)}
            onDuplicate={() => onDuplicateElement(el.id)}
            onResizeMouseDown={(corner, e) => handleResizeMouseDown(el.id, corner, e)}
          />
        ))}
      </div>
    </div>
  );
};

export default Canvas;
