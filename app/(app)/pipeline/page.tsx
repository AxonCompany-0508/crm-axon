"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/components/OrgProvider";
import KanbanBoard from "@/components/KanbanBoard";
import LeadModal from "@/components/LeadModal";
import Button from "@/components/ui/Button";
import type { Lead, PipelineStage } from "@/types/database";

export default function PipelinePage() {
  const { organizationId } = useOrg();
  const supabase = createClient();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>();

  const load = useCallback(async () => {
    const [{ data: stagesData }, { data: leadsData }] = await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("*")
        .eq("organization_id", organizationId)
        .order("position"),
      supabase.from("leads").select("*").eq("organization_id", organizationId),
    ]);
    setStages(stagesData || []);
    setLeads(leadsData || []);
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDrop(leadId: string, stageId: string) {
    if (!leadId) return;
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage_id: stageId } : l)));
    await supabase.from("leads").update({ stage_id: stageId }).eq("id", leadId);
  }

  function openNew(stageId: string) {
    setEditingLead(null);
    setDefaultStageId(stageId);
    setModalOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead);
    setModalOpen(true);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Pipeline</h1>
        <Button onClick={() => openNew(stages[0]?.id)}>Novo lead</Button>
      </div>
      <KanbanBoard
        stages={stages}
        leads={leads}
        onDropLead={handleDrop}
        onOpenLead={openEdit}
        onAddLead={openNew}
      />
      <LeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        onDeleted={load}
        stages={stages}
        lead={editingLead}
        defaultStageId={defaultStageId}
      />
    </div>
  );
}
