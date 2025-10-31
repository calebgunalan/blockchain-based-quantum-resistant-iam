import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Plus, CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { useTasks, type NewTask } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useUserGroups } from '@/hooks/useUserGroups';

export function TaskManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; email: string; full_name: string }>>([]);
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium'
  });
  
  const { tasks, loading, createTask, updateTask, deleteTask, getMyTasks, getAssignedTasks, getTodaysTasks, getDueTasks } = useTasks();
  const { user, userRole } = useAuth();
  const { groups } = useUserGroups();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('user_profiles_with_roles')
      .select('user_id, email, full_name')
      .neq('role', 'admin');
    
    if (data) {
      setUsers(data.map(u => ({ id: u.user_id!, email: u.email!, full_name: u.full_name || 'Unknown' })));
    }
  };

  const handleCreateTask = async () => {
    try {
      // Handle special assignments
      if (newTask.assigned_to === 'all_users') {
        // Assign to all non-admin users
        for (const u of users) {
          await createTask({ ...newTask, assigned_to: u.id });
        }
      } else if (newTask.assigned_to.startsWith('group_')) {
        // Assign to group members
        const groupId = newTask.assigned_to.replace('group_', '');
        const { data: members } = await supabase
          .from('user_group_memberships')
          .select('user_id')
          .eq('group_id', groupId);
        
        for (const member of members || []) {
          await createTask({ ...newTask, assigned_to: member.user_id });
        }
      } else {
        await createTask(newTask);
      }
      
      setNewTask({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium'
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateProgress = async (taskId: string, progress: number, status?: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      await updateTask(taskId, { progress, ...(status && { status }) });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const myTasks = getMyTasks();
  const assignedTasks = getAssignedTasks();
  const todaysTasks = getTodaysTasks();
  const dueTasks = getDueTasks();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Management</h2>
        {(userRole === 'admin' || userRole === 'moderator') && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assign To</Label>
                  <Select 
                    value={newTask.assigned_to} 
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, assigned_to: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user or group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Users</SelectItem>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={`group_${group.id}`}>
                          Group: {group.name}
                        </SelectItem>
                      ))}
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={newTask.priority} 
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                      setNewTask(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date (Optional)</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask}>
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue={userRole === 'user' ? "todays-tasks" : "assigned-tasks"} className="space-y-4">
        <TabsList>
          {userRole === 'user' ? (
            <>
              <TabsTrigger value="todays-tasks">Today's Tasks ({todaysTasks.length})</TabsTrigger>
              <TabsTrigger value="due-tasks">Due Tasks ({dueTasks.length})</TabsTrigger>
              <TabsTrigger value="all-tasks">All Tasks ({tasks.length})</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="assigned-tasks">Assigned by Me ({assignedTasks.length})</TabsTrigger>
              <TabsTrigger value="all-tasks">All Tasks ({tasks.length})</TabsTrigger>
            </>
          )}
        </TabsList>

        {userRole === 'user' && (
          <>
            <TabsContent value="todays-tasks" className="space-y-4">
              {todaysTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tasks due today</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {todaysTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{task.title}</h3>
                              <Badge variant={getPriorityColor(task.priority)}>
                                {task.priority.toUpperCase()}
                              </Badge>
                              <Badge variant={getStatusColor(task.status)}>
                                {getStatusIcon(task.status)}
                                {task.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-muted-foreground">{task.description}</p>
                            )}
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </div>
                            )}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Progress: {task.progress}%</span>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateProgress(task.id, Math.min(100, task.progress + 25))}
                                    disabled={task.status === 'completed'}
                                  >
                                    +25%
                                  </Button>
                                  {task.progress === 100 && task.status !== 'completed' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateProgress(task.id, 100, 'completed')}
                                    >
                                      Mark Complete
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <Progress value={task.progress} className="w-full" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="due-tasks" className="space-y-4">
              {dueTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No overdue tasks</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {dueTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{task.title}</h3>
                              <Badge variant={getPriorityColor(task.priority)}>
                                {task.priority.toUpperCase()}
                              </Badge>
                              <Badge variant={getStatusColor(task.status)}>
                                {getStatusIcon(task.status)}
                                {task.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-muted-foreground">{task.description}</p>
                            )}
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                Overdue: {new Date(task.due_date).toLocaleDateString()}
                              </div>
                            )}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Progress: {task.progress}%</span>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateProgress(task.id, Math.min(100, task.progress + 25))}
                                    disabled={task.status === 'completed'}
                                  >
                                    +25%
                                  </Button>
                                  {task.progress === 100 && task.status !== 'completed' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateProgress(task.id, 100, 'completed')}
                                    >
                                      Mark Complete
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <Progress value={task.progress} className="w-full" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}

        {(userRole === 'admin' || userRole === 'moderator') && (
          <TabsContent value="assigned-tasks" className="space-y-4">
            {assignedTasks.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks assigned by you</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignedTasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{task.title}</h3>
                            <Badge variant={getPriorityColor(task.priority)}>
                              {task.priority.toUpperCase()}
                            </Badge>
                            <Badge variant={getStatusColor(task.status)}>
                              {getStatusIcon(task.status)}
                              {task.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-muted-foreground">{task.description}</p>
                          )}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Assigned to: {task.assigned_to}</span>
                            <span>Progress: {task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="all-tasks" className="space-y-4">
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority.toUpperCase()}
                        </Badge>
                        <Badge variant={getStatusColor(task.status)}>
                          {getStatusIcon(task.status)}
                          {task.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-muted-foreground">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Assigned to: {task.assigned_to}</span>
                        <span>Progress: {task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}