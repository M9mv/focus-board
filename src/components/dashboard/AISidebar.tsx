import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Sparkles, Loader2, Trash2, Wand2 } from 'lucide-react';
import { BoardElement } from '@/types/board';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AISidebarProps {
  open: boolean;
  onClose: () => void;
  elements: BoardElement[];
  onAddElement?: (type: 'note' | 'todo' | 'mindmap', data?: any) => void;
  onUpdateElement?: (id: string, updates: Partial<BoardElement>) => void;
  onDeleteElement?: (id: string) => void;
  onArrangeBoard?: () => void;
  isRTL?: boolean;
  t?: (key: string) => string;
}

const AISidebar = ({ open, onClose, elements, onAddElement, isRTL, t }: AISidebarProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const _ = (key: string) => t?.(key) || key;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const getBoardContext = useCallback(() => {
    if (!elements.length) return '';
    const parts: string[] = [];
    elements.forEach(el => {
      if (el.type === 'note' && el.content) parts.push(`ملاحظة: ${el.title || ''} - ${el.content}`);
      if ((el.type === 'todo' || el.type === 'checklist') && el.todos?.length) {
        const items = el.todos.map(t => `${t.completed ? '✅' : '⬜'} ${t.text}`).join(', ');
        parts.push(`مهام (${el.title || ''}): ${items}`);
      }
      if (el.type === 'textbox' && el.content) parts.push(`نص: ${el.content}`);
      if (el.type === 'mindmap' && el.mindmapNodes?.length) {
        const nodes = el.mindmapNodes.map(n => n.label).join(', ');
        parts.push(`خريطة ذهنية (${el.title || ''}): ${nodes}`);
      }
    });
    return parts.join('\n');
  }, [elements]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const boardContext = getBoardContext();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          boardContext,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const upsert = (chunk: string) => {
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { id: crypto.randomUUID(), role: 'assistant', content: assistantContent }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: `❌ ${e.message || 'حدث خطأ. حاول مرة أخرى.'}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  if (!open) return null;

  return (
    <div className={`fixed top-12 ${isRTL ? 'left-0' : 'right-0'} bottom-0 w-80 max-w-full z-[90] flex flex-col bg-card border-l border-border shadow-2xl animate-slide-in-right`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{_('aiAssistant')}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title={_('clearChat')}>
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Wand2 className="w-10 h-10 text-primary/30 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">{_('aiWelcome')}</p>
            <p className="text-xs text-muted-foreground">{_('aiWelcomeDesc')}</p>
            {/* Quick suggestions */}
            <div className="mt-4 space-y-2 w-full">
              {[_('aiSuggest1'), _('aiSuggest2'), _('aiSuggest3')].map((s, i) => (
                <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="w-full text-xs text-start px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-secondary text-foreground rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-secondary px-3 py-2 rounded-xl rounded-bl-sm">
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={_('aiPlaceholder')}
            rows={1}
            className="flex-1 bg-secondary rounded-xl px-3 py-2 text-sm text-foreground resize-none outline-none placeholder:text-muted-foreground max-h-24"
            style={{ minHeight: '36px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISidebar;
