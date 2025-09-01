import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatInterfaceProps {
  sessionId: string;
  account?: 'account1' | 'account2';
}

interface Message {
  id: number;
  message: {
    type: string;
    content: string;
    timestamp: string;
  };
}

export default function ChatInterface({ sessionId, account = 'account1' }: ChatInterfaceProps) {

  const endpoint = account === 'account1' ? '/api/messages' : '/api/messages1';
  
  const { data: messages, isLoading } = useQuery({
    queryKey: [endpoint, sessionId, account],
    queryFn: async () => {
      const url = new URL(endpoint, window.location.origin);
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

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-green-50 to-green-100" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d1fae5' fill-opacity='0.4'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}>
        {isLoading ? (
          <div className="text-center text-slate-500 py-8">Loading messages...</div>
        ) : Array.isArray(messages) && messages.length > 0 ? (
          <div className="space-y-2">
            {messages.map((msg: Message) => {
              const isHuman = msg.message.type === 'human';
              const isAI = msg.message.type === 'ai';
              
              return (
                <div key={msg.id} className={`flex ${isAI ? 'justify-end' : 'justify-start'} mb-3`}>
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-md relative ${
                    isHuman 
                      ? 'bg-white text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg rounded-bl-sm border border-gray-200' // Human messages on left - white bubble with tail effect
                      : 'bg-green-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg rounded-br-sm' // AI messages on right - green bubble with tail effect
                  }`}>
                    {/* Message sender label */}
                    <p className={`text-xs font-medium mb-1 ${
                      isHuman ? 'text-blue-600' : 'text-green-100'
                    }`}>
                      {isHuman ? 'Student' : 'AI Assistant'}
                    </p>
                    <p className="text-sm leading-relaxed">{msg.message.content}</p>
                    <div className={`flex justify-end mt-1`}>
                      <p className={`text-xs ${
                        isHuman ? 'text-gray-500' : 'text-green-100'
                      }`}>
                        {msg.message.timestamp ? formatTime(msg.message.timestamp) : 'Just now'}
                      </p>
                    </div>
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
