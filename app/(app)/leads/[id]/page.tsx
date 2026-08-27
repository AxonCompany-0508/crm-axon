"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle, Instagram, Clock, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/components/OrgProvider";
import { Card, Badge } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LeadModal from "@/components/LeadModal";
import FollowUpModal from "@/components/FollowUpModal";
import { waLink, igLink } from "@/types/database";
import type { Lead, PipelineStage, FollowUp } from "@/types/database";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { organizationId } = useOrg();
  const supabase = createClient();

  const [lead, setLead] = useState<Lead | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);

  const load = useCallback(async () => {
    const [{ data: leadData }, { data: stagesData }, { data: followUpsData }] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id).maybeSingle(),
      supabase.from("pipeline_stages").select("*").eq("organization_id", organizationId).order("position"),
      supabase
        .from("follow_ups")
        .select("*")
        .eq("lead_id", id)
        .order("scheduled_at", { ascending: false }),
    ]);
    setLead(leadData);
    setStages(stagesData || []);
    setFollowUps(followUpsData || []);
  }, [id, organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!lead) {
    return <p className="text-gray-500">Carregando...</p>;
  }

  const stage = stages.find((s) => s.id === lead.stage_id);
  const wa = waLink(lead.phone);
  const ig = igLink(lead.instagram);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{lead.name}</h1>
          {stage && <Badge color={stage.color}>{stage.name}</Badge>}
        </div>
        <Button variant="secondary" onClick={() => setEditOpen(true)}>
          <Pencil size={16} /> Editar
        </Button>
      </div>

      <Card className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">WhatsApp</p>
          <p className="font-medium text-gray-900">{lead.phone || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Instagram</p>
          <p className="font-medium text-gray-900">{lead.instagram || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Origem</p>
          <p className="font-medium text-gray-900">{lead.source || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Valor</p>
          <p className="font-medium text-gray-900">
            {Number(lead.value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Interesse</p>
          <p className="font-medium text-gray-900">{lead.interest || "—"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Observações</p>
          <p className="whitespace-pre-wrap font-medium text-gray-900">{lead.notes || "—"}</p>
        </div>
      </Card>

      <div className="mb-6 flex flex-wrap gap-2">
        {wa && (
          <a href={wa} target="_blank">
            <Button variant="secondary">
              <MessageCircle size={16} /> Abrir WhatsApp
            </Button>
          </a>
        )}
        {ig && (
          <a href={ig} target="_blank">
            <Button variant="secondary">
              <Instagram size={16} /> Abrir Instagram
            </Button>
          </a>
        )}
        <Button variant="secondary" onClick={() => setFollowOpen(true)}>
          <Clock size={16} /> Agendar follow-up
        </Button>
      </div>

      <h2 className="mb-2 text-sm font-semibold text-gray-700">Histórico de follow-ups</h2>
      <div className="flex flex-col gap-2">
        {followUps.map((f) => (
          <Card key={f.id} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-gray-900">
                {new Date(f.scheduled_at).toLocaleString("pt-BR")}
              </p>
              {f.note && <p className="text-gray-500">{f.note}</p>}
            </div>
            <Badge color={f.status === "done" ? "#16A34A" : "#4F46E5"}>
              {f.status === "done" ? "Concluído" : f.status === "canceled" ? "Cancelado" : "Pendente"}
            </Badge>
          </Card>
        ))}
        {followUps.length === 0 && <p className="text-sm text-gray-400">Nenhum follow-up agendado.</p>}
      </div>

      <LeadModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
        onDeleted={() => router.push("/leads")}
        stages={stages}
        lead={lead}
      />
      <FollowUpModal open={followOpen} onClose={() => setFollowOpen(false)} onSaved={load} leadId={lead.id} />
    </div>
  );
}
