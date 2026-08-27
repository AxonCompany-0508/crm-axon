"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/components/OrgProvider";
import { Card } from "@/components/ui/Card";

type Stats = {
  total: number;
  novos: number;
  negociacao: number;
  fechados: number;
  followUpsHoje: number;
  valorEmNegociacao: number;
};

export default function DashboardPage() {
  const { organizationId } = useOrg();
  const supabase = createClient();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: stages }, { data: leads }] = await Promise.all([
        supabase.from("pipeline_stages").select("id, name").eq("organization_id", organizationId),
        supabase
          .from("leads")
          .select("id, value, stage_id")
          .eq("organization_id", organizationId),
      ]);

      const stageId = (name: string) => stages?.find((s) => s.name === name)?.id;
      const novosId = stageId("Novo Lead");
      const negId = stageId("Em Negociação");
      const fechadoId = stageId("Fechado");

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { count: followUpsHoje } = await supabase
        .from("follow_ups")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "pending")
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString());

      const leadList = leads || [];
      setStats({
        total: leadList.length,
        novos: leadList.filter((l) => l.stage_id === novosId).length,
        negociacao: leadList.filter((l) => l.stage_id === negId).length,
        fechados: leadList.filter((l) => l.stage_id === fechadoId).length,
        followUpsHoje: followUpsHoje || 0,
        valorEmNegociacao: leadList
          .filter((l) => l.stage_id === negId)
          .reduce((sum, l) => sum + Number(l.value || 0), 0),
      });
    }
    load();
  }, [organizationId]);

  const cards = [
    { label: "Leads totais", value: stats?.total },
    { label: "Leads novos", value: stats?.novos },
    { label: "Em negociação", value: stats?.negociacao },
    { label: "Vendas fechadas", value: stats?.fechados },
    { label: "Follow-ups de hoje", value: stats?.followUpsHoje },
    {
      label: "Valor em negociação",
      value:
        stats?.valorEmNegociacao !== undefined
          ? stats.valorEmNegociacao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          : undefined,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {c.value === undefined ? "—" : c.value}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
