// Element types available on the board (file removed per user request)
export type ElementType = 'note' | 'todo' | 'textbox' | 'image' | 'checklist' | 'divider' | 'icon';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  title?: string;
  content?: string;
  emoji?: string;
  fileName?: string;
  todos?: TodoItem[];
  color?: string;
}

export interface Board {
  id: string;
  name: string;
  bgColor: string;
  gridColor: string;
  showGrid: boolean;
  elements: BoardElement[];
  camera: { x: number; y: number };
  zoom: number;
  zoomLocked: boolean;
  lastSelectedElement?: string;
}

export interface BoardState {
  boards: Board[];
  currentBoardId: string;
}

// Default sizes for each element type
export const DEFAULT_ELEMENT_SIZES: Record<ElementType, { width: number; height: number }> = {
  note: { width: 240, height: 200 },
  todo: { width: 260, height: 280 },
  textbox: { width: 300, height: 160 },
  image: { width: 280, height: 200 },
  checklist: { width: 260, height: 300 },
  divider: { width: 300, height: 4 },
  icon: { width: 80, height: 80 },
};

// Labels shown in sidebar
export const ELEMENT_LABELS: Record<ElementType, string> = {
  note: 'Quick Note',
  todo: 'New To-Do List',
  textbox: 'Quick Text',
  image: 'Image Card',
  checklist: 'Checklist',
  divider: 'Divider',
  icon: 'Emoji',
};
