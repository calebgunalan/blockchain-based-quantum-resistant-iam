import { DocumentManager } from '@/components/resources/DocumentManager';
import { TaskManager } from '@/components/workspace/TaskManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Shield, ClipboardList, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Resources() {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          {userRole === 'admin' && (
            <Button 
              variant="default" 
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              IAM Portal
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Protected Resources</h1>
        </div>
        <p className="text-muted-foreground">
          Access and manage protected company resources. All access is monitored and logged for security compliance.
        </p>
      </div>

      <div className="bg-muted p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">Employee Workspace</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Complete workspace for managing documents, tasks, and daily operations. Access classified documents, 
          track task progress, and collaborate with your team. All activities are monitored and logged for security compliance.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span><strong>Documents:</strong> Classified files with upload/download</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <span><strong>Tasks:</strong> Daily assignments and progress tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span><strong>Security:</strong> Role-based access and monitoring</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Document Management
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ClipboardList className="h-4 w-4 mr-2" />
            Task Workspace
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents" className="space-y-4">
          <DocumentManager />
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <TaskManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}