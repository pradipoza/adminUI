import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, X } from "lucide-react";

interface ChatInterfaceProps {
  sessionId: string;
}

interface Message {
  id: number;
  message: {
    type: string;
    content: string;
    timestamp: string;
  };
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [showChat, setShowChat] = useState(true);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/messages", sessionId],
    queryFn: async () => {
      const url = new URL('/api/messages', window.location.origin);
      url.searchParams.set('session_id', sessionId);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!sessionId,
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!showChat) {
    return null;
  }

  return (
    <div className="border border-slate-200 rounded-lg h-96 flex flex-col">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{sessionId}</p>
              <p className="text-sm text-slate-500">WhatsApp Session</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowChat(false)} 
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4 bg-slate-50">
        {isLoading ? (
          <div className="text-center text-slate-500 py-8">Loading messages...</div>
        ) : Array.isArray(messages) && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((msg: Message) => {
              const isUser = msg.message.type === 'user';
              
              return (
                <div key={msg.id} className={`flex ${isUser ? '' : 'justify-end'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                    isUser 
                      ? 'bg-white border border-slate-200' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    <p className="text-sm">{msg.message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isUser ? 'text-slate-500' : 'text-blue-200'
                    }`}>
                      {msg.message.timestamp ? formatTime(msg.message.timestamp) : 'Just now'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">
            No messages in this session yet.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
