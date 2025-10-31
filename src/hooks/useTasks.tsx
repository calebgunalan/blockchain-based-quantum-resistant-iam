import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_by: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  progress: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface NewTask {
  title: string;
  description?: string;
  assigned_to: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data as Task[]) || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (newTask: NewTask) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...newTask,
          assigned_by: user.id,
          status: 'pending',
          progress: 0
        })
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [data as Task, ...prev]);
      toast.success('Task created successfully');
      
      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'CREATE',
        _resource: 'task',
        _resource_id: data.id,
        _details: { title: data.title, assigned_to: data.assigned_to }
      });

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          completed_at: updates.status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, ...(data as Task) } : task
        )
      );

      toast.success('Task updated successfully');
      
      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'UPDATE',
        _resource: 'task',
        _resource_id: taskId,
        _details: updates
      });

      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'DELETE',
        _resource: 'task',
        _resource_id: taskId
      });

    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      throw error;
    }
  };

  const getMyTasks = () => {
    return tasks.filter(task => task.assigned_to === user?.id && task.status !== 'completed');
  };

  const getAssignedTasks = () => {
    return tasks.filter(task => task.assigned_by === user?.id && task.status !== 'completed');
  };

  const getTodaysTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (!task.due_date || task.assigned_to !== user?.id || task.status === 'completed') return false;
      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate < tomorrow;
    });
  };

  const getDueTasks = () => {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.due_date || task.assigned_to !== user?.id || task.status === 'completed') return false;
      const dueDate = new Date(task.due_date);
      return dueDate <= now;
    });
  };

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    getMyTasks,
    getAssignedTasks,
    getTodaysTasks,
    getDueTasks,
    refetch: fetchTasks
  };
}