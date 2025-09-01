import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import ChatInterface from "@/components/chat/chat-interface";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, MessageSquare } from "lucide-react";

export default function Messages() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [activeAccount, setActiveAccount] = useState<'account1' | 'account2'>('account1');

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

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: [activeAccount === 'account1' ? "/api/messages/sessions" : "/api/messages1/sessions"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Reset selected contact when account changes
  useEffect(() => {
    setSelectedContact(null);
  }, [activeAccount]);

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
    <div className="min-h-screen bg-white flex">
      <Sidebar />
      
      {/* Main Content Area - No gaps with sidebar/navbar */}
      <div className="flex-1 ml-64 flex h-screen">
        
        {/* Contacts Panel - Left Side (Narrow) */}
        <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
          
          {/* Header with Account Tabs */}
          <div className="bg-white border-b border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-slate-300 text-slate-600">
                    {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || "A"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            
            {/* WhatsApp Account Tabs */}
            <div className="flex space-x-1">
              <Button
                variant={activeAccount === 'account1' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveAccount('account1')}
                data-testid="button-whatsapp-account1"
                className="flex-1"
              >
                WhatsApp Account 1
              </Button>
              <Button
                variant={activeAccount === 'account2' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveAccount('account2')}
                data-testid="button-whatsapp-account2"
                className="flex-1"
              >
                WhatsApp Account 2
              </Button>
            </div>
          </div>
          
          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {contactsLoading ? (
              <div className="p-4 text-center text-slate-500">Loading contacts...</div>
            ) : Array.isArray(contacts) && contacts.length > 0 ? (
              <div>
                {contacts.map((contact: any) => (
                  <div
                    key={contact.sessionId}
                    className={`cursor-pointer p-4 border-b border-slate-200 hover:bg-slate-100 transition-colors ${
                      selectedContact === contact.sessionId ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
                    }`}
                    onClick={() => setSelectedContact(contact.sessionId)}
                    data-testid={`contact-${contact.sessionId}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900 truncate" data-testid={`contact-name-${contact.sessionId}`}>
                            {contact.sessionId}
                          </p>
                          <span className="text-xs text-slate-400">
                            {formatLastActivity(contact.lastActivity)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 truncate">
                          {contact.messageCount} messages
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium mb-1">No contacts found</p>
                <p className="text-sm">Messages will appear here when customers start chatting</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Chat Area - Right Side (Wide) */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-slate-50 border-b border-slate-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900" data-testid={`chat-header-${selectedContact}`}>
                      {selectedContact}
                    </h3>
                    <p className="text-sm text-slate-500">WhatsApp Contact</p>
                  </div>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-hidden">
                <ChatInterface sessionId={selectedContact} account={activeAccount} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-medium text-slate-900 mb-2">Select a Contact</h3>
                <p className="text-slate-500">Choose a contact from the left to start viewing the conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}