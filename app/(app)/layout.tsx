import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrgProvider, type OrgContextType } from "@/components/OrgProvider";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  type MembershipRow = {
    organization_id: string;
    role: "owner" | "admin" | "member";
    organizations: { name: string } | { name: string }[] | null;
  };

  let { data: membership } = await supabase
    .from("memberships")
    .select("organization_id, role, organizations(name)")
    .eq("user_id", user.id)
    .maybeSingle<MembershipRow>();

  // Primeiro acesso: cria organization/profile/etapas padrão automaticamente.
  if (!membership) {
    const orgName = (user.user_metadata?.org_name as string) || "Minha Empresa";
    const fullNameMeta = (user.user_metadata?.full_name as string) || user.email || "Usuário";
    await supabase.rpc("create_organization_and_owner", {
      org_name: orgName,
      user_full_name: fullNameMeta,
    });
    const retried = await supabase
      .from("memberships")
      .select("organization_id, role, organizations(name)")
      .eq("user_id", user.id)
      .maybeSingle<MembershipRow>();
    membership = retried.data;
  }

  if (!membership) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const orgRel = membership.organizations;
  const organizationName = Array.isArray(orgRel) ? orgRel[0]?.name : orgRel?.name;

  const orgValue: OrgContextType = {
    organizationId: membership.organization_id,
    organizationName: organizationName || "",
    role: membership.role,
    userId: user.id,
    userName: profile?.full_name || user.email || "",
  };

  return (
    <OrgProvider value={orgValue}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <main className="mx-auto max-w-6xl p-4 pb-20 md:p-8 md:pb-8">{children}</main>
        </div>
        <MobileNav />
      </div>
    </OrgProvider>
  );
}
