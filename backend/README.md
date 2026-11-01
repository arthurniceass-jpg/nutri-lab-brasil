# Back-end da Nutri Lab (Python / FastAPI)

API em Python que assume, **por etapas**, partes do back-end que hoje vivem dentro do Next.js.
Usa o **mesmo banco Postgres** (Supabase) e os **mesmos caminhos** de API da loja, então a troca é
feita por um interruptor, sem mexer nas telas.

## Etapa 1 (esta)

| Rota | O que faz | Melhora em relação ao Next.js atual |
|---|---|---|
| `POST /api/auth`, `DELETE /api/auth` | login/saída do dono | limite de tentativas, senha com hash bcrypt, comparação em tempo constante |
| `POST /api/conta/login` · `/registrar` · `/logout` | clientes | limite de tentativas, senha forte (8+, letras e números, sem senhas comuns), sem vazar se o e-mail existe pelo tempo de resposta |
| `GET /api/sessao` | quem está logado | novo |
| `POST /api/webhooks/mercadopago` | confirma pagamentos | **recusa** sem assinatura válida (antes aceitava tudo se a chave faltasse); notificação atrasada não "desfaz" pedido pago; estoque nunca fica negativo |
| `POST /api/shaker/stacks`, `GET /api/shaker/stacks/{codigo}` | salva e lê stacks do Shaker com link curto | novo |
| `GET /health`, `GET /health/db` | saúde do serviço | novo |

Fora da etapa 1 (continuam no Next.js): checkout, admin (produtos, pedidos, cupons, relatórios),
recuperação de senha, avaliações, frete.

Sessão e senha são **compatíveis** com as do site: tokens JWT (HS256) e hashes bcrypt feitos pelo Python
são aceitos pelo `jose`/`bcryptjs` do Next.js e vice-versa (verificado nos dois sentidos).
Por isso dá para migrar rota por rota sem deslogar ninguém.

## Rodar local

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt    # Linux/Mac: .venv/bin/python
cp .env.example .env        # preencha AUTH_SECRET, OWNER_EMAIL, OWNER_PASSWORD_HASH, DATABASE_URL
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
# documentação interativa (só fora de produção): http://localhost:8000/docs
```

Gerar o hash da senha do dono (não use senha em texto puro):

```bash
.venv/Scripts/python -m app.hash_password      # imprime OWNER_PASSWORD_HASH=...
```

## Testes

```bash
.venv/Scripts/python -m pytest -q
```

54 testes: sessões (assinatura, expiração, `alg=none`, papéis), senhas e CPF, limite de tentativas,
fluxos de login/cadastro, webhook (assinatura, repetição, ordem, estorno, indisponibilidade do Mercado Pago)
e Shaker. Rodam em SQLite em memória, sem tocar no banco real.

## Colocar no ar (Railway) e ligar no site

1. **Railway**: novo serviço a partir deste repositório, **Root Directory = `backend`**. O `Procfile` já tem o comando.
2. **Variáveis do Railway** (veja `.env.example`). Em produção a API **não sobe** se faltar algo crítico
   (`APP_ENV=production` exige `AUTH_SECRET` com 32+ caracteres, dono configurado e banco que não seja SQLite).
   - `DATABASE_URL`: a conexão do Supabase (painel do Supabase → Connect). Pode ser a URL do Prisma.
   - `AUTH_SECRET`: gere um novo (`python -c "import secrets;print(secrets.token_urlsafe(48))"`) e coloque **o mesmo valor
     no Railway e na Vercel**. As variáveis da Vercel são "Sensitive" (não dá para ler de volta), então a troca por um
     segredo novo é o caminho. Efeito: todos são deslogados uma vez.
   - `OWNER_EMAIL`, `OWNER_PASSWORD_HASH` (use `python -m app.hash_password`). Troque também a senha do dono.
   - `MP_WEBHOOK_SECRET`: "Assinatura secreta" em Mercado Pago → Suas integrações → Webhooks.
   - `TRUST_PROXY=true`, `PUBLIC_BASE_URL=https://nutrilab-seven.vercel.app`.
3. **Teste**: `https://SEU-SERVICO.up.railway.app/health/db` deve responder `{"status":"ok","db":"ok"}`.
4. **Ligar no site**: na Vercel, adicione `PYTHON_API_URL=https://SEU-SERVICO.up.railway.app` e publique de novo.
   A partir daí as rotas da tabela acima passam a ser atendidas pelo Python, com o mesmo endereço do site
   (cookies continuam funcionando). **Voltar atrás**: remova a variável e publique.
5. No Mercado Pago, o endereço do webhook **não muda** (`/api/webhooks/mercadopago` no domínio da loja).

Se for trocar o `AUTH_SECRET` da Vercel, faça os passos 2 e 4 juntos para não ficar um lado com segredo diferente do outro.

## Segurança: o que está e o que falta

Já está: limite de tentativas (IP e IP+e-mail, `429` com `Retry-After`), senhas bcrypt, cookies `httpOnly`/`secure`/`sameSite`,
JWT que só aceita HS256 com validade obrigatória, webhook que falha fechado, corpo de requisição limitado a 64 KB,
cabeçalhos de segurança, erros internos sem detalhes na resposta, documentação da API desligada em produção, tabela
própria só para o que é do Python (as tabelas do Prisma nunca são criadas nem alteradas por aqui).

Limites conhecidos (próximas etapas):
- O contador de tentativas fica na memória do processo: com **uma** instância (Railway) basta; com várias, mover para Redis.
- CPF ainda é guardado em texto puro (dado sensível pela LGPD): criptografar na coluna.
- Token de recuperação de senha ainda é guardado sem hash (está no Next.js; migra na etapa 2).
- CSP (política de conteúdo) do site ainda não existe: precisa de teste com o checkout do Mercado Pago.
