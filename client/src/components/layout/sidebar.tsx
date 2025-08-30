import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageCircle, 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut 
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-40">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900">AI Chatbot</h1>
            <p className="text-sm text-slate-500">Admin Panel</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start flex items-center space-x-3 px-3 py-2 rounded-lg",
                      isActive 
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-50" 
                        : "text-slate-700 hover:bg-slate-50"
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
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
        <Button 
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start flex items-center space-x-3 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
