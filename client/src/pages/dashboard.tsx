import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Users, FileText, Zap, TrendingUp, ArrowUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: documents } = useQuery({
    queryKey: ["/api/documents"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: sessions } = useQuery({
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

  const statsData = analytics || {
    totalMessages: 0,
    weeklyMessages: 0,
    activeSessions: 0,
    dailyMessages: []
  };

  const documentsCount = Array.isArray(documents) ? documents.length : 0;
  const activeSessionsCount = Array.isArray(sessions) ? sessions.length : 0;

  const chartData = Array.isArray(statsData.dailyMessages) ? statsData.dailyMessages.map((item: any) => ({
    day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    messages: item.count
  })) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header 
          title="Overview" 
          subtitle="Monitor your AI chatbot performance"
        />
        
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Messages</p>
                    <p className="text-2xl font-bold text-slate-900">{statsData.totalMessages.toLocaleString()}</p>
                    <p className="text-sm text-emerald-600 flex items-center mt-2">
                      <ArrowUp className="w-4 h-4 mr-1" />
                      +12% from last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Active Sessions</p>
                    <p className="text-2xl font-bold text-slate-900">{activeSessionsCount}</p>
                    <p className="text-sm text-emerald-600 flex items-center mt-2">
                      <ArrowUp className="w-4 h-4 mr-1" />
                      +8% from last week
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Documents</p>
                    <p className="text-2xl font-bold text-slate-900">{documentsCount}</p>
                    <p className="text-sm text-slate-500">Knowledge base files</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Response Time</p>
                    <p className="text-2xl font-bold text-slate-900">1.2s</p>
                    <p className="text-sm text-emerald-600">-0.3s improvement</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Message Volume</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Line 
                        type="monotone" 
                        dataKey="messages" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Active Sessions</h3>
                <div className="space-y-4">
                  {Array.isArray(sessions) && sessions.length > 0 ? (
                    sessions.slice(0, 3).map((session: any, index: number) => (
                      <div key={session.sessionId} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-slate-600">+{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{session.sessionId}</p>
                            <p className="text-sm text-slate-500">
                              {new Date(session.lastActivity).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-600">{session.messageCount} msgs</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-center py-4">No active sessions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 py-3 border-b border-slate-100 last:border-b-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">System started successfully</p>
                    <p className="text-sm text-slate-500">Just now</p>
                  </div>
                </div>
                {Array.isArray(documents) && documents.length > 0 && (
                  <div className="flex items-center space-x-4 py-3 border-b border-slate-100 last:border-b-0">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Knowledge base contains {documentsCount} documents</p>
                      <p className="text-sm text-slate-500">Ready for queries</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
