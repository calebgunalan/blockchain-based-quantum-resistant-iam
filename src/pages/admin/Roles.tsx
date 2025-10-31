import { RoleManagement } from '@/components/admin/RoleManagement';
import { AdminGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Roles() {
  const navigate = useNavigate();

  return (
    <AdminGate>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Role Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage system roles, create custom roles, and assign permissions to roles.
          </p>
        </div>

        <RoleManagement />
      </div>
    </AdminGate>
  );
}