import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useListGeminiConversations, 
  useCreateGeminiConversation, 
  useListGeminiMessages,
  GeminiMessage
} from "@workspace/api-client-react";
import { MessageSquare, Send, Plus, Loader2, Bot, User, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Mentor() {
  const { data: conversations, refetch: refetchConvos, isLoading: loadingConvos } = useListGeminiConversations();
  const createConvo = useCreateGeminiConversation();
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messagesData, isLoading: loadingMsgs, refetch: refetchMsgs } = useListGeminiMessages(
    activeId!,
    { query: { enabled: !!activeId } }
  );

  // Auto-select first convo if none selected
  useEffect(() => {
    if (conversations?.length && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesData, streamingMessage]);

  const handleNewConvo = () => {
    createConvo.mutate({ data: { title: "New Consultation" } }, {
      onSuccess: (res) => {
        refetchConvos();
        setActiveId(res.id);
      }
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeId || isStreaming) return;

    const userText = input;
    setInput("");
    
    // Optimistically update UI (you would typically use react-query cache here, but for simplicity we rely on refetch after stream)
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const res = await fetch(`/api/gemini/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userText })
      });

      if (!res.body) throw new Error("No response body");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                break;
              }
              if (data.content) {
                setStreamingMessage(prev => prev + data.content);
              }
            } catch (e) {
              console.error("Error parsing SSE data", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsStreaming(false);
      refetchMsgs();
      setStreamingMessage("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div>
        <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
          <MessageSquare className="text-primary w-8 h-8" />
          AI Mentor Link
        </h1>
        <p className="text-muted-foreground mt-2 font-light">Secure channel to advanced market intelligence.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Sidebar: Conversations */}
        <Card className="bg-card/40 border-border lg:col-span-1 flex flex-col overflow-hidden backdrop-blur-md">
          <CardHeader className="p-4 border-b border-border/50">
            <Button 
              onClick={handleNewConvo} 
              disabled={createConvo.isPending}
              variant="outline" 
              className="w-full border-primary/30 text-primary hover:bg-primary/10 font-orbitron text-xs"
            >
              {createConvo.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              NEW LINK
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
            {loadingConvos ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : conversations?.map(c => (
              <div 
                key={c.id} 
                onClick={() => setActiveId(c.id)}
                className={`p-4 border-b border-border/20 cursor-pointer transition-colors ${activeId === c.id ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-secondary/20'}`}
              >
                <p className={`text-sm font-medium truncate ${activeId === c.id ? 'text-primary' : 'text-foreground'}`}>{c.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="bg-card/60 border-border lg:col-span-3 flex flex-col overflow-hidden backdrop-blur-md relative">
          {!activeId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <Bot className="w-16 h-16 mb-4" />
              <p className="font-orbitron tracking-widest">ESTABLISH CONNECTION</p>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingMsgs ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-2/3 ml-auto" />
                    <Skeleton className="h-32 w-2/3" />
                  </div>
                ) : (
                  <>
                    <AnimatePresence initial={false}>
                      {messagesData?.map((msg) => (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex max-w-[80%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${msg.role === 'user' ? 'bg-secondary border-secondary/50' : 'bg-primary/20 border-primary shadow-[0_0_10px_rgba(0,212,255,0.2)]'}`}>
                              {msg.role === 'user' ? <User className="w-4 h-4 text-muted-foreground" /> : <Bot className="w-4 h-4 text-primary" />}
                            </div>
                            <div className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-secondary/50 text-foreground border border-border/50' : 'bg-primary/5 border border-primary/20 text-primary-foreground leading-relaxed'}`}>
                              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Streaming Message Placeholder */}
                    {isStreaming && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="flex max-w-[80%] gap-4 flex-row">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border bg-primary/20 border-primary shadow-[0_0_10px_rgba(0,212,255,0.2)] relative overflow-hidden">
                            <Bot className="w-4 h-4 text-primary relative z-10" />
                            <div className="absolute inset-0 bg-primary/30 animate-ping" />
                          </div>
                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-primary-foreground leading-relaxed">
                            <p className="whitespace-pre-wrap text-sm">{streamingMessage}<span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" /></p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-md">
                <form onSubmit={handleSend} className="relative flex items-center">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Query the mentor..."
                    disabled={isStreaming}
                    className="pr-12 bg-card/50 border-primary/20 focus-visible:ring-primary/50 h-12"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!input.trim() || isStreaming}
                    className="absolute right-1 w-10 h-10 bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {isStreaming ? <Activity className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
