import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, Plus, Edit, IndianRupee, QrCode } from "lucide-react";

export default function AdminPayments() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["/api/admin/payments"],
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/admin/clients"],
  });

  const { data: qrSetting } = useQuery({
    queryKey: ["/api/admin/settings", "payment_qr_code"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings/payment_qr_code");
      return res.json();
    },
  });

  const [newPayment, setNewPayment] = useState({
    clientId: "",
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    aiMessageCount: 0,
    ratePerMessage: "1.50",
    totalDue: "0",
    amountPaid: "0",
    status: "pending",
    notes: "",
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/payments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      setIsCreateOpen(false);
      toast({ title: "Payment record created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create payment record", variant: "destructive" });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/payments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      setEditingPayment(null);
      toast({ title: "Payment updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update payment", variant: "destructive" });
    },
  });

  const uploadQRMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("qrImage", file);
      const res = await fetch("/api/admin/upload-qr", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setQrFile(null);
      toast({ title: "QR code uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to upload QR code", variant: "destructive" });
    },
  });

  const handleQRUpload = () => {
    if (qrFile) {
      uploadQRMutation.mutate(qrFile);
    }
  };

  const handleCreatePayment = () => {
    const totalDue = parseFloat(newPayment.ratePerMessage) * newPayment.aiMessageCount;
    createPaymentMutation.mutate({
      ...newPayment,
      totalDue: totalDue.toFixed(2),
    });
  };

  const handleUpdatePayment = (payment: any, updates: any) => {
    updatePaymentMutation.mutate({ id: payment.id, data: updates });
  };

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
          <h1 className="text-2xl font-bold text-white">Payment Management</h1>
          <p className="text-slate-400">Manage client payments and upload payment QR code</p>
        </header>
        
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Payment QR Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    {qrSetting?.value ? (
                      <img 
                        src={qrSetting.value} 
                        alt="Payment QR" 
                        className="w-48 h-48 object-contain bg-white rounded-lg p-2"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-slate-700 rounded-lg flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <p className="text-slate-300">
                      Upload your payment QR code that will be shown to clients on their payment page.
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Button 
                        onClick={handleQRUpload}
                        disabled={!qrFile || uploadQRMutation.isPending}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadQRMutation.isPending ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-amber-400" />
                  Rate: ₹1.50 per AI message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm">
                  Each AI response costs ₹1.50. Create payment records for clients based on their AI message usage.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Payment Records</CardTitle>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-500 hover:bg-amber-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create Payment Record</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Client</Label>
                      <Select 
                        value={newPayment.clientId} 
                        onValueChange={(v) => setNewPayment({ ...newPayment, clientId: v })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients?.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.firstName} {c.lastName} ({c.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Month</Label>
                        <Input
                          value={newPayment.month}
                          onChange={(e) => setNewPayment({ ...newPayment, month: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Year</Label>
                        <Input
                          type="number"
                          value={newPayment.year}
                          onChange={(e) => setNewPayment({ ...newPayment, year: parseInt(e.target.value) })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-300">AI Message Count</Label>
                      <Input
                        type="number"
                        value={newPayment.aiMessageCount}
                        onChange={(e) => setNewPayment({ ...newPayment, aiMessageCount: parseInt(e.target.value) || 0 })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">
                        Total Due: ₹{(parseFloat(newPayment.ratePerMessage) * newPayment.aiMessageCount).toFixed(2)}
                      </Label>
                    </div>
                    <div>
                      <Label className="text-slate-300">Notes</Label>
                      <Input
                        value={newPayment.notes}
                        onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Optional notes..."
                      />
                    </div>
                    <Button 
                      onClick={handleCreatePayment}
                      disabled={!newPayment.clientId || createPaymentMutation.isPending}
                      className="w-full bg-amber-500 hover:bg-amber-600"
                    >
                      {createPaymentMutation.isPending ? "Creating..." : "Create Payment Record"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Client</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Period</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">AI Messages</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Total Due</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Paid</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment: any) => {
                        const client = clients?.find((c: any) => c.id === payment.clientId);
                        return (
                          <tr key={payment.id} className="border-b border-slate-700/50">
                            <td className="py-3 px-4 text-white">
                              {client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email : 'Unknown'}
                            </td>
                            <td className="py-3 px-4 text-slate-300">{payment.month} {payment.year}</td>
                            <td className="py-3 px-4 text-slate-300">{payment.aiMessageCount}</td>
                            <td className="py-3 px-4 text-amber-400">₹{parseFloat(payment.totalDue).toLocaleString()}</td>
                            <td className="py-3 px-4 text-green-400">₹{parseFloat(payment.amountPaid).toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                payment.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                                payment.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-800 border-slate-700">
                                  <DialogHeader>
                                    <DialogTitle className="text-white">Update Payment</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-slate-300">Amount Paid (₹)</Label>
                                      <Input
                                        type="number"
                                        defaultValue={payment.amountPaid}
                                        id={`paid-${payment.id}`}
                                        className="bg-slate-700 border-slate-600 text-white"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-slate-300">Status</Label>
                                      <Select 
                                        defaultValue={payment.status}
                                        onValueChange={(v) => {
                                          const paidInput = document.getElementById(`paid-${payment.id}`) as HTMLInputElement;
                                          handleUpdatePayment(payment, {
                                            amountPaid: paidInput?.value || payment.amountPaid,
                                            status: v
                                          });
                                        }}
                                      >
                                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="partial">Partial</SelectItem>
                                          <SelectItem value="paid">Paid</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No payment records yet</p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
