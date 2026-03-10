import { useState, useEffect, useCallback } from 'react';
import { Board, BoardElement, BoardState, ElementType, DEFAULT_ELEMENT_SIZES } from '@/types/board';

const STORAGE_KEY = 'study-dashboard-boards';

// Default board: black background with white grid dots
const createDefaultBoard = (): Board => ({
  id: crypto.randomUUID(),
  name: 'My Board',
  bgColor: '#52b1b2',
  gridColor: '#fdfcfd',
  showGrid: true,
  isCollaborative: false,
  elements: [],
  camera: { x: 0, y: 0 },
  zoom: 1,
  zoomLocked: false,
});

const loadState = (): BoardState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.boards?.length) return parsed;
    }
  } catch { /* ignore */ }
  const defaultBoard = createDefaultBoard();
  return { boards: [defaultBoard], currentBoardId: defaultBoard.id };
};

export const useBoard = () => {
  const [state, setState] = useState<BoardState>(loadState);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const currentBoard = state.boards.find(b => b.id === state.currentBoardId) || state.boards[0];

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateCurrentBoard = useCallback((updater: (board: Board) => Board) => {
    setState(prev => ({
      ...prev,
      boards: prev.boards.map(b => b.id === prev.currentBoardId ? updater(b) : b),
    }));
  }, []);

  const addBoard = useCallback((name: string, bgColor: string, gridColor: string, showGrid: boolean, isCollaborative: boolean = false) => {
    const newBoard: Board = { ...createDefaultBoard(), name, bgColor, gridColor, showGrid, isCollaborative };
    setState(prev => ({
      boards: [...prev.boards, newBoard],
      currentBoardId: newBoard.id,
    }));
  }, []);

  const switchBoard = useCallback((id: string) => {
    setState(prev => ({ ...prev, currentBoardId: id }));
    setSelectedElementId(null);
  }, []);

  const deleteBoard = useCallback((id: string) => {
    setState(prev => {
      if (prev.boards.length <= 1) return prev;
      const newBoards = prev.boards.filter(b => b.id !== id);
      return {
        boards: newBoards,
        currentBoardId: prev.currentBoardId === id ? newBoards[0].id : prev.currentBoardId,
      };
    });
  }, []);

  const addElement = useCallback((type: ElementType, x: number, y: number) => {
    const size = DEFAULT_ELEMENT_SIZES[type];
    const maxZ = currentBoard.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    const defaults: Partial<BoardElement> = {};
    if (type === 'note') defaults.title = 'Quick Note';
    if (type === 'todo') { defaults.title = 'New To-Do List'; defaults.todos = [{ id: crypto.randomUUID(), text: 'New task', completed: false }]; }
    if (type === 'textbox') { defaults.title = 'Quick Text'; defaults.content = 'Start typing...'; }
    if (type === 'checklist') { defaults.title = 'Checklist'; defaults.todos = [{ id: crypto.randomUUID(), text: 'Item 1', completed: false }]; }
    if (type === 'icon') defaults.emoji = '📚';
    if (type === 'image') defaults.title = 'Image Card';
    if (type === 'mindmap') {
      defaults.title = 'Mind Map';
      const centerId = crypto.randomUUID();
      defaults.mindmapNodes = [
        { id: centerId, x: 200, y: 160, width: 100, height: 40, label: 'Central Idea', color: 'hsl(210,80%,60%)' },
      ];
      defaults.mindmapConnections = [];
    }

    const newElement: BoardElement = {
      id: crypto.randomUUID(),
      type,
      x: Math.round(x / 20) * 20,
      y: Math.round(y / 20) * 20,
      ...size,
      zIndex: maxZ + 1,
      ...defaults,
    };
    updateCurrentBoard(b => ({ ...b, elements: [...b.elements, newElement] }));
    setSelectedElementId(newElement.id);
    return newElement.id;
  }, [currentBoard.elements, updateCurrentBoard]);

  const updateElement = useCallback((id: string, updates: Partial<BoardElement>) => {
    updateCurrentBoard(b => ({
      ...b,
      elements: b.elements.map(el => el.id === id ? { ...el, ...updates } : el),
    }));
  }, [updateCurrentBoard]);

  const deleteElement = useCallback((id: string) => {
    updateCurrentBoard(b => ({ ...b, elements: b.elements.filter(el => el.id !== id) }));
    setSelectedElementId(prev => prev === id ? null : prev);
  }, [updateCurrentBoard]);

  const bringToFront = useCallback((id: string) => {
    const maxZ = currentBoard.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    updateElement(id, { zIndex: maxZ + 1 });
  }, [currentBoard.elements, updateElement]);

  const duplicateElement = useCallback((id: string) => {
    const el = currentBoard.elements.find(e => e.id === id);
    if (!el) return;
    const newEl: BoardElement = { ...el, id: crypto.randomUUID(), x: el.x + 20, y: el.y + 20, zIndex: el.zIndex + 1 };
    updateCurrentBoard(b => ({ ...b, elements: [...b.elements, newEl] }));
    setSelectedElementId(newEl.id);
  }, [currentBoard.elements, updateCurrentBoard]);

  const setCamera = useCallback((camera: { x: number; y: number }) => {
    updateCurrentBoard(b => ({ ...b, camera }));
  }, [updateCurrentBoard]);

  const setZoom = useCallback((zoom: number) => {
    updateCurrentBoard(b => ({ ...b, zoom: Math.min(3, Math.max(0.1, zoom)) }));
  }, [updateCurrentBoard]);

  const toggleZoomLock = useCallback(() => {
    updateCurrentBoard(b => ({ ...b, zoomLocked: !b.zoomLocked }));
  }, [updateCurrentBoard]);

  return {
    boards: state.boards,
    currentBoard,
    currentBoardId: state.currentBoardId,
    selectedElementId,
    setSelectedElementId,
    addBoard, switchBoard, deleteBoard,
    addElement, updateElement, deleteElement,
    bringToFront, duplicateElement,
    setCamera, setZoom, toggleZoomLock,
    updateCurrentBoard,
  };
};
