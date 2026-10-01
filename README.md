# 🧪 NUTRI LAB BRASIL

> E-commerce de suplementos + painel administrativo do proprietário.
> **Energia · Foco · Disciplina · Evolução.**

Loja completa com catálogo, carrinho, checkout real via **Mercado Pago** (Pix, cartão e
boleto), contas de cliente e um painel do dono com indicadores de negócio.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui ·
PostgreSQL + Prisma · Recharts · Mercado Pago · Resend (e-mail) · Auth com JWT (jose + bcryptjs).

🔗 **Produção:** https://nutrilab-seven.vercel.app

---

## 📑 Sumário
- [Funcionalidades](#-funcionalidades)
- [Scripts](#-scripts)
- [Como rodar](#-como-rodar)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Pagamento (Mercado Pago)](#-pagamento-mercado-pago)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Decisões técnicas](#-decisões-técnicas)
- [Deploy](#-deploy)

---

## ✨ Funcionalidades

### 🛒 Loja (`/`)
- Header com logo e carrinho com contador; hero com slogan e CTA.
- Faixa de confiança (qualidade, 100% original, envio rápido).
- Catálogo com filtro por categoria (Proteínas, Creatina, Pré-treino, Aminoácidos, Vitaminas, Emagrecedores).
- Página de produto (`/produto/[slug]`) com avaliações (reviews) de clientes.
- Carrinho lateral com quantidade, remoção, cupom de desconto e barra de frete grátis.
- Cálculo de frete por CEP. Tudo em BRL e pt-BR.

### 👤 Conta do cliente
- Cadastro (`/conta/cadastro`) e login (`/conta/entrar`) com senha **com hash** (`bcryptjs`).
- Recuperação de senha (`/conta/esqueci` → `/conta/redefinir`).
- Sessão própria do cliente (cookie `nl_customer`, JWT, 30 dias), separada da do dono.
- "Minha conta" (`/conta`, protegida): dados e histórico de pedidos; edição de perfil.
- Pedidos do cliente logado ficam vinculados a ele (`customerId`).

### 🛠️ Painel do dono (`/admin`, protegido por middleware)
- **Dashboard** — KPIs (faturamento, lucro líquido, pedidos, ticket médio) com variação mensal e mini-gráficos; gráfico de faturamento × lucro; donut por categoria; ranking de mais vendidos; alerta de estoque baixo.
- **Produtos** — CRUD completo (preço, custo, estoque, categoria, imagem).
- **Pedidos** — listagem, detalhe, atualização de status e criação manual.
- **Estoque, Fornecedores, Cupons, Clientes, Configurações** e **Relatórios** (com exportação).
- **Lucro calculado no backend** como `(preço − custo)`; o custo **nunca** é exposto na loja.

---

## 📜 Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | `prisma generate` + build de produção |
| `npm run start` | Sobe a versão de produção |
| `npm run lint` | Roda o ESLint |
| `npm run db:push` | Cria/atualiza as tabelas no banco |
| `npm run db:seed` | Popula produtos + histórico de pedidos |
| `npm run db:studio` | Abre o Prisma Studio |

---

## 🚀 Como rodar

**Pré-requisitos:** Node 18.18+ (recomendado 20+) e um PostgreSQL (local ou em nuvem: Neon, Supabase, Railway).

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o ambiente
cp .env.example .env   # preencha os valores (ver abaixo)

# 3. Criar o schema e popular o banco
npm run db:push
npm run db:seed

# 4. Rodar
npm run dev
```

- Loja: http://localhost:3000
- Painel: http://localhost:3000/admin (login com `OWNER_EMAIL` / `OWNER_PASSWORD`)

---

## 🔐 Variáveis de ambiente

Copie `.env.example` para `.env`. **Nunca** comite o `.env` (já está no `.gitignore`).

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL (com pool) usada pela aplicação |
| `DIRECT_URL` | Conexão direta usada pelo Prisma nas migrations |
| `AUTH_SECRET` | Segredo da sessão do dono (`openssl rand -base64 32`) |
| `OWNER_EMAIL` / `OWNER_PASSWORD` | Credenciais de acesso ao `/admin` |
| `MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET` | Credenciais do Mercado Pago (opcional em dev) |
| `RESEND_API_KEY` / `EMAIL_FROM` | E-mail transacional (sem a chave, e-mails só vão pro log) |
| `NEXT_PUBLIC_BASE_URL` | URL pública da aplicação |

---

## 💳 Pagamento (Mercado Pago)

O checkout cria um pedido `PENDENTE`, busca os preços **autoritativos no banco** (nunca
confia no cliente), gera uma `Preference` e redireciona para o **Checkout Pro**.

O webhook `POST /api/webhooks/mercadopago`:
- Valida a assinatura `x-signature` (quando `MP_WEBHOOK_SECRET` está setado);
- Consulta o pagamento na API do Mercado Pago;
- Atualiza o status do pedido e **baixa o estoque na transição para `PAGO`** (de forma idempotente).

**Modo demo (sem token):** o checkout usa uma tela de pagamento local (`/checkout/pagamento`)
com Pix/cartão/boleto simulados — nenhuma cobrança real acontece. Para ativar o Mercado Pago
real, configure `MP_ACCESS_TOKEN` e reinicie. Para testar o webhook localmente, exponha a
porta com um túnel (ex.: `ngrok http 3000`).

---

## 📁 Estrutura de pastas

```
src/
  app/
    page.tsx                   loja
    produto/[slug]/            página de produto
    conta/                     cadastro, login, perfil, recuperar senha
    checkout/                  sucesso, erro, pendente, pagamento (demo)
    admin/
      login/                   tela de login do dono
      (dashboard)/             painel protegido (produtos, pedidos, estoque,
                               fornecedores, cupons, clientes, relatórios, config.)
    api/
      auth/ · conta/           sessões (dono e cliente)
      checkout/ · coupon/ · frete/ · reviews/
      admin/                   endpoints protegidos do painel
      webhooks/mercadopago/    confirma pagamento + baixa estoque
  components/   ui/ (shadcn) · store/ · admin/ · providers/
  server/       auth/ · db/ · services/ (products, coupons, shipping, dashboard, email, settings)
  shared/       types, validators, format (BRL/pt-BR), categories
  middleware.ts protege /admin
prisma/
  schema.prisma · seed.ts
```

---

## 🧠 Decisões técnicas

- **Valores em centavos** (inteiros) para evitar erros de ponto flutuante.
- O DTO da loja (`ProductDTO`) **nunca** inclui `costCents`.
- Todas as rotas `/api/admin/*` validam a sessão do dono (o middleware só cobre as páginas).
- Preço e cupom são **sempre revalidados no servidor** no checkout.
- `npm run build` roda `prisma generate` antes do `next build`.

---

## ☁️ Deploy

Hospedado na **Vercel**, com banco **PostgreSQL no Supabase**.

> ⚠️ **Supabase (plano free) pausa o projeto após ~7 dias de inatividade** — quando isso
> acontece, a loja retorna HTTP 500 até reativar em *supabase.com/dashboard → Resume project*.
> Para evitar, considere um keep-alive, o plano Pro, ou migrar para o Neon (que religa sozinho).
