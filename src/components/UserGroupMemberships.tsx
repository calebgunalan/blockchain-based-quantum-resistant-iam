import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface GroupMembership {
  group_id: string;
  group_name: string;
  group_description: string | null;
  joined_at: string;
}

export function UserGroupMemberships() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  const fetchUserGroups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_group_memberships')
        .select(`
          group_id,
          assigned_at,
          user_groups (
            name,
            description
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedGroups = (data || []).map(item => ({
        group_id: item.group_id,
        group_name: (item.user_groups as any)?.name || 'Unknown Group',
        group_description: (item.user_groups as any)?.description || null,
        joined_at: item.assigned_at
      }));

      setGroups(formattedGroups);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      toast.error('Failed to load group memberships');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading groups...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Groups
        </CardTitle>
        <CardDescription>Your group memberships and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            You are not a member of any groups yet.
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.group_id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{group.group_name}</h4>
                  {group.group_description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.group_description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Joined: {new Date(group.joined_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">Member</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
