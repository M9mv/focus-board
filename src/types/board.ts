// Element types available on the board
export type ElementType = 'note' | 'todo' | 'textbox' | 'image' | 'checklist' | 'divider' | 'icon' | 'mindmap';

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
  // Divider-specific
  rotation?: number;       // degrees
  thickness?: number;      // px
  dividerColor?: string;   // HSL string
  // Image-specific
  imageUrl?: string;       // data URL or external URL
  // Mind map specific
  mindmapNodes?: MindMapNode[];
  mindmapConnections?: MindMapConnection[];
}

export interface MindMapNode {
  id: string;
  x: number;       // relative to element origin
  y: number;
  width: number;
  height: number;
  label: string;
  emoji?: string;
  color?: string;
}

export interface MindMapConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
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

// App-level settings saved to localStorage
export interface AppSettings {
  snapToGrid: boolean;
  showMiniMap: boolean;
  theme: 'light' | 'dark' | 'custom';
  pomodoroWork: number;   // minutes
  pomodoroBreak: number;  // minutes
  waterReminder: boolean;
  pomodoroNotifications: boolean;
  customPrimaryColor?: string; // HSL string for custom theme
}

export const DEFAULT_SETTINGS: AppSettings = {
  snapToGrid: true,
  showMiniMap: true,
  theme: 'light',
  pomodoroWork: 25,
  pomodoroBreak: 5,
  waterReminder: true,
  pomodoroNotifications: true,
  customPrimaryColor: '211 100% 50%',
};

// Default sizes for each element type
export const DEFAULT_ELEMENT_SIZES: Record<ElementType, { width: number; height: number }> = {
  note: { width: 240, height: 200 },
  todo: { width: 260, height: 280 },
  textbox: { width: 300, height: 160 },
  image: { width: 280, height: 200 },
  checklist: { width: 260, height: 300 },
  divider: { width: 300, height: 4 },
  icon: { width: 80, height: 80 },
  mindmap: { width: 500, height: 400 },
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
  mindmap: 'Mind Map',
};
