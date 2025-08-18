import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ChatInterface from "@/components/chat/chat-interface";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MessageSquare } from "lucide-react";

export default function Messages() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/messages/sessions"],
    enabled: isAuthenticated,
    retry: false,
  });

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const formatLastActivity = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header 
          title="Messages" 
          subtitle="View conversation history"
        />
        
        <main className="p-6">
          <div className="grid grid-cols-1 gap-6 h-full">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Message History</h3>
                    <div className="flex items-center space-x-2">
                      <Select value={selectedSession || "all"} onValueChange={(value) => setSelectedSession(value === "all" ? null : value)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="All Sessions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sessions</SelectItem>
                          {Array.isArray(sessions) ? sessions.map((session: any) => (
                            <SelectItem key={session.sessionId} value={session.sessionId}>
                              {session.sessionId}
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Session Selector */}
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {sessionsLoading ? (
                        <div className="col-span-3 text-center py-4 text-slate-500">Loading sessions...</div>
                      ) : Array.isArray(sessions) && sessions.length > 0 ? (
                        sessions.map((session: any) => (
                          <div 
                            key={session.sessionId}
                            className={`cursor-pointer border rounded-lg p-4 transition-colors ${
                              selectedSession === session.sessionId 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-slate-200 hover:border-blue-300'
                            }`}
                            onClick={() => setSelectedSession(session.sessionId)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{session.sessionId}</p>
                                <p className="text-sm text-slate-500">{session.messageCount} messages</p>
                                <p className="text-xs text-slate-400">{formatLastActivity(session.lastActivity)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-8 text-slate-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                          <p>No conversation sessions found</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Chat Interface */}
                  {selectedSession ? (
                    <ChatInterface sessionId={selectedSession} />
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Session</h3>
                      <p className="text-slate-500">Choose a session above to view the conversation history</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
