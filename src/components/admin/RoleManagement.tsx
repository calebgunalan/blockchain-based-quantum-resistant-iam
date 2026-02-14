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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Shield, Trash2, Users, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface SystemRole {
  role: string;
  permissions: Permission[];
  permission_count: number;
}

interface CustomRole {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  permissions: Permission[];
  user_count: number;
}

export function RoleManagement() {
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', display_name: '', description: '', permissions: [] as string[] });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchSystemRoles(), fetchCustomRoles(), fetchAllPermissions()]);
    setLoading(false);
  };

  const fetchAllPermissions = async () => {
    try {
      const { data, error } = await supabase.from('permissions').select('*').order('resource, action');
      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchSystemRoles = async () => {
    try {
      const { data: rolePerms, error } = await supabase
        .from('role_permissions')
        .select('role, permission_id, permissions ( id, name, resource, action, description )');
      if (error) throw error;

      const grouped: Record<string, SystemRole> = {};
      ['admin', 'moderator', 'user'].forEach(role => {
        grouped[role] = { role, permission_count: 0, permissions: [] };
      });
      rolePerms?.forEach((item: any) => {
        if (!grouped[item.role]) grouped[item.role] = { role: item.role, permission_count: 0, permissions: [] };
        grouped[item.role].permissions.push(item.permissions);
        grouped[item.role].permission_count++;
      });
      setSystemRoles(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching system roles:', error);
    }
  };

  const fetchCustomRoles = async () => {
    try {
      const { data: roles, error } = await supabase
        .from('custom_roles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const enriched: CustomRole[] = [];
      for (const role of roles || []) {
        const [permRes, assignRes] = await Promise.all([
          supabase.from('custom_role_permissions').select('permission_id, permissions ( id, name, resource, action, description )').eq('custom_role_id', role.id),
          supabase.from('custom_role_assignments').select('id', { count: 'exact' }).eq('custom_role_id', role.id),
        ]);
        enriched.push({
          ...role,
          permissions: (permRes.data || []).map((p: any) => p.permissions),
          user_count: assignRes.count || 0,
        });
      }
      setCustomRoles(enriched);
    } catch (error) {
      console.error('Error fetching custom roles:', error);
    }
  };

  const createCustomRole = async () => {
    if (!newRole.name.trim() || !newRole.display_name.trim()) {
      toast.error('Role name and display name are required');
      return;
    }
    const roleName = newRole.name.toLowerCase().replace(/\s+/g, '_');
    if (['admin', 'moderator', 'user'].includes(roleName)) {
      toast.error('Cannot use a system role name for custom roles');
      return;
    }

    try {
      const { data: role, error } = await supabase
        .from('custom_roles')
        .insert({ name: roleName, display_name: newRole.display_name, description: newRole.description || null })
        .select()
        .single();
      if (error) throw error;

      if (newRole.permissions.length > 0) {
        const perms = newRole.permissions.map(pid => ({ custom_role_id: role.id, permission_id: pid }));
        const { error: permError } = await supabase.from('custom_role_permissions').insert(perms);
        if (permError) throw permError;
      }

      toast.success(`Custom role "${newRole.display_name}" created successfully`);
      setIsCreateDialogOpen(false);
      setNewRole({ name: '', display_name: '', description: '', permissions: [] });
      fetchCustomRoles();
    } catch (error: any) {
      console.error('Error creating custom role:', error);
      toast.error('Failed to create role: ' + error.message);
    }
  };

  const deleteCustomRole = async (roleId: string, roleName: string) => {
    try {
      const { error } = await supabase.from('custom_roles').delete().eq('id', roleId);
      if (error) throw error;
      toast.success(`Role "${roleName}" deleted`);
      fetchCustomRoles();
    } catch (error: any) {
      toast.error('Failed to delete role: ' + error.message);
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
      case 'admin': return 'destructive' as const;
      case 'moderator': return 'secondary' as const;
      default: return 'default' as const;
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role-name">Role ID (snake_case)</Label>
                    <Input
                      id="role-name"
                      value={newRole.name}
                      onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                      placeholder="e.g. security_analyst"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-display">Display Name</Label>
                    <Input
                      id="role-display"
                      value={newRole.display_name}
                      onChange={(e) => setNewRole(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="e.g. Security Analyst"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="role-description">Description</Label>
                  <Textarea
                    id="role-description"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this role can do"
                  />
                </div>
                <div>
                  <Label>Permissions ({newRole.permissions.length} selected)</Label>
                  <div className="mt-2 max-h-60 overflow-y-auto border rounded p-4 space-y-1">
                    {permissions.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2 py-1.5">
                        <Checkbox
                          id={`perm-${permission.id}`}
                          checked={newRole.permissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <Label htmlFor={`perm-${permission.id}`} className="flex-1 cursor-pointer">
                          <span className="font-medium">{permission.name}</span>
                          <span className="text-muted-foreground text-xs ml-2">
                            {permission.action} on {permission.resource}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={createCustomRole}>Create Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="system">
          <TabsList className="mb-4">
            <TabsTrigger value="system">
              <Lock className="h-4 w-4 mr-1" />
              System Roles ({systemRoles.length})
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Users className="h-4 w-4 mr-1" />
              Custom Roles ({customRoles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Assigned Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemRoles.map((roleData) => (
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
                          roleData.permissions.slice(0, 3).map((perm) => (
                            <Badge key={perm.id} variant="outline" className="text-xs">{perm.name}</Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No permissions assigned</span>
                        )}
                        {roleData.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{roleData.permissions.length - 3} more</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="custom">
            {customRoles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No custom roles yet. Create one to extend beyond system roles.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div>
                          <Badge variant="outline" className="font-medium">
                            <Users className="h-3 w-3 mr-1" />
                            {role.display_name}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{role.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{role.description || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 2).map((perm) => (
                            <Badge key={perm.id} variant="outline" className="text-xs">{perm.name}</Badge>
                          ))}
                          {role.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{role.permissions.length - 2} more</Badge>
                          )}
                          {role.permissions.length === 0 && <span className="text-muted-foreground text-xs">None</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{role.user_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_active ? 'default' : 'secondary'}>
                          {role.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Custom Role</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete "{role.display_name}"? All user assignments will be removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCustomRole(role.id, role.display_name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
