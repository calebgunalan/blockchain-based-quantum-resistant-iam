import { Link, useLocation } from 'react-router-dom';
import { FileText, ListTodo, LogOut, Users, Shield, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AdminGate, ModeratorGate } from './PermissionGate';

export function ResourcesNavigation() {
  const location = useLocation();
  const { signOut, userRole } = useAuth();

  const getLinkClassName = (path: string) => {
    const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
    return `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`;
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-6">
        <div className="mr-8 flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Resource Access</span>
          {userRole && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {userRole}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-6 flex-1">
          <Link to="/resources" className={getLinkClassName("/resources")}>
            <FileText className="h-5 w-5" />
            Documents & Tasks
          </Link>
          
          {/* Admin-specific resource controls intentionally minimal and resource-focused */}
          {/* IAM controls are not shown in Resource Access */}


          <ModeratorGate>
            <Link to="/resources/moderator/users" className={getLinkClassName("/resources/moderator/users")}>
              <Users className="h-5 w-5" />
              View Users
            </Link>
          </ModeratorGate>
        </nav>

        <nav className="flex items-center gap-4">
          <Link to="/settings" className={getLinkClassName("/settings")}>
            <SettingsIcon className="h-5 w-5" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </nav>
      </div>
    </div>
  );
}
