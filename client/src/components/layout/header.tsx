import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              type="search" 
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={(user as any)?.profileImageUrl || ""} alt="User avatar" />
              <AvatarFallback className="bg-slate-300 text-slate-600">
                {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || "A"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-slate-700">
              {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim() : (user as any)?.email || "Admin User"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
