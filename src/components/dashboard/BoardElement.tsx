import { useState, useRef } from 'react';
import {
  StickyNote, ListTodo, Type, ImageIcon, CheckSquare,
  Minus, FileText, Trash2, Copy, Plus,
} from 'lucide-react';
import { BoardElement as BoardElementType, TodoItem } from '@/types/board';

interface BoardElementProps {
  element: BoardElementType;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onUpdate: (updates: Partial<BoardElementType>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const BoardElement = ({ element, selected, onMouseDown, onUpdate, onDelete, onDuplicate }: BoardElementProps) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

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
    onUpdate({
      todos: element.todos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t),
    });
  };

  const addTodo = () => {
    const newTodo: TodoItem = { id: crypto.randomUUID(), text: 'New task', completed: false };
    onUpdate({ todos: [...(element.todos || []), newTodo] });
  };

  const updateTodoText = (todoId: string, text: string) => {
    if (!element.todos) return;
    onUpdate({
      todos: element.todos.map(t => t.id === todoId ? { ...t, text } : t),
    });
  };

  // Background class based on element type
  const bgClass: Record<string, string> = {
    note: 'element-note', todo: 'element-todo', textbox: 'element-text',
    checklist: 'element-checklist', file: 'element-file', image: 'element-image',
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
            <ImageIcon className="w-12 h-12 text-muted-foreground/40 mb-2" />
            <span className="text-xs text-muted-foreground">{element.title || 'Image Card'}</span>
          </div>
        );

      case 'divider':
        return (
          <div className="w-full h-full flex items-center px-2">
            <div className="w-full h-[2px] bg-border rounded-full" />
          </div>
        );

      case 'icon':
        return (
          <div className="w-full h-full flex items-center justify-center text-4xl select-none">
            {element.emoji || '📚'}
          </div>
        );

      case 'file':
        return (
          <div className="p-3 h-full flex flex-col items-center justify-center gap-2">
            <FileText className="w-10 h-10 text-muted-foreground/60" />
            <span className="text-xs text-center text-foreground font-medium truncate w-full">
              {element.fileName || 'File'}
            </span>
          </div>
        );

      default:
        return null;
    }
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
      <h3
        className="text-sm font-semibold text-foreground truncate cursor-text"
        onDoubleClick={handleTitleDoubleClick}
      >
        {element.title}
      </h3>
    );
  };

  return (
    <div
      className={`absolute rounded-xl overflow-hidden transition-shadow select-none ${
        bgClass[element.type] || 'bg-card'
      } ${selected ? 'ring-2 ring-primary ios-shadow-lg' : 'ios-shadow hover:ios-shadow-lg'}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
      }}
      onMouseDown={onMouseDown}
    >
      {renderContent()}

      {/* Selection toolbar */}
      {selected && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 glass rounded-lg px-1.5 py-1 ios-shadow-sm animate-scale-in">
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
    </div>
  );
};

export default BoardElement;
