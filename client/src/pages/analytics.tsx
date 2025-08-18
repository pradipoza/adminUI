import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AnalyticsCharts from "@/components/analytics/charts";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Clock, Users, CheckCircle, ArrowUp, ArrowDown } from "lucide-react";

export default function Analytics() {
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

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics"],
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
    monthlyMessages: 0,
    activeSessions: 0,
    dailyMessages: [] as Array<{ date: string; count: number }>
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header 
          title="Analytics" 
          subtitle="Performance metrics and insights"
        />
        
        <main className="p-6">
          {/* Time Range Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Analytics Dashboard</h2>
                <p className="text-slate-500">Monitor chatbot performance and usage metrics</p>
              </div>
              <div className="flex items-center space-x-2">
                <Select defaultValue="7days">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Total Messages</h3>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{statsData.totalMessages.toLocaleString()}</p>
                <p className="text-sm text-emerald-600 flex items-center mt-2">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  +12% from last period
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Avg Response Time</h3>
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">1.2s</p>
                <p className="text-sm text-emerald-600 flex items-center mt-2">
                  <ArrowDown className="w-4 h-4 mr-1" />
                  -0.3s improvement
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Active Sessions</h3>
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{statsData.activeSessions}</p>
                <p className="text-sm text-emerald-600 flex items-center mt-2">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  +8% from last week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Success Rate</h3>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">94.2%</p>
                <p className="text-sm text-emerald-600 flex items-center mt-2">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  +2.1% improvement
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <AnalyticsCharts data={statsData} loading={analyticsLoading} />

          {/* Usage Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Peak Hours</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">9:00 AM - 10:00 AM</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-900">847</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">2:00 PM - 3:00 PM</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "72%" }}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-900">724</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">6:00 PM - 7:00 PM</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "68%" }}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-900">681</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Common Topics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Order Status</span>
                    <span className="text-sm font-medium text-slate-900">34%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Product Information</span>
                    <span className="text-sm font-medium text-slate-900">28%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Technical Support</span>
                    <span className="text-sm font-medium text-slate-900">19%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Billing Questions</span>
                    <span className="text-sm font-medium text-slate-900">12%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Other</span>
                    <span className="text-sm font-medium text-slate-900">7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Session Duration</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-900">4.2m</p>
                    <p className="text-sm text-slate-500">Average Duration</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">&lt; 1 minute</span>
                      <span className="font-medium">12%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">1-5 minutes</span>
                      <span className="font-medium">58%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">5-10 minutes</span>
                      <span className="font-medium">24%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">&gt; 10 minutes</span>
                      <span className="font-medium">6%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
