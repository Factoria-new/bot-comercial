# 📅 Google Calendar Integration - Quick Reference

## Setup Rápido (3 Passos)

### 1️⃣ Adicionar ao .env
```env
COMPOSIO_API_KEY=sua-chave-aqui  # Obtenha em app.composio.dev/settings
TIMEZONE=America/Sao_Paulo
```

### 2️⃣ Autenticar (Executar UMA VEZ)
```bash
cd backend
npx composio login
npx composio add googlecalendar
```

### 3️⃣ Reiniciar Backend
```bash
npm run dev
```

**Pronto!** ✅ O bot agora entende comandos de calendário.

---

## Exemplos de Uso via WhatsApp

### ➕ Criar Evento

```
"Agende uma reunião amanhã às 14h chamada 'Reunião de Planejamento'"
"Marque um compromisso para segunda-feira às 10h sobre vendas"
"Crie um evento na próxima quarta às 15 horas"
```

### 📋 Listar Eventos

```
"Quais são meus compromissos de hoje?"
"Me mostre minha agenda de amanhã"
"O que tenho marcado para esta semana?"
```

### 🔍 Buscar Evento

```
"Procure minha reunião de planejamento"
"Quando é minha próxima reunião?"
"Encontre o evento sobre vendas"
```

### ✏️ Atualizar Evento

```
"Mude minha reunião de planejamento para às 15h"
"Altere o título da reunião para 'Planejamento Q4'"
```

---

## Verificação Rápida

### ✅ Verificar se está configurado
```bash
# Ver status da integração
npx composio apps
# Deve listar: googlecalendar

# Ver instalação
npm list composio-core
# Deve mostrar: composio-core@0.5.39
```

### ✅ Verificar logs do backend
Procure por estas mensagens quando iniciar `npm run dev`:

**Sem configuração**:
```
⚠️ COMPOSIO_API_KEY não configurada
```
↪️ **Ação**: Adicione a chave ao .env

**Com configuração**:
```
✅ Cliente Composio inicializado com sucesso
```
↪️ **Tudo certo!**

---

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Calendar tools não disponíveis" | Adicione `COMPOSIO_API_KEY` ao `.env` |
| "Não consigo criar eventos" | Execute `npx composio add googlecalendar` |
| "Eventos no horário errado" | Ajuste `TIMEZONE` no `.env` |
| Bot não responde sobre calendário | Normal se Composio não estiver configurado - ainda responde mensagens normais |

---

## Recursos

📖 **Documentação Completa**: [CALENDAR-SETUP.md](file:///c:/Users/Bruno%20Porto/Desktop/bot-comercial/backend/CALENDAR-SETUP.md)

📝 **Detalhes Técnicos**: [walkthrough.md](file:///C:/Users/Bruno%20Porto/.gemini/antigravity/brain/b4dbade5-b369-4e67-ab78-e6ba98ce841a/walkthrough.md)

🔗 **Composio Dashboard**: [app.composio.dev](https://app.composio.dev)

📅 **Google Calendar**: [calendar.google.com](https://calendar.google.com)

---

## Datas Relativas Suportadas

O bot entende expressões naturais em português:

- ✅ "amanhã às 14h"
- ✅ "próxima segunda às 10h"
- ✅ "daqui a 3 dias"
- ✅ "semana que vem"
- ✅ "mês que vem dia 15"
- ✅ "hoje às 17h30"

---

## Notas Importantes

⚠️ **Segurança**: Deletar eventos NÃO está habilitado por padrão (previne exclusões acidentais)

✅ **Fallback**: Se Composio não estiver configurado, o bot continua funcionando normalmente para mensagens não relacionadas a calendário

🔄 **Smart Tools**: O bot SÓ usa Calendar tools quando a mensagem é claramente sobre agendamentos - mensagens normais são processadas normalmente
