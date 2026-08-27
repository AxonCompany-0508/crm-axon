"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/components/OrgProvider";
import LeadModal from "@/components/LeadModal";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Card";
import { waLink, igLink } from "@/types/database";
import type { Lead, PipelineStage } from "@/types/database";

export default function LeadsPage() {
  const { organizationId } = useOrg();
  const supabase = createClient();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    const [{ data: stagesData }, { data: leadsData }] = await Promise.all([
      supabase.from("pipeline_stages").select("*").eq("organization_id", organizationId).order("position"),
      supabase
        .from("leads")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
    ]);
    setStages(stagesData || []);
    setLeads(leadsData || []);
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const stageMap = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);

  const filtered = leads.filter((l) => {
    const matchesSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.phone || "").includes(search);
    const matchesStage = !stageFilter || l.stage_id === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
        <Button onClick={() => setModalOpen(true)}>Novo lead</Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="sm:max-w-xs">
          <option value="">Todas as etapas</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Instagram</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Próximo follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((lead) => {
              const stage = stageMap.get(lead.stage_id || "");
              const wa = waLink(lead.phone);
              const ig = igLink(lead.instagram);
              return (
                <tr
                  key={lead.id}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                  <td className="px-4 py-3">
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="text-brand-600 hover:underline"
                      >
                        {lead.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ig ? (
                      <a
                        href={ig}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="text-brand-600 hover:underline"
                      >
                        {lead.instagram}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {stage ? <Badge color={stage.color}>{stage.name}</Badge> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {Number(lead.value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {lead.next_follow_up ? new Date(lead.next_follow_up).toLocaleDateString("pt-BR") : "—"}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhum lead encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <LeadModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} stages={stages} />
    </div>
  );
}
