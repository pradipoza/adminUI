import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import ChatInterface from "@/components/chat/chat-interface";
import { Button } from "@/components/ui/button";
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
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          
          {/* Header with Account Tabs */}
          <div className="bg-[#075E54] border-b border-[#064e45] p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">Messages</h2>
            </div>
            
            {/* WhatsApp Account Tabs */}
            <div className="flex space-x-1">
              <Button
                variant={activeAccount === 'account1' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveAccount('account1')}
                data-testid="button-whatsapp-account1"
                className={`flex-1 text-xs ${activeAccount === 'account1' ? 'bg-white text-[#075E54] hover:bg-white' : 'text-white hover:bg-[#064e45]'}`}
              >
                Account 1
              </Button>
              <Button
                variant={activeAccount === 'account2' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveAccount('account2')}
                data-testid="button-whatsapp-account2"
                className={`flex-1 text-xs ${activeAccount === 'account2' ? 'bg-white text-[#075E54] hover:bg-white' : 'text-white hover:bg-[#064e45]'}`}
              >
                Account 2
              </Button>
            </div>
          </div>
          
          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {contactsLoading ? (
              <div className="p-4 text-center text-gray-500">Loading contacts...</div>
            ) : Array.isArray(contacts) && contacts.length > 0 ? (
              <div>
                {contacts.map((contact: any) => (
                  <div
                    key={contact.sessionId}
                    className={`cursor-pointer p-4 border-b border-gray-200 hover:bg-gray-100 transition-colors ${
                      selectedContact === contact.sessionId ? 'bg-[#f0fdf4] border-r-4 border-r-[#075E54]' : ''
                    }`}
                    onClick={() => setSelectedContact(contact.sessionId)}
                    data-testid={`contact-${contact.sessionId}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[#e6f7f1] rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-[#075E54]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate" data-testid={`contact-name-${contact.sessionId}`}>
                            {contact.sessionId}
                          </p>
                          <span className="text-xs text-gray-400">
                            {formatLastActivity(contact.lastActivity)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {contact.messageCount} messages
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
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
              <div className="bg-[#e6f7f1] border-b border-[#075E54] p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#075E54] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900" data-testid={`chat-header-${selectedContact}`}>
                      {selectedContact}
                    </h3>
                    <p className="text-sm text-[#075E54]">WhatsApp Contact</p>
                  </div>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-hidden">
                <ChatInterface sessionId={selectedContact} account={activeAccount} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#f0fdf4]">
              <div className="text-center">
                <div className="w-20 h-20 bg-[#e6f7f1] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-[#075E54]" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Contact</h3>
                <p className="text-[#075E54]">Choose a contact from the left to start viewing the conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}