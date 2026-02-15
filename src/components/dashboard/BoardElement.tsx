import { useState, useRef, useCallback } from 'react';
import {
  ImageIcon, Trash2, Copy, Plus, RotateCw, Palette, Smile,
} from 'lucide-react';
import { BoardElement as BoardElementType, TodoItem, MindMapNode, MindMapConnection } from '@/types/board';

// Common emoji categories for quick picking
const EMOJI_GRID = [
  '📚','📖','✏️','📝','💡','🎯','⭐','🔥',
  '❤️','💪','🧠','🎓','📅','⏰','🔔','✅',
  '❌','⚡','🌟','🏆','🎉','💻','🎨','🎵',
  '🌈','☀️','🌙','🍀','🦋','🐱','🐶','🌸',
];

interface BoardElementProps {
  element: BoardElementType;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onUpdate: (updates: Partial<BoardElementType>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onResizeMouseDown: (corner: string, e: React.MouseEvent) => void;
}

const BoardElement = ({ element, selected, onMouseDown, onUpdate, onDelete, onDuplicate, onResizeMouseDown }: BoardElementProps) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mind map: dragging node
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const nodeDragStart = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitle(true);
    setTimeout(() => titleRef.current?.select(), 0);
  };

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setEditingTitle(false);
    onUpdate({ title: e.target.value || element.title });
  };

  const toggleTodo = (todoId: string) => {
    if (!element.todos) return;
    onUpdate({ todos: element.todos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t) });
  };

  const addTodo = () => {
    const newTodo: TodoItem = { id: crypto.randomUUID(), text: 'New task', completed: false };
    onUpdate({ todos: [...(element.todos || []), newTodo] });
  };

  const updateTodoText = (todoId: string, text: string) => {
    if (!element.todos) return;
    onUpdate({ todos: element.todos.map(t => t.id === todoId ? { ...t, text } : t) });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { onUpdate({ imageUrl: ev.target?.result as string }); };
    reader.readAsDataURL(file);
  };

  const selectEmoji = (emoji: string) => {
    onUpdate({ emoji });
    setShowEmojiPicker(false);
  };

  // ===== Mind Map helpers =====
  const addMindMapNode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const nodes = element.mindmapNodes || [];
    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      x: 50 + Math.random() * 300,
      y: 50 + Math.random() * 250,
      width: 100, height: 36,
      label: 'New Node',
      color: `hsl(${Math.floor(Math.random() * 360)},70%,60%)`,
    };
    onUpdate({ mindmapNodes: [...nodes, newNode] });
  }, [element.mindmapNodes, onUpdate]);

  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFrom === '__pick__') {
      // First node selected - set as source
      setConnectingFrom(nodeId);
      return;
    }
    if (connectingFrom && connectingFrom !== '__pick__') {
      // Second node selected - complete connection
      if (connectingFrom !== nodeId) {
        const conns = element.mindmapConnections || [];
        const exists = conns.some(c =>
          (c.fromNodeId === connectingFrom && c.toNodeId === nodeId) ||
          (c.fromNodeId === nodeId && c.toNodeId === connectingFrom)
        );
        if (!exists) {
          onUpdate({
            mindmapConnections: [...conns, { id: crypto.randomUUID(), fromNodeId: connectingFrom, toNodeId: nodeId }],
          });
        }
      }
      setConnectingFrom(null);
      return;
    }
    const node = element.mindmapNodes?.find(n => n.id === nodeId);
    if (!node) return;
    setDraggingNode(nodeId);
    nodeDragStart.current = { x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y };

    const handleMove = (ev: MouseEvent) => {
      const dx = ev.clientX - nodeDragStart.current.x;
      const dy = ev.clientY - nodeDragStart.current.y;
      const updated = (element.mindmapNodes || []).map(n =>
        n.id === nodeId ? { ...n, x: nodeDragStart.current.nodeX + dx, y: nodeDragStart.current.nodeY + dy } : n
      );
      onUpdate({ mindmapNodes: updated });
    };
    const handleUp = () => {
      setDraggingNode(null);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [connectingFrom, element.mindmapNodes, element.mindmapConnections, onUpdate]);

  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    onUpdate({
      mindmapNodes: (element.mindmapNodes || []).map(n => n.id === nodeId ? { ...n, label } : n),
    });
  }, [element.mindmapNodes, onUpdate]);

  const deleteNode = useCallback((nodeId: string) => {
    onUpdate({
      mindmapNodes: (element.mindmapNodes || []).filter(n => n.id !== nodeId),
      mindmapConnections: (element.mindmapConnections || []).filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId),
    });
  }, [element.mindmapNodes, element.mindmapConnections, onUpdate]);

  const bgClass: Record<string, string> = {
    note: 'element-note', todo: 'element-todo', textbox: 'element-text',
    checklist: 'element-checklist', image: 'element-image', mindmap: 'bg-card/80',
  };

  const renderTitle = () => {
    if (!element.title && element.title !== '') return null;
    return editingTitle ? (
      <input
        ref={titleRef}
        className="text-sm font-semibold bg-transparent outline-none border-b border-primary/30 text-foreground"
        defaultValue={element.title}
        onBlur={handleTitleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        onMouseDown={(e) => e.stopPropagation()}
        autoFocus
      />
    ) : (
      <h3 className="text-sm font-semibold text-foreground truncate cursor-text" onDoubleClick={handleTitleDoubleClick}>
        {element.title}
      </h3>
    );
  };

  const renderContent = () => {
    switch (element.type) {
      case 'note':
        return (
          <div className="p-3 h-full flex flex-col">
            {renderTitle()}
            <textarea
              className="flex-1 bg-transparent text-sm resize-none outline-none text-foreground/80 mt-2 placeholder:text-muted-foreground"
              placeholder="Write your note..."
              value={element.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
        );
      case 'todo':
      case 'checklist':
        return (
          <div className="p-3 h-full flex flex-col">
            {renderTitle()}
            <div className="flex-1 mt-2 space-y-1.5 overflow-y-auto">
              {element.todos?.map(todo => (
                <div key={todo.id} className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleTodo(todo.id); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                      todo.completed ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                    }`}
                  >
                    {todo.completed && <span className="text-primary-foreground text-[10px]">✓</span>}
                  </button>
                  <input
                    className={`flex-1 bg-transparent text-sm outline-none ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                    value={todo.text}
                    onChange={(e) => updateTodoText(todo.id, e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); addTodo(); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2"
            >
              <Plus className="w-3 h-3" /> Add item
            </button>
          </div>
        );
      case 'textbox':
        return (
          <div className="p-3 h-full flex flex-col">
            {renderTitle()}
            <textarea
              className="flex-1 bg-transparent text-sm resize-none outline-none text-foreground/80 mt-2"
              value={element.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
        );
      case 'image':
        return (
          <div className="p-3 h-full flex flex-col items-center justify-center">
            {element.imageUrl ? (
              <img src={element.imageUrl} alt={element.title || 'Image'} className="w-full h-full object-cover rounded-lg" onMouseDown={(e) => e.stopPropagation()} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} onMouseDown={(e) => e.stopPropagation()}>
                <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground">Click to add image</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        );
      case 'divider':
        return (
          <div className="w-full h-full flex items-center justify-center px-1">
            <div className="w-full rounded-full" style={{ height: element.thickness || 2, backgroundColor: element.dividerColor || 'hsl(var(--border))' }} />
          </div>
        );
      case 'icon':
        return (
          <div className="w-full h-full flex items-center justify-center text-4xl select-none cursor-pointer relative" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}>
            {element.emoji || '📚'}
            {/* Emoji picker dropdown */}
            {showEmojiPicker && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 glass rounded-xl ios-shadow-lg p-2 grid grid-cols-8 gap-1 w-72 animate-scale-in" onMouseDown={(e) => e.stopPropagation()}>
                {EMOJI_GRID.map(em => (
                  <button key={em} onClick={(e) => { e.stopPropagation(); selectEmoji(em); }} className="w-8 h-8 flex items-center justify-center text-xl hover:bg-secondary rounded-lg transition-colors">
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      case 'mindmap':
        return (
          <div className="w-full h-full relative overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            {/* Title bar */}
            <div className="absolute top-0 left-0 right-0 p-2 flex items-center justify-between z-10 bg-card/60 backdrop-blur-sm border-b border-border/30">
              {renderTitle()}
              <div className="flex gap-1">
                <button onClick={addMindMapNode} className="p-1 rounded-lg hover:bg-secondary transition-colors" title="Add node">
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setConnectingFrom(connectingFrom ? null : '__pick__'); }} className={`p-1 rounded-lg transition-colors ${connectingFrom ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'}`} title={connectingFrom ? 'Cancel connecting' : 'Connect nodes'}>
                  <span className="text-xs font-bold">🔗</span>
                </button>
              </div>
            </div>
            {/* SVG connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {(element.mindmapConnections || []).map(conn => {
                const from = element.mindmapNodes?.find(n => n.id === conn.fromNodeId);
                const to = element.mindmapNodes?.find(n => n.id === conn.toNodeId);
                if (!from || !to) return null;
                return (
                  <line key={conn.id}
                    x1={from.x + from.width / 2} y1={from.y + from.height / 2}
                    x2={to.x + to.width / 2} y2={to.y + to.height / 2}
                    stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" opacity="0.6"
                  />
                );
              })}
            </svg>
            {/* Nodes */}
            {(element.mindmapNodes || []).map(node => (
              <div
                key={node.id}
                className={`absolute rounded-xl px-2 py-1 text-xs font-medium cursor-move flex items-center gap-1 ios-shadow-sm select-none border border-white/20 ${connectingFrom ? 'ring-2 ring-primary/50 cursor-crosshair' : ''}`}
                style={{ left: node.x, top: node.y, width: node.width, backgroundColor: node.color || 'hsl(var(--primary))', color: '#fff', zIndex: 1 }}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
              >
                {node.emoji && <span className="text-sm">{node.emoji}</span>}
                <input
                  className="bg-transparent outline-none text-white text-xs flex-1 min-w-0"
                  value={node.label}
                  onChange={(e) => updateNodeLabel(node.id, e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                />
                <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="opacity-50 hover:opacity-100 text-white shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {connectingFrom === '__pick__' && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-card/80 px-3 py-1 rounded-full backdrop-blur-sm z-10">
                Click a node to start connecting
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Divider toolbar extras
  const renderDividerToolbar = () => {
    if (element.type !== 'divider' || !selected) return null;
    return (
      <>
        <button onClick={(e) => { e.stopPropagation(); onUpdate({ rotation: ((element.rotation || 0) + 15) % 360 }); }} onMouseDown={(e) => e.stopPropagation()} className="p-1 rounded hover:bg-secondary transition-colors" title="Rotate 15°">
          <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <label className="p-1 rounded hover:bg-secondary transition-colors cursor-pointer" title="Color">
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          <input type="color" className="sr-only" onChange={(e) => onUpdate({ dividerColor: e.target.value })} onMouseDown={(e) => e.stopPropagation()} />
        </label>
        <button onClick={(e) => { e.stopPropagation(); onUpdate({ thickness: Math.max(1, (element.thickness || 2) - 1) }); }} onMouseDown={(e) => e.stopPropagation()} className="p-1 rounded hover:bg-secondary transition-colors text-xs text-muted-foreground font-bold" title="Thinner">−</button>
        <button onClick={(e) => { e.stopPropagation(); onUpdate({ thickness: Math.min(20, (element.thickness || 2) + 1) }); }} onMouseDown={(e) => e.stopPropagation()} className="p-1 rounded hover:bg-secondary transition-colors text-xs text-muted-foreground font-bold" title="Thicker">+</button>
      </>
    );
  };

  const renderImageToolbar = () => {
    if (element.type !== 'image' || !selected || !element.imageUrl) return null;
    return (
      <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} onMouseDown={(e) => e.stopPropagation()} className="p-1 rounded hover:bg-secondary transition-colors" title="Replace image">
        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    );
  };

  return (
    <div
      className={`absolute overflow-visible transition-shadow select-none ${
        element.type === 'divider' ? '' : `rounded-xl ${bgClass[element.type] || 'bg-card'}`
      } ${selected ? 'ring-2 ring-primary ios-shadow-lg' : element.type === 'divider' ? '' : 'ios-shadow hover:ios-shadow-lg'}`}
      style={{
        left: element.x, top: element.y,
        width: element.width,
        height: element.type === 'divider' ? Math.max(element.height, 20) : element.height,
        zIndex: element.zIndex,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
      onMouseDown={onMouseDown}
    >
      <div className={`w-full h-full overflow-hidden ${element.type !== 'divider' ? 'rounded-xl' : ''}`}>
        {renderContent()}
      </div>

      {/* Selection toolbar */}
      {selected && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 glass rounded-lg px-1.5 py-1 ios-shadow-sm animate-scale-in">
          {renderDividerToolbar()}
          {renderImageToolbar()}
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} onMouseDown={(e) => e.stopPropagation()} className="p-1 rounded hover:bg-secondary transition-colors" title="Duplicate">
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} onMouseDown={(e) => e.stopPropagation()} className="p-1 rounded hover:bg-destructive/10 transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      )}

      {/* Resize handle */}
      {selected && (
        <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full cursor-nwse-resize border-2 border-card ios-shadow-sm z-10" onMouseDown={(e) => onResizeMouseDown('se', e)} />
      )}
    </div>
  );
};

export default BoardElement;
