import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import Navigation from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = ["/", "/architecture", "/documentation", "/use-cases"];

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const location = useLocation();

  const isPublicPage = PUBLIC_ROUTES.includes(location.pathname);
  const isResourceRoute = location.pathname.startsWith('/resources') || location.pathname === '/resource-auth';

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (!user) {
    return <>{children}</>;
  }

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
