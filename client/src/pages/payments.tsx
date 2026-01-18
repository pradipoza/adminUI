import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, QrCode, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function ClientPayments() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: paymentData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/client/payments"],
    enabled: isAuthenticated,
  });

  const { data: qrData } = useQuery({
    queryKey: ["/api/client/payment-qr"],
    enabled: isAuthenticated,
  });

  if (isLoading || paymentsLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const { payments = [], totalDue = 0, amountPaid = 0, balance = 0 } = paymentData || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header 
          title="Payments" 
          subtitle="View your payment status and make payments"
        />
        
        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Total Due</h3>
                  <IndianRupee className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">₹{totalDue.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Amount Paid</h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-600">₹{amountPaid.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Balance Due</h3>
                  {balance > 0 ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <p className={`text-3xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{balance.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#075E54]" />
                  Make Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {qrData?.qrCode ? (
                  <div className="text-center">
                    <img 
                      src={qrData.qrCode} 
                      alt="Payment QR Code" 
                      className="mx-auto max-w-[300px] bg-white p-4 rounded-lg shadow-md"
                    />
                    <p className="mt-4 text-slate-600">
                      Scan this QR code to make a payment. Rate: <strong>₹1.50 per AI message</strong>
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      After payment, your admin will update your payment status.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <QrCode className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Payment QR code not available yet.</p>
                    <p className="text-sm text-slate-400">Please contact your administrator.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment: any) => (
                      <div 
                        key={payment.id} 
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{payment.month} {payment.year}</p>
                          <p className="text-sm text-slate-500">
                            {payment.aiMessageCount} AI messages
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">₹{parseFloat(payment.totalDue).toLocaleString()}</p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                            payment.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {payment.status === 'paid' ? 'Paid' : 
                             payment.status === 'partial' ? `Partial (₹${parseFloat(payment.amountPaid).toLocaleString()})` : 
                             'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No payment records yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
