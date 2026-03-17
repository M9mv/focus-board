import { useState, useRef, useCallback, memo } from 'react';
import {
  ImageIcon, Trash2, Copy, Plus, RotateCw, Palette, Smile, Mic, Square, Play, Pause,
} from 'lucide-react';
import { BoardElement as BoardElementType, TodoItem, MindMapNode, MindMapConnection } from '@/types/board';

// Common emoji categories for quick picking
// 50 popular emojis in a flat list
const EMOJI_LIST = [
  '😀','😂','😍','🥰','😎','🤔','😴','🥳','🤩','😇',
  '❤️','🔥','⭐','💡','🎯','✅','💪','🧠','🏆','🎉',
  '👍','👋','🙏','✌️','🤝','👏','🫶','💎','🪄','🚀',
  '🐱','🐶','🦊','🐼','🦁','🦋','🌸','🍀','☀️','🌈',
  '📚','🎨','🎵','🎮','⚽','📷','💻','☕','🍕','🎁',
];

interface BoardElementProps {
  element: BoardElementType;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onUpdate: (updates: Partial<BoardElementType>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onResizeMouseDown: (corner: string, e: React.MouseEvent) => void;
  onResizeTouchStart?: (corner: string, e: React.TouchEvent) => void;
  isRTL?: boolean;
  t?: (key: string) => string;
}

const BoardElement = memo(({ element, selected, onMouseDown, onTouchStart, onUpdate, onDelete, onDuplicate, onResizeMouseDown, onResizeTouchStart, isRTL, t }: BoardElementProps) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customEmojiUnused] = useState(''); // kept for type compat
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice note state
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Mind map state
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
    const newTodo: TodoItem = { id: crypto.randomUUID(), text: t?.('newTask') || 'New task', completed: false };
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
    setCustomEmoji('');
    setShowEmojiPicker(false);
  };

  const selectCustomEmoji = () => {
    const value = customEmoji.trim();
    if (!value) return;
    const firstEmoji = Array.from(value)[0];
    if (!firstEmoji) return;
    onUpdate({ emoji: firstEmoji });
    setCustomEmoji('');
    setShowEmojiPicker(false);
  };

  // ===== Voice Note helpers =====
  const startRecording = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          onUpdate({ audioUrl: reader.result as string });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch { /* mic permission denied */ }
  }, [onUpdate]);

  const stopRecording = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const togglePlayback = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!element.audioUrl) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    const audio = new Audio(element.audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  }, [element.audioUrl, isPlaying]);

  // ===== Mind Map helpers =====
  const addMindMapNode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const nodes = element.mindmapNodes || [];
    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      x: 50 + Math.random() * 300,
      y: 60 + Math.random() * 250,
      width: 110, height: 38,
      label: t?.('newNode') || 'New Node',
      color: `hsl(${Math.floor(Math.random() * 360)},70%,60%)`,
    };
    onUpdate({ mindmapNodes: [...nodes, newNode] });
  }, [element.mindmapNodes, onUpdate, t]);

  const handleNodePointerDown = useCallback((nodeId: string, clientX: number, clientY: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    // Connection mode
    if (connectingFrom === '__pick__') {
      setConnectingFrom(nodeId);
      return;
    }
    if (connectingFrom && connectingFrom !== '__pick__') {
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

    // Drag node
    const node = element.mindmapNodes?.find(n => n.id === nodeId);
    if (!node) return;
    const startX = clientX;
    const startY = clientY;
    const nodeX = node.x;
    const nodeY = node.y;

    const handleMove = (mx: number, my: number) => {
      const dx = mx - startX;
      const dy = my - startY;
      const updated = (element.mindmapNodes || []).map(n =>
        n.id === nodeId ? { ...n, x: nodeX + dx, y: nodeY + dy } : n
      );
      onUpdate({ mindmapNodes: updated });
    };

    const handleMouseMove = (ev: MouseEvent) => handleMove(ev.clientX, ev.clientY);
    const handleTouchMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const touch = ev.touches[0];
      if (touch) handleMove(touch.clientX, touch.clientY);
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchend', handleUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchend', handleUp);
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
    voice: 'bg-card',
  };

  const renderTitle = () => {
    if (!element.title && element.title !== '') return null;
    return editingTitle ? (
      <input
        ref={titleRef}
        className="text-sm font-semibold bg-transparent outline-none border-b border-primary/30 text-foreground w-full"
        defaultValue={element.title}
        onBlur={handleTitleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        autoFocus
      />
    ) : (
      <h3 className="text-sm font-semibold text-foreground truncate cursor-text" onDoubleClick={handleTitleDoubleClick}>
        {element.title}
      </h3>
    );
  };

  const stopProp = (e: React.MouseEvent | React.TouchEvent) => e.stopPropagation();
  const isMindMapConnectMode = element.type === 'mindmap' && Boolean(connectingFrom);

  const renderContent = () => {
    switch (element.type) {
      case 'note':
        return (
          <div className="p-3 h-full flex flex-col">
            {renderTitle()}
            <textarea
              className="flex-1 bg-transparent text-sm resize-none outline-none text-foreground/80 mt-2 placeholder:text-muted-foreground"
              placeholder={t?.('writeNote') || 'Write your note...'}
              value={element.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              onMouseDown={stopProp}
              onTouchStart={stopProp}
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
                    onMouseDown={stopProp}
                    onTouchStart={stopProp}
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
                    onMouseDown={stopProp}
                    onTouchStart={stopProp}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); addTodo(); }}
              onMouseDown={stopProp}
              onTouchStart={stopProp}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2"
            >
              <Plus className="w-3 h-3" /> {t?.('addItem') || 'Add item'}
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
              onMouseDown={stopProp}
              onTouchStart={stopProp}
            />
          </div>
        );
      case 'image':
        return (
          <div className="p-3 h-full flex flex-col items-center justify-center">
            {element.imageUrl ? (
              <img src={element.imageUrl} alt={element.title || 'Image'} className="w-full h-full object-cover rounded-lg" onMouseDown={stopProp} />
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                onMouseDown={stopProp}
                onTouchStart={stopProp}
              >
                <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground">{t?.('clickToAddImage') || 'Click to add image'}</span>
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
          <div
            className="w-full h-full flex items-center justify-center select-none relative cursor-pointer"
            style={{ fontSize: Math.min(element.width, element.height) * 0.6 }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker(!showEmojiPicker);
            }}
          >
            {element.emoji ? (
              <span className="transition-transform hover:scale-110 leading-none">{element.emoji}</span>
            ) : (
              <Smile className="w-8 h-8 text-muted-foreground/30" />
            )}

            {showEmojiPicker && (
              <div
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-[200] bg-card border border-border rounded-2xl ios-shadow-lg p-3 w-72 animate-scale-in"
                onMouseDown={stopProp}
                onTouchStart={stopProp}
                onClick={stopProp}
              >
                <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
                  {EMOJI_LIST.map(em => (
                    <button key={em} onClick={(e) => { e.stopPropagation(); selectEmoji(em); }} onMouseDown={stopProp} onTouchStart={stopProp}
                      className="w-6 h-6 flex items-center justify-center text-lg hover:bg-secondary rounded-lg transition-colors active:scale-90">
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'mindmap':
        return (
          <div className="w-full h-full relative overflow-hidden">
            {/* Title bar - draggable area for the whole element */}
            <div className={`absolute top-0 left-0 right-0 p-2 flex items-center justify-between z-10 bg-card/60 backdrop-blur-sm border-b border-border/30 ${isMindMapConnectMode ? 'cursor-default' : 'cursor-move'}`}>
              {renderTitle()}
              <div className="flex gap-1">
                <button onClick={addMindMapNode} className="p-1 rounded-lg hover:bg-secondary transition-colors" title={t?.('newNode') || 'Add node'}>
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConnectingFrom(connectingFrom ? null : '__pick__'); }}
                  className={`p-1 rounded-lg transition-colors ${connectingFrom ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'}`}
                  title={connectingFrom ? (t?.('cancelConnecting') || 'Cancel') : (t?.('connectNodes') || 'Connect nodes')}
                >
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
                const x1 = from.x + from.width / 2;
                const y1 = from.y + from.height / 2;
                const x2 = to.x + to.width / 2;
                const y2 = to.y + to.height / 2;
                // Bezier curve for smooth connections
                const mx = (x1 + x2) / 2;
                return (
                  <path key={conn.id}
                    d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" opacity="0.6"
                  />
                );
              })}
            </svg>
            {/* Nodes */}
            {(element.mindmapNodes || []).map(node => (
              <div
                key={node.id}
                className={`absolute rounded-xl px-2 py-1 text-xs font-medium cursor-move flex items-center gap-1 ios-shadow-sm select-none border border-white/20 transition-shadow ${connectingFrom ? 'ring-2 ring-primary/50 cursor-crosshair' : 'hover:ios-shadow-lg'}`}
                style={{ left: node.x, top: node.y, width: node.width, backgroundColor: node.color || 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', zIndex: 1, touchAction: 'none' }}
                onMouseDown={(e) => handleNodePointerDown(node.id, e.clientX, e.clientY, e)}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (touch) handleNodePointerDown(node.id, touch.clientX, touch.clientY, e);
                }}
              >
                {node.emoji && <span className="text-sm">{node.emoji}</span>}
                <input
                  className="bg-transparent outline-none text-primary-foreground text-xs flex-1 min-w-0"
                  value={node.label}
                  readOnly={isMindMapConnectMode}
                  onChange={(e) => updateNodeLabel(node.id, e.target.value)}
                  onMouseDown={isMindMapConnectMode ? undefined : stopProp}
                  onTouchStart={isMindMapConnectMode ? undefined : stopProp}
                />
                {!isMindMapConnectMode && (
                  <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="opacity-50 hover:opacity-100 text-primary-foreground shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {connectingFrom === '__pick__' && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-card/80 px-3 py-1 rounded-full backdrop-blur-sm z-10">
                {connectingFrom === '__pick__'
                  ? (t?.('clickNodeToConnect') || 'Click a node to start connecting')
                  : (t?.('clickNodeToConnect') || 'Click a node to start connecting')}
              </div>
            )}
          </div>
        );
      case 'voice':
        return (
          <div className="p-3 h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20 rounded-xl">
            {element.audioUrl ? (
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={togglePlayback}
                  onMouseDown={stopProp}
                  onTouchStart={stopProp}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 active:scale-95 transition-transform"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-foreground">🎙️ {t?.('voiceNote') || 'Voice Note'}</div>
                  <div className="w-full h-1.5 rounded-full bg-secondary mt-1">
                    <div className={`h-full rounded-full bg-primary transition-all ${isPlaying ? 'animate-pulse w-full' : 'w-0'}`} />
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdate({ audioUrl: undefined }); }}
                  onMouseDown={stopProp}
                  onTouchStart={stopProp}
                  className="p-1 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            ) : (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                onMouseDown={stopProp}
                onTouchStart={stopProp}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  isRecording
                    ? 'bg-destructive text-destructive-foreground animate-pulse'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-6 h-6" />}
              </button>
            )}
            <span className="text-[10px] text-muted-foreground">
              {isRecording ? (t?.('recording') || 'Recording...') : (!element.audioUrl ? (t?.('tapToRecord') || 'Tap to record') : '')}
            </span>
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
        <button onClick={(e) => { e.stopPropagation(); onUpdate({ rotation: ((element.rotation || 0) + 15) % 360 }); }} onMouseDown={stopProp} className="p-1 rounded hover:bg-secondary transition-colors" title={t?.('rotate') || 'Rotate 15°'}>
          <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <label className="p-1 rounded hover:bg-secondary transition-colors cursor-pointer" title={t?.('color') || 'Color'}>
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          <input type="color" className="sr-only" onChange={(e) => onUpdate({ dividerColor: e.target.value })} onMouseDown={stopProp} />
        </label>
        <button onClick={(e) => { e.stopPropagation(); onUpdate({ thickness: Math.max(1, (element.thickness || 2) - 1) }); }} onMouseDown={stopProp} className="p-1 rounded hover:bg-secondary transition-colors text-xs text-muted-foreground font-bold" title={t?.('thinner') || 'Thinner'}>−</button>
        <button onClick={(e) => { e.stopPropagation(); onUpdate({ thickness: Math.min(20, (element.thickness || 2) + 1) }); }} onMouseDown={stopProp} className="p-1 rounded hover:bg-secondary transition-colors text-xs text-muted-foreground font-bold" title={t?.('thicker') || 'Thicker'}>+</button>
      </>
    );
  };

  const renderImageToolbar = () => {
    if (element.type !== 'image' || !selected || !element.imageUrl) return null;
    return (
      <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} onMouseDown={stopProp} className="p-1 rounded hover:bg-secondary transition-colors" title={t?.('replaceImage') || 'Replace image'}>
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
        touchAction: 'none',
      }}
      onMouseDown={(e) => {
        if (isMindMapConnectMode) {
          e.stopPropagation();
          return;
        }
        onMouseDown(e);
      }}
      onTouchStart={(e) => {
        if (isMindMapConnectMode) {
          e.stopPropagation();
          return;
        }
        onTouchStart?.(e);
      }}
    >
      <div className={`w-full h-full overflow-hidden ${element.type !== 'divider' ? 'rounded-xl' : ''}`}>
        {renderContent()}
      </div>

      {/* Selection toolbar */}
      {selected && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 glass rounded-lg px-1.5 py-1 ios-shadow-sm animate-scale-in z-[100]">
          {renderDividerToolbar()}
          {renderImageToolbar()}
          {element.type === 'icon' && (
            <button onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }} onMouseDown={stopProp} onTouchStart={stopProp} className="p-1 rounded hover:bg-secondary transition-colors" title={t?.('changeEmoji') || 'Change Emoji'}>
              <Smile className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} onMouseDown={stopProp} className="p-1 rounded hover:bg-secondary transition-colors" title={t?.('duplicate') || 'Duplicate'}>
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} onMouseDown={stopProp} className="p-1 rounded hover:bg-destructive/10 transition-colors" title={t?.('delete') || 'Delete'}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      )}

      {/* Resize handle */}
      {selected && (
        <div
          className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full cursor-nwse-resize border-2 border-card ios-shadow-sm z-10"
          onMouseDown={(e) => onResizeMouseDown('se', e)}
          onTouchStart={(e) => onResizeTouchStart?.('se', e)}
        />
      )}
    </div>
  );
});

BoardElement.displayName = 'BoardElement';

export default BoardElement;
