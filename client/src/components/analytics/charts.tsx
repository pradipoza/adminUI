import { Card, CardContent } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface AnalyticsChartsProps {
  data: {
    dailyMessages: Array<{ date: string; count: number }>;
  };
  loading: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function AnalyticsCharts({ data, loading }: AnalyticsChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Message Volume</h3>
            <div className="h-64 flex items-center justify-center text-slate-500">
              Loading chart...
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Response Time Distribution</h3>
            <div className="h-64 flex items-center justify-center text-slate-500">
              Loading chart...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform daily messages data for charts
  const chartData = data?.dailyMessages?.map((item) => ({
    day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    messages: item.count,
  })) || [];

  // Mock response time data (in a real app, this would come from the API)
  const responseTimeData = [
    { name: '< 1s', value: 45, count: 450 },
    { name: '1-2s', value: 35, count: 350 },
    { name: '2-3s', value: 15, count: 150 },
    { name: '> 3s', value: 5, count: 50 },
  ];

  // Generate monthly data for bar chart
  const monthlyData = [
    { month: 'Jan', messages: 850 },
    { month: 'Feb', messages: 920 },
    { month: 'Mar', messages: 780 },
    { month: 'Apr', messages: 1100 },
    { month: 'May', messages: 1250 },
    { month: 'Jun', messages: 1400 },
    { month: 'Jul', messages: 1200 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Message Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartData.length > 0 ? (
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
              ) : (
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Bar dataKey="messages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Response Time Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={responseTimeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {responseTimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {responseTimeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-slate-600">{entry.name}: {entry.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
