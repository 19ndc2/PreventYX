import { useState, useRef, useEffect } from "react";
import { useSendChatMessage } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  role: 'user' | 'agent';
  content: string;
};

export default function AIChat() {
  const sessionId = getSessionId();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'agent',
      content: "Hello! I'm your CancerGuard AI Advisor. I can answer questions about screening guidelines, help interpret risk factors, or provide information on lifestyle prevention. How can I assist you today?"
    }
  ]);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  const chatMutation = useSendChatMessage();

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    chatMutation.mutate({
      data: { sessionId, message: userMsg.content }
    }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'agent',
          content: data.response
        }]);
      },
      onError: () => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'agent',
          content: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later."
        }]);
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] bg-card border border-border/50 rounded-3xl overflow-hidden shadow-lg shadow-black/5 relative">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-border/50 p-4 flex items-center gap-4 z-10">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg leading-tight">AI Prevention Advisor</h2>
          <p className="text-xs text-muted-foreground">Powered by Flowise • Always active</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                msg.role === 'agent' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
              }`}>
                {msg.role === 'agent' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'agent' 
                  ? 'bg-white border border-border/50 text-foreground shadow-sm rounded-tl-none' 
                  : 'bg-primary text-white rounded-tr-none'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {chatMutation.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full shrink-0 bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="p-4 bg-white border border-border/50 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Analyzing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endOfMessagesRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-border/50">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about symptoms, screening guidelines..."
            className="flex-1 pl-4 pr-14 py-4 rounded-2xl border-2 border-border/50 bg-slate-50 focus:outline-none focus:border-primary focus:bg-white transition-colors"
            disabled={chatMutation.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-2 top-2 h-10 w-10 rounded-xl"
            disabled={!input.trim() || chatMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-wider font-semibold">
          AI generated • For informational purposes only
        </p>
      </div>
    </div>
  );
}
