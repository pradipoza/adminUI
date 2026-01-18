import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, GraduationCap, IndianRupee, Clock } from "lucide-react";

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/admin/clients"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const stats = analytics || {
    totalClients: 0,
    totalMessages: 0,
    totalStudents: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />
      <div className="ml-64 min-h-screen">
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
          <p className="text-slate-400">Overview of all clients and system metrics</p>
        </header>
        
        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-400">Total Clients</h3>
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalClients}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-400">Total Messages</h3>
                  <MessageSquare className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalMessages.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-400">Total Students</h3>
                  <GraduationCap className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalStudents}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-400">Total Revenue</h3>
                  <IndianRupee className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-3xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-400">Pending Payments</h3>
                  <Clock className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-3xl font-bold text-white">₹{stats.pendingPayments.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Client List</CardTitle>
            </CardHeader>
            <CardContent>
              {clients && clients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Name</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client: any) => (
                        <tr key={client.id} className="border-b border-slate-700/50">
                          <td className="py-3 px-4 text-white">
                            {client.firstName || ''} {client.lastName || ''}
                          </td>
                          <td className="py-3 px-4 text-slate-300">{client.email}</td>
                          <td className="py-3 px-4 text-slate-400">
                            {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No clients registered yet</p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
