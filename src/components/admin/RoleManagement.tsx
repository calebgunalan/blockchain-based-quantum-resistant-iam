import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Shield, Settings, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface Role {
  role: string;
  permissions: Permission[];
  permission_count: number;
}

interface NewRole {
  name: string;
  description: string;
  permissions: string[];
}

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<NewRole>({
    name: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    fetchRolePermissions();
    fetchAllPermissions();
  }, []);

  const fetchAllPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource, action');

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to fetch permissions');
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const { data: rolePerms, error: roleError } = await supabase
        .from('role_permissions')
        .select(`
          role,
          permission_id,
          permissions (
            id,
            name,
            resource,
            action,
            description
          )
        `);

      if (roleError) throw roleError;

      // Group by role
      const grouped = rolePerms?.reduce((acc: any, item: any) => {
        const role = item.role;
        if (!acc[role]) {
          acc[role] = {
            role,
            permission_count: 0,
            permissions: []
          };
        }
        acc[role].permissions.push(item.permissions);
        acc[role].permission_count++;
        return acc;
      }, {});

      // Add default roles without permissions
      const allRoles = ['admin', 'moderator', 'user'];
      allRoles.forEach(role => {
        if (!grouped[role]) {
          grouped[role] = {
            role,
            permission_count: 0,
            permissions: []
          };
        }
      });

      setRoles(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast.error('Failed to fetch role permissions');
    } finally {
      setLoading(false);
    }
  };

  const createCustomRole = async () => {
    if (!newRole.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    // Validate role name - only system roles are supported
    const roleName = newRole.name.toLowerCase().replace(/\s+/g, '_');
    const validRoles = ['admin', 'moderator', 'user'];
    
    if (!validRoles.includes(roleName)) {
      toast.error(
        `Invalid role name "${newRole.name}". Only system roles are supported: Admin, Moderator, or User. ` +
        `This is because roles are stored as a database enum for security. ` +
        `To assign permissions to a role, select one of the existing system roles.`
      );
      return;
    }

    try {
      // Insert role permissions
      if (newRole.permissions.length > 0) {
        const rolePermissions = newRole.permissions.map(permissionId => ({
          role: roleName as 'admin' | 'moderator' | 'user',
          permission_id: permissionId
        }));

        const { error } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (error) throw error;
      }

      toast.success('Role permissions assigned successfully');
      setIsCreateDialogOpen(false);
      setNewRole({ name: '', description: '', permissions: [] });
      fetchRolePermissions();
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error('Failed to assign permissions: ' + error.message);
    }
  };

  const deleteRole = async (role: string) => {
    if (['admin', 'moderator', 'user'].includes(role)) {
      toast.error('Cannot delete system roles');
      return;
    }

    try {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role as 'admin' | 'moderator' | 'user');

      if (error) throw error;

      toast.success('Role deleted successfully');
      fetchRolePermissions();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  const togglePermission = (permissionId: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Role Management</span>
            </CardTitle>
            <CardDescription>
              Manage system roles and create custom roles with specific permissions
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Custom Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role-name">Role Name</Label>
                  <Input
                    id="role-name"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter role name"
                  />
                </div>
                <div>
                  <Label htmlFor="role-description">Description</Label>
                  <Textarea
                    id="role-description"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter role description"
                  />
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="mt-2 max-h-60 overflow-y-auto border rounded p-4">
                    {permissions.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id={permission.id}
                          checked={newRole.permissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <Label htmlFor={permission.id} className="flex-1 cursor-pointer">
                          <div className="font-medium">{permission.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {permission.action} on {permission.resource}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createCustomRole}>
                  Create Role
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Permissions Count</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((roleData) => (
              <TableRow key={roleData.role}>
                <TableCell>
                  <Badge variant={getRoleColor(roleData.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {roleData.role}
                  </Badge>
                </TableCell>
                <TableCell>{roleData.permission_count}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {roleData.permissions.length > 0 ? (
                      roleData.permissions.slice(0, 3).map((perm: Permission) => (
                        <Badge key={perm.id} variant="outline" className="text-xs">
                          {perm.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">No permissions assigned</span>
                    )}
                    {roleData.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{roleData.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {!['admin', 'moderator', 'user'].includes(roleData.role) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Role</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the role "{roleData.role}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRole(roleData.role)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}