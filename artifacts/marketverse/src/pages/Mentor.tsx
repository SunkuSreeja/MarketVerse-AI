import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListGeminiConversations,
  useCreateGeminiConversation,
  useListGeminiMessages,
} from "@workspace/api-client-react";
import { MessageSquare, Send, Plus, Loader2, BrainCircuit, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface StreamMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

const STARTER_PROMPTS = [
  "What is a stop-loss and why should I use one?",
  "Should I invest during a market recession?",
  "Explain Sensex vs Nifty for a beginner",
  "How do I control panic-selling behavior?",
  "What is the 50-20-30 rule for investing?",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary/50"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg, isLast }: { msg: StreamMessage; isLast: boolean }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={isUser
          ? { background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }
          : { background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)' }
        }
      >
        {isUser
          ? <User className="w-4 h-4 text-primary" />
          : <BrainCircuit className="w-4 h-4 text-accent" />
        }
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm text-foreground'
            : 'rounded-tl-sm text-foreground/90'
        }`}
        style={isUser
          ? { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }
          : { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }
        }
      >
        {msg.isStreaming && !msg.content ? (
          <TypingIndicator />
        ) : (
          <div className="whitespace-pre-wrap">
            {msg.content}
            {msg.isStreaming && isLast && (
              <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Mentor() {
  const { data: conversations, isLoading: loadingConvs, refetch: refetchConvs } = useListGeminiConversations();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const { data: messages, isLoading: loadingMsgs } = useListGeminiMessages(
    activeConvId!,
    { query: { enabled: activeConvId !== null } }
  );
  const createConv = useCreateGeminiConversation();
  const [streamMessages, setStreamMessages] = useState<StreamMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messages) {
      setStreamMessages(messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content ?? '' })));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamMessages]);

  const handleNewConversation = async () => {
    const result = await new Promise<number>((resolve) => {
      createConv.mutate({ data: { title: 'Market Consultation' } }, {
        onSuccess: (conv) => resolve(conv.id),
      });
    });
    setActiveConvId(result);
    setStreamMessages([]);
    refetchConvs();
  };

  const handleSend = async (text = input) => {
    if (!text.trim() || isSending) return;
    const msg = text.trim();
    setInput('');

    let convId = activeConvId;
    if (!convId) {
      await new Promise<void>(resolve => {
        createConv.mutate({ data: { title: msg.slice(0, 50) } }, {
          onSuccess: (conv) => {
            convId = conv.id;
            setActiveConvId(conv.id);
            refetchConvs();
            resolve();
          },
        });
      });
    }

    if (!convId) return;

    const userMsg: StreamMessage = { role: 'user', content: msg };
    const aiMsg: StreamMessage = { role: 'assistant', content: '', isStreaming: true };
    setStreamMessages(prev => [...prev, userMsg, aiMsg]);
    setIsSending(true);

    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      const res = await fetch(`${base}/api/ai/mentor/${convId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });

      if (!res.body) throw new Error('No stream body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                content += parsed.token;
                setStreamMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content, isStreaming: true };
                  }
                  return updated;
                });
              }
            } catch { }
          }
        }
      }

      setStreamMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          updated[updated.length - 1] = { ...last, content, isStreaming: false };
        }
        return updated;
      });
    } catch {
      setStreamMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          updated[updated.length - 1] = { ...last, content: 'Something went wrong. Please try again.', isStreaming: false };
        }
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex gap-5 pb-4">
      {/* Sidebar — Conversations */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3">
        <Button
          onClick={handleNewConversation}
          disabled={createConv.isPending}
          className="scanning-button w-full font-orbitron text-xs tracking-widest h-10 border border-primary/40 text-primary hover:bg-primary hover:text-black transition-all"
          style={{ background: 'rgba(0,212,255,0.06)' }}
        >
          <Plus className="w-4 h-4 mr-2" /> NEW CONSULTATION
        </Button>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {loadingConvs ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
          ) : conversations?.length === 0 ? (
            <div className="text-center py-6">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No sessions yet</p>
            </div>
          ) : (
            conversations?.map(conv => (
              <button
                key={conv.id}
                onClick={() => { setActiveConvId(conv.id); setStreamMessages([]); }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  activeConvId === conv.id
                    ? 'border-primary/40 bg-primary/6 shadow-[0_0_10px_rgba(0,212,255,0.08)]'
                    : 'border-border/30 hover:border-border/60 hover:bg-white/3'
                }`}
              >
                <p className="font-orbitron text-xs font-semibold truncate" style={{ color: activeConvId === conv.id ? '#00d4ff' : undefined }}>
                  {conv.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(conv.createdAt).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.2)]">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-orbitron font-bold text-lg text-foreground">AI Mentor</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_6px_rgba(0,255,136,0.8)]" />
              <p className="text-[10px] font-orbitron text-accent uppercase tracking-widest">Gemini 2.5 Flash · Active</p>
            </div>
          </div>
        </div>

        <Card className="flex-1 flex flex-col bg-card/40 border-border overflow-hidden min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {!activeConvId && streamMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <BrainCircuit className="w-10 h-10 text-primary" />
                  </div>
                  <motion.div className="absolute inset-0 rounded-full border border-primary/30" animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }} />
                </div>
                <div>
                  <h2 className="font-orbitron font-bold text-xl mb-2">What can I help you learn?</h2>
                  <p className="text-sm text-muted-foreground max-w-md">Your AI mentor is powered by Gemini 2.5 Flash. Ask anything about stocks, psychology, risk management, or investing strategy.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="text-left px-4 py-3 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 text-sm text-muted-foreground hover:text-foreground transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : loadingMsgs && activeConvId ? (
              <div className="space-y-5">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                    <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? 'w-1/2' : 'w-3/4'}`} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {streamMessages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} isLast={i === streamMessages.length - 1} />
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border/40 p-4">
            <div className="flex gap-3 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about stocks, psychology, risk, strategy..."
                className="flex-1 min-h-[48px] max-h-[140px] resize-none bg-background/60 border-border/50 focus-visible:border-primary/50 focus-visible:ring-primary/20 text-sm font-light"
                rows={1}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isSending}
                className="h-12 w-12 p-0 flex-shrink-0 bg-primary/15 border border-primary/40 text-primary hover:bg-primary hover:text-black transition-all"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center font-orbitron tracking-widest">ENTER to send · SHIFT+ENTER for new line · For education only</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
