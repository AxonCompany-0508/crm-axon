"use client";
import { useEffect, useState, useCallback } from "react";
import { MessageCircle, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/components/OrgProvider";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { waLink } from "@/types/database";
import type { FollowUp } from "@/types/database";

export default function FollowUpsPage() {
  const { organizationId } = useOrg();
  const supabase = createClient();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("follow_ups")
      .select("*, leads(name, phone)")
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .order("scheduled_at");
    setFollowUps((data as any) || []);
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function markDone(id: string) {
    setFollowUps((prev) => prev.filter((f) => f.id !== id));
    await supabase.from("follow_ups").update({ status: "done" }).eq("id", id);
  }

  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const overdue = followUps.filter((f) => new Date(f.scheduled_at) < startOfDay);
  const today = followUps.filter(
    (f) => new Date(f.scheduled_at) >= startOfDay && new Date(f.scheduled_at) <= endOfDay
  );
  const upcoming = followUps.filter((f) => new Date(f.scheduled_at) > endOfDay);

  const sections: { title: string; items: FollowUp[]; empty: string }[] = [
    { title: "Atrasados", items: overdue, empty: "Nenhum follow-up atrasado." },
    { title: "Hoje", items: today, empty: "Nenhum follow-up para hoje." },
    { title: "Próximos", items: upcoming, empty: "Nenhum follow-up agendado." },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Follow-ups</h1>
      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">{section.title}</h2>
            {section.items.length === 0 ? (
              <p className="text-sm text-gray-400">{section.empty}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {section.items.map((f) => {
                  const wa = waLink(f.leads?.phone);
                  return (
                    <Card key={f.id} className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{f.leads?.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(f.scheduled_at).toLocaleString("pt-BR")}
                          {f.note ? ` · ${f.note}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {wa && (
                          <a href={wa} target="_blank">
                            <Button variant="secondary">
                              <MessageCircle size={16} /> WhatsApp
                            </Button>
                          </a>
                        )}
                        <Button variant="ghost" onClick={() => markDone(f.id)}>
                          <Check size={16} /> Concluir
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
