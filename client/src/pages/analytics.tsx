import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Users, MessageSquare, Clock, Calendar, BarChart } from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

const COLORS = ['#075E54', '#25D366', '#34D058', '#128C7E'];

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [timeRange, setTimeRange] = useState<string>('7days');

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

  const { data: analytics, isLoading: analyticsLoading, refetch } = useQuery({
    queryKey: ["/api/analytics", timeRange],
    queryFn: async () => {
      const url = new URL('/api/analytics', window.location.origin);
      url.searchParams.set('range', timeRange);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

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
    totalStudents: 0,
    dailyMessages: [] as Array<{ date: string; count: number }>,
    weeklyActivity: [] as Array<{ day: string; messages: number }>
  };

  // Transform daily messages data for charts
  const chartData = statsData.dailyMessages?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    messages: item.count,
  })) || [];

  // Since AI responds to every student message, roughly half are AI responses
  const studentMessages = Math.floor(statsData.totalMessages / 2);
  const aiMessages = statsData.totalMessages - studentMessages;

  // Use real weekly activity data from the API
  const weeklyActivityData = statsData.weeklyActivity || [];

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
                <p className="text-slate-500">Combined metrics from both WhatsApp accounts</p>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1day">Last 1 day</SelectItem>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="6months">Last 6 months</SelectItem>
                    <SelectItem value="1year">Last 1 year</SelectItem>
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
                  <MessageSquare className="w-4 h-4 text-[#075E54]" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{statsData.totalMessages.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-2">
                  AI Messages: {Math.floor(statsData.totalMessages / 2).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Active Students</h3>
                  <Users className="w-4 h-4 text-[#25D366]" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{statsData.activeSessions}</p>
                <p className="text-sm text-slate-500 mt-2">
                  Students with recent activity
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Total Students</h3>
                  <Users className="w-4 h-4 text-[#128C7E]" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{statsData.totalStudents}</p>
                <p className="text-sm text-slate-500 mt-2">
                  All registered students
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Weekly Messages</h3>
                  <TrendingUp className="w-4 h-4 text-[#34D058]" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{statsData.weeklyMessages.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-2">
                  Messages in last 7 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Message Volume Over Time</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartData.length > 0 ? (
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#64748b" 
                          fontSize={12}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12}
                          domain={['dataMin', 'dataMax']}
                          tickCount={5}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="messages" 
                          stroke="#075E54" 
                          fill="#075E54"
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        No data available for selected period
                      </div>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Activity and Student Engagement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Activity Pattern</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={weeklyActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Bar dataKey="messages" fill="#075E54" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Student Engagement</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#f0fdf4] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-[#075E54]" />
                      <div>
                        <p className="font-medium text-slate-900">Daily Active Students</p>
                        <p className="text-sm text-slate-500">Average students per day</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#075E54]">{Math.floor(statsData.activeSessions / 7)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BarChart className="w-5 h-5 text-[#25D366]" />
                      <div>
                        <p className="font-medium text-slate-900">Messages per Student</p>
                        <p className="text-sm text-slate-500">Average in selected period</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#25D366]">
                        {statsData.activeSessions > 0 ? Math.floor(statsData.totalMessages / statsData.activeSessions) : 0}
                      </p>
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