"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, org_name: orgName } },
    });

    if (error) {
      setLoading(false);
      setError(error.message.includes("already registered") ? "Este e-mail já está cadastrado." : "Não foi possível criar a conta.");
      return;
    }

    if (data.session) {
      await supabase.rpc("create_organization_and_owner", {
        org_name: orgName,
        user_full_name: fullName,
      });
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setLoading(false);
    setNeedsConfirmation(true);
  }

  if (needsConfirmation) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Confirme seu e-mail</h1>
        <p className="text-sm text-gray-600">
          Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar, faça login para começar.
        </p>
        <Link href="/login">
          <Button className="w-full mt-2">Ir para o login</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-gray-900">Criar conta</h1>
      <Input label="Seu nome" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <Input label="Nome da empresa" required value={orgName} onChange={(e) => setOrgName(e.target.value)} />
      <Input label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        label="Senha"
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">
        Criar conta grátis
      </Button>
      <p className="text-center text-sm text-gray-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
