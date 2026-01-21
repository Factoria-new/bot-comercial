# 🗺️ De Localhost para AWS EC2: Onde vai cada terminal?

Aqui está o "mapa" de como seus 3 terminais locais se transformam em uma arquitetura de servidor profissional na AWS.

---

## 🔄 Resumo da Transformação

No seu computador, você mantém terminais abertos. No servidor, nós transformamos esses terminais em **Serviços de Fundo** (Background Services) que rodam sozinhos, 24/7.

| Seu Computador (Local) | AWS EC2 (Servidor) | Quem gerencia? |
|------------------------|--------------------|----------------|
| **Terminal 1**: `npm run dev` (Frontend) | **Arquivos Estáticos** | Nginx (Servidor Web) |
| **Terminal 2**: `npm run dev` (Backend) | **Processo Rodando** | PM2 (Gerenciador) |
| **Terminal 3**: `uvicorn` (AI Engine) | **Processo Rodando** | PM2 (Gerenciador) |

---

## 1️⃣ Terminal do Frontend (React/Vite)
> *Local: `npm run dev`*

❌ **Na AWS:** Você **NÃO** roda este terminal.
✅ **Como fica:** Você "constroi" o site e o Nginx serve os arquivos.

1. **Build:** Você roda `npm run build` uma única vez (ou a cada update).
2. **Resultado:** Isso cria uma pasta `dist/` com HTML/CSS/JS otimizados.
3. **Serviço:** O **Nginx** (um software que você instala no Linux) fica "escutando" a porta 80 (HTTP) e entrega esses arquivos para quem acessar seu site.

**Comando na AWS:**
```bash
npm run build
# (O Nginx já estará rodando em segundo plano cuidando do resto)
```

---

## 2️⃣ Terminal do Backend (Node.js)
> *Local: `npm run dev`*

❌ **Na AWS:** Você não deixa um terminal aberto bloqueado.
✅ **Como fica:** O **PM2** cria um "terminal virtual" para ele.

**Comando na AWS:**
```bash
# Inicia o processo e deixa ele rodando no fundo
pm2 start src/index.js --name "backend"
```

---

## 3️⃣ Terminal do AI Engine (Python/Uvicorn)
> *Local: `active venv` + `uvicorn main:app ...`*

❌ **Na AWS:** Mesma coisa, nada de terminal aberto.
✅ **Como fica:** O **PM2** também gerencia o Python!

**Comando na AWS:**
```bash
# O PM2 usa o interpretador do venv para rodar o uvicorn
pm2 start "venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000" --name "ai_engine"
```

---

## 🖥️ O "Painel de Controle" (Seus Terminais na AWS)

Quando você quiser ver como estão seus "terminais", você digita `pm2 status` na AWS e verá algo assim:

```text
┌────┬──────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id │ name         │ mode        │ status  │ uptime  │ cpu      │
├────┼──────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0  │ backend      │ fork        │ online  │ 2d      │ 0.1%     │
│ 1  │ ai_engine    │ fork        │ online  │ 2d      │ 0.3%     │
└────┴──────────────┴─────────────┴─────────┴─────────┴──────────┘
```

- **Quer ver o log do backend?** `pm2 logs backend`
- **Quer ver o log da IA?** `pm2 logs ai_engine`
- **Quer reiniciar tudo?** `pm2 restart all`

### 🔌 E o Nginx?
O Nginx roda como um "porteiro" na frente de tudo e serve o Frontend:

```mermaid
graph TD
    User((Usuário))
    Nginx[Nginx (Porta 80/443)]
    
    subgraph Servidor EC2
        Frontend[📁 Arquivos Estáticos (dist/)]
        Backend[⚙️ Node.js (Porta 3003)]
        AI[🧠 AI Engine (Porta 8000)]
    end

    User --> Nginx
    Nginx -->|Acessa site| Frontend
    Nginx -->|/api| Backend
    Backend -->|Interno| AI
```
