import { useState, useRef } from 'react';
import {
  ImageIcon, CheckSquare,
  Trash2, Copy, Plus, RotateCw, Palette,
} from 'lucide-react';
import { BoardElement as BoardElementType, TodoItem } from '@/types/board';

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
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdate({ imageUrl: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const bgClass: Record<string, string> = {
    note: 'element-note', todo: 'element-todo', textbox: 'element-text',
    checklist: 'element-checklist', image: 'element-image',
  };

  // Render title bar for note/todo/textbox/checklist
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
      <h3
        className="text-sm font-semibold text-foreground truncate cursor-text"
        onDoubleClick={handleTitleDoubleClick}
      >
        {element.title}
      </h3>
    );
  };

  // Render inner content based on element type
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
              <img
                src={element.imageUrl}
                alt={element.title || 'Image'}
                className="w-full h-full object-cover rounded-lg"
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground">Click to add image</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        );
      case 'divider':
        return (
          <div className="w-full h-full flex items-center justify-center px-1">
            <div
              className="w-full rounded-full"
              style={{
                height: element.thickness || 2,
                backgroundColor: element.dividerColor || 'hsl(var(--border))',
              }}
            />
          </div>
        );
      case 'icon':
        return (
          <div className="w-full h-full flex items-center justify-center text-4xl select-none">
            {element.emoji || '📚'}
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
        {/* Rotate button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ rotation: ((element.rotation || 0) + 15) % 360 });
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1 rounded hover:bg-secondary transition-colors"
          title="Rotate 15°"
        >
          <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {/* Color picker for divider */}
        <label className="p-1 rounded hover:bg-secondary transition-colors cursor-pointer" title="Color">
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="color"
            className="sr-only"
            onChange={(e) => {
              const hex = e.target.value;
              onUpdate({ dividerColor: hex });
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </label>
        {/* Thickness controls */}
        <button
          onClick={(e) => { e.stopPropagation(); onUpdate({ thickness: Math.max(1, (element.thickness || 2) - 1) }); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1 rounded hover:bg-secondary transition-colors text-xs text-muted-foreground font-bold"
          title="Thinner"
        >−</button>
        <button
          onClick={(e) => { e.stopPropagation(); onUpdate({ thickness: Math.min(20, (element.thickness || 2) + 1) }); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1 rounded hover:bg-secondary transition-colors text-xs text-muted-foreground font-bold"
          title="Thicker"
        >+</button>
      </>
    );
  };

  // Image replace button
  const renderImageToolbar = () => {
    if (element.type !== 'image' || !selected || !element.imageUrl) return null;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
        onMouseDown={(e) => e.stopPropagation()}
        className="p-1 rounded hover:bg-secondary transition-colors"
        title="Replace image"
      >
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
        left: element.x,
        top: element.y,
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
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-secondary transition-colors"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-destructive/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      )}

      {/* Resize handle */}
      {selected && (
        <div
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full cursor-nwse-resize border-2 border-card ios-shadow-sm z-10"
          onMouseDown={(e) => onResizeMouseDown('se', e)}
        />
      )}
    </div>
  );
};

export default BoardElement;
