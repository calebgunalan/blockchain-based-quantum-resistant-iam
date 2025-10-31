import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import Navigation from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  
  const isResourceRoute = location.pathname.startsWith('/resources') || location.pathname === '/resource-auth';

  if (!user) {
    return <>{children}</>;
  }

  // Don't show IAM navigation on resource access pages
  if (isResourceRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}