import { Monitor, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskbarProps {
  user: UserType;
  openWindows: { id: string; title: string }[];
  onWindowClick: (id: string) => void;
}

export function Taskbar({ user, openWindows, onWindowClick }: TaskbarProps) {
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (e) {
      // Ignore errors
    }
    window.location.href = "/";
  };

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "Utilisateur";
  };

  const currentTime = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="h-10 bg-sidebar border-t border-sidebar-border flex items-center justify-between px-2 gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 px-2">
          <Monitor className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium hidden sm:inline">EduLinux</span>
        </div>
        <div className="h-6 w-px bg-border" />
        {openWindows.map((window) => (
          <Button
            key={window.id}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onWindowClick(window.id)}
            data-testid={`taskbar-window-${window.id}`}
          >
            {window.title}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        <span className="text-xs text-muted-foreground hidden sm:inline">{currentTime}</span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 px-2" data-testid="button-user-menu">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
              </Avatar>
              <span className="text-xs hidden md:inline">{getDisplayName()}</span>
              {user.classe && (
                <Badge variant="secondary" className="text-xs h-5">
                  {user.classe}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{getDisplayName()}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {user.role === "teacher" && (
                <Badge className="mt-1">Professeur</Badge>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
