"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Verifique seu e-mail</h1>
        <p className="text-sm text-gray-600">
          Se {email} estiver cadastrado, enviamos um link para redefinir a senha.
        </p>
        <Link href="/login" className="text-sm text-brand-600 hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-gray-900">Recuperar senha</h1>
      <Input label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" loading={loading} className="w-full">
        Enviar link
      </Button>
      <Link href="/login" className="text-center text-sm text-gray-500 hover:text-brand-600">
        Voltar ao login
      </Link>
    </form>
  );
}
