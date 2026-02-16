import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { BrowserCompatibilityChecker } from "@/components/BrowserCompatibilityChecker";
import { SessionTimeoutWarning } from "@/components/security/SessionTimeoutWarning";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import QuantumSecurity from './pages/QuantumSecurity';
import Resources from './pages/Resources';
import Settings from './pages/Settings';
import Users from './pages/admin/Users';
import Roles from './pages/admin/Roles';
import Permissions from './pages/admin/Permissions';
import AuditLogs from './pages/admin/AuditLogs';
import AuditLogsNew from './pages/admin/AuditLogsNew';
import QuantumControl from './pages/admin/QuantumControl';
import UserManagement from './pages/admin/UserManagement';
import ZeroTrust from './pages/admin/ZeroTrust';
import UserGroups from './pages/admin/UserGroups';
import AttackLogs from './pages/admin/AttackLogs';
import SessionManagement from './pages/admin/SessionManagement';
import ModeratorUsers from './pages/admin/ModeratorUsers';
import BlockchainManagement from './pages/admin/BlockchainManagement';
import AccountLockouts from './pages/admin/AccountLockouts';
import AdvancedSecurity from './pages/security/AdvancedSecurity';
import ResourceAuth from './pages/ResourceAuth';
import UserGuidePage from './pages/UserGuide';
import DemoVisualization from './pages/admin/DemoVisualization';
import CryptoMigration from './pages/admin/CryptoMigration';
import BlockExplorer from './pages/admin/BlockExplorer';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <BrowserCompatibilityChecker />
            <SessionTimeoutWarning />
            <ErrorBoundary>
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/resource-auth" element={<ResourceAuth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/quantum-security" element={<QuantumSecurity />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/security/advanced" element={<AdvancedSecurity />} />
                  <Route path="/admin/users" element={<Users />} />
                  <Route path="/admin/roles" element={<Roles />} />
                  <Route path="/admin/permissions" element={<Permissions />} />
                  <Route path="/admin/audit-logs" element={<AuditLogs />} />
                  <Route path="/admin/audit-logs-new" element={<AuditLogsNew />} />
                  <Route path="/admin/quantum-control" element={<QuantumControl />} />
                  <Route path="/admin/user-management" element={<UserManagement />} />
                  <Route path="/admin/user-groups" element={<UserGroups />} />
                  <Route path="/admin/attack-logs" element={<AttackLogs />} />
                  <Route path="/admin/session-management" element={<SessionManagement />} />
                  <Route path="/admin/moderator-users" element={<ModeratorUsers />} />
                  <Route path="/admin/blockchain" element={<BlockchainManagement />} />
                  <Route path="/admin/account-lockouts" element={<AccountLockouts />} />
                  <Route path="/admin/zero-trust" element={<ZeroTrust />} />
                  <Route path="/admin/demo" element={<DemoVisualization />} />
                  <Route path="/admin/crypto-migration" element={<CryptoMigration />} />
                  <Route path="/admin/block-explorer" element={<BlockExplorer />} />
                  <Route path="/resources/auth" element={<ResourceAuth />} />
                  <Route path="/user-guide" element={<UserGuidePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;
