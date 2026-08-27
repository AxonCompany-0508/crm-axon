"use client";
import { useEffect, useState, useCallback } from "react";
import { Copy, Pencil, Trash2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/components/OrgProvider";
import { Card, Badge } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { DEFAULT_TEMPLATE_CATEGORIES } from "@/types/database";
import type { MessageTemplate } from "@/types/database";

export default function TemplatesPage() {
  const { organizationId } = useOrg();
  const supabase = createClient();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState({ name: "", category: DEFAULT_TEMPLATE_CATEGORIES[0], content: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("message_templates")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    setTemplates(data || []);
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ name: "", category: DEFAULT_TEMPLATE_CATEGORIES[0], content: "" });
    setModalOpen(true);
  }

  function openEdit(t: MessageTemplate) {
    setEditing(t);
    setForm({ name: t.name, category: t.category || DEFAULT_TEMPLATE_CATEGORIES[0], content: t.content });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, organization_id: organizationId };
    if (editing) {
      await supabase.from("message_templates").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("message_templates").insert(payload);
    }
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este modelo?")) return;
    await supabase.from("message_templates").delete().eq("id", id);
    load();
  }

  function copy(t: MessageTemplate) {
    navigator.clipboard.writeText(t.content);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Templates</h1>
        <Button onClick={openNew}>
          <Plus size={16} /> Novo modelo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.id} className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{t.name}</p>
                {t.category && <Badge>{t.category}</Badge>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(t)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(t.id)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-600">{t.content}</p>
            <Button variant="secondary" onClick={() => copy(t)} className="mt-1 self-start">
              <Copy size={15} /> {copiedId === t.id ? "Copiado!" : "Copiar"}
            </Button>
          </Card>
        ))}
        {templates.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum modelo criado ainda.</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar modelo" : "Novo modelo"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nome"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Categoria"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {DEFAULT_TEMPLATE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Textarea
            label="Mensagem"
            rows={5}
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
