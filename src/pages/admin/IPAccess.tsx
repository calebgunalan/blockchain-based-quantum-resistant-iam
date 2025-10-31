import Layout from "@/components/Layout";
import { IPAccessManagement } from "@/components/security/IPAccessManagement";
import { Network } from "lucide-react";

export default function IPAccess() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8" />
            IP Access Control
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage IP whitelisting and blacklisting for enhanced security
          </p>
        </div>

        <IPAccessManagement />
      </div>
    </Layout>
  );
}
