import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Shield, 
  BarChart3, 
  CreditCard, 
  LogOut,
  Users
} from "lucide-react";

const navigation = [
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Clients", href: "/admin/clients", icon: Users },
];

export default function AdminSidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 z-40">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Super Admin</h1>
            <p className="text-sm text-slate-400">Control Panel</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start flex items-center space-x-3 px-3 py-2 rounded-lg",
                      isActive 
                        ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/20" 
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <Button 
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start flex items-center space-x-3 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
