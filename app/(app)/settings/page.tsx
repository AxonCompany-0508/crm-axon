"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/components/OrgProvider";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SettingsPage() {
  const { organizationId, userId, role } = useOrg();
  const supabase = createClient();
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [saved, setSaved] = useState(false);
  const canEditOrg = role === "owner" || role === "admin";

  useEffect(() => {
    async function load() {
      const [{ data: org }, { data: profile }] = await Promise.all([
        supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
      ]);
      setOrgName(org?.name || "");
      setFullName(profile?.full_name || "");
    }
    load();
  }, [organizationId, userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await Promise.all([
      supabase.from("profiles").update({ full_name: fullName }).eq("id", userId),
      canEditOrg
        ? supabase.from("organizations").update({ name: orgName }).eq("id", organizationId)
        : Promise.resolve(),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Configurações</h1>
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input
            label="Nome da empresa"
            value={orgName}
            disabled={!canEditOrg}
            onChange={(e) => setOrgName(e.target.value)}
          />
          {!canEditOrg && (
            <p className="text-xs text-gray-400">Somente donos/admins podem alterar o nome da empresa.</p>
          )}
          {saved && <p className="text-sm text-green-600">Salvo!</p>}
          <Button type="submit" className="self-start">
            Salvar alterações
          </Button>
        </form>
      </Card>
    </div>
  );
}
