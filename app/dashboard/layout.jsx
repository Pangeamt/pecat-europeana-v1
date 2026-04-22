import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

const DashboardLayout = async ({ children }) => {
  const session = await getServerSession(authOptions);

  return (
    <DashboardShell initialUser={session?.user ?? null}>
      {children}
    </DashboardShell>
  );
};

export default DashboardLayout;
