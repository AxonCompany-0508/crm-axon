# AxonBr Company CRM

CRM multi-tenant para pequenos negócios que vendem por WhatsApp/Instagram.
Next.js 14 (App Router) + Supabase (Postgres + Auth + RLS).

## Colocar no ar (passo a passo)

**1. Criar projeto no Supabase**
- supabase.com → New Project.
- Em Authentication → Providers → Email, deixe "Confirm email" **desligado** se quiser liberar o acesso instantâneo no cadastro (recomendado para lançar hoje). Se deixar ligado, o usuário confirma por e-mail antes do primeiro login — o app já trata os dois casos.

**2. Rodar a migração**
- SQL Editor → cole o conteúdo de `supabase/migrations/001_init.sql` → Run.
  Isso cria todas as tabelas, índices, RLS e a função de cadastro.

**3. Configurar variáveis de ambiente**
- Copie `.env.local.example` para `.env.local`.
- Preencha com Project Settings → API → Project URL e anon public key.

**4. Rodar localmente**
```bash
npm install
npm run dev
```
Abra http://localhost:3000 → Criar conta.

**5. Deploy**
- Suba o repositório no GitHub e importe na Vercel (ou `vercel deploy`).
- Adicione as mesmas variáveis de ambiente no projeto da Vercel.

## Como funciona o multi-tenant
- Toda tabela de dados tem `organization_id`.
- RLS no Postgres bloqueia qualquer SELECT/INSERT/UPDATE/DELETE fora da organização do usuário — a segurança não depende do frontend.
- No cadastro, a função `create_organization_and_owner` cria a organização, o profile, o membership (`owner`) e as 7 etapas padrão do funil, tudo em uma transação.

## Testando o isolamento
1. Crie a conta da "Empresa A", cadastre um lead.
2. Saia e crie a conta da "Empresa B".
3. Confirme que a Empresa B não vê o lead da Empresa A em nenhuma tela (Leads, Pipeline, Dashboard). O bloqueio acontece no banco, então nem uma chamada direta à API do Supabase com o token da Empresa B conseguiria ler dados da Empresa A.

## Admin global (preparado, não implementado)
- `profiles.is_platform_admin` já existe no banco. Quando quiser um painel admin, basta criar rotas que checam esse campo — não precisa alterar o schema.

## Próximos passos sugeridos (fora do escopo deste MVP)
Cobrança/assinatura, integração oficial WhatsApp/Instagram, automações, relatórios avançados — propositalmente deixados de fora para lançar rápido.
