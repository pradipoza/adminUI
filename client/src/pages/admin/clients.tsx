import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Calendar } from "lucide-react";

export default function AdminClients() {
  const { data: clients, isLoading } = useQuery({
    queryKey: ["/api/admin/clients"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />
      <div className="ml-64 min-h-screen">
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Client Management</h1>
          <p className="text-slate-400">View and manage all registered clients</p>
        </header>
        
        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients && clients.length > 0 ? (
              clients.map((client: any) => (
                <Card key={client.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {client.firstName || ''} {client.lastName || 'Unnamed Client'}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">
                        Joined: {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No clients registered yet</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
