# 📅 Google Calendar Integration - Setup Guide

Este guia detalha os passos necessários para configurar a integração do Google Calendar usando o Composio.

## ✅ Passo 1: Dependências (CONCLUÍDO)

A dependência `composio-core` já foi instalada:

```bash
npm install composio-core
```

## 🔑 Passo 2: Configurar Variáveis de Ambiente

Você precisa adicionar as seguintes variáveis ao arquivo `.env`:

```env
# API Key do Composio (obtenha em https://app.composio.dev/settings)
COMPOSIO_API_KEY=sua-chave-aqui

# Fuso horário (opcional, padrão: America/Sao_Paulo)
TIMEZONE=America/Sao_Paulo
```

### Como obter a API Key do Composio:

1. Acesse [https://app.composio.dev](https://app.composio.dev)
2. Crie uma conta ou faça login
3. Vá em **Settings** → **API Keys**
4. Copie sua API Key
5. Cole no arquivo `.env`

## 🔐 Passo 3: Autenticar com Google Calendar

Execute os seguintes comandos no terminal dentro da pasta `backend`:

### 3.1 Login no Composio

```bash
npx composio login
```

Este comando abrirá uma janela no navegador para você fazer login na plataforma Composio.

### 3.2 Vincular Google Calendar

```bash
npx composio add googlecalendar
```

Este comando:
1. Abrirá uma janela no navegador
2. Solicitará permissões para acessar seu Google Calendar
3. Complete o fluxo OAuth autorizado pelo Google
4. A conexão será estabelecida automaticamente

### 3.3 Verificar Integração

Para confirmar que a integração foi configurada corretamente:

```bash
npx composio apps
```

Você deverá ver `googlecalendar` na lista de apps conectados.

## ✅ Passo 4: Modificações no Código (CONCLUÍDO)

As seguintes modificações já foram implementadas em `geminiService.js`:

- ✅ Importação do `Composio`
- ✅ Inicialização do cliente Composio
- ✅ Função `getCalendarTools()` para carregar as ferramentas
- ✅ Função `processMessageWithCalendar()` com suporte a Function Calling
- ✅ Sistema de fallback caso o Composio não esteja configurado
- ✅ Contexto temporal (data/hora atual) adicionado ao prompt

## 🚀 Passo 5: Como Usar

### Opção 1: Usar sempre o Calendar (Recomendado)

No seu `whatsappController.js`, substitua chamadas a `processMessageWithGemini()` por `processMessageWithCalendar()`:

```javascript
import { processMessageWithCalendar } from '../services/geminiService.js';

// Processar mensagem com suporte a Calendar
const response = await processMessageWithCalendar(
  messageText,
  phoneNumber,
  GEMINI_API_KEY,
  systemPrompt
);
```

**Vantagem**: As ferramentas de Calendar ficam sempre disponíveis, mas só são usadas quando o usuário menciona eventos, compromissos, agendamentos, etc. Para mensagens normais, funciona como antes.

### Opção 2: Detecção de Palavras-chave

Se preferir ativar Calendar tools apenas quando necessário:

```javascript
import { processMessageWithGemini, processMessageWithCalendar } from '../services/geminiService.js';

// Palavras-chave relacionadas a calendário
const calendarKeywords = ['agendar', 'marcar', 'calendário', 'reunião', 'compromisso', 'evento', 'lembrete'];

// Verificar se a mensagem contém palavras-chave de calendário
const needsCalendar = calendarKeywords.some(keyword => 
  messageText.toLowerCase().includes(keyword)
);

const response = needsCalendar 
  ? await processMessageWithCalendar(messageText, phoneNumber, GEMINI_API_KEY, systemPrompt)
  : await processMessageWithGemini(messageText, phoneNumber, GEMINI_API_KEY, systemPrompt, FIXED_TEMPERATURE);
```

## 🧪 Passo 6: Testar a Integração

### Teste 1: Iniciar o Backend

```bash
npm run dev
```

Verifique nos logs se você vê:
```
✅ Cliente Composio inicializado com sucesso
```

### Teste 2: Via WhatsApp

Envie as seguintes mensagens para o bot:

1. **Criar evento**: 
   - "Agende uma reunião amanhã às 14h chamada 'Reunião de Planejamento'"
   - "Marque um compromisso para segunda às 10h"

2. **Listar eventos**:
   - "Quais são meus compromissos de hoje?"
   - "Me mostre minha agenda de amanhã"

3. **Buscar evento**:
   - "Procure minha reunião de planejamento"
   - "Quando é minha próxima reunião?"

4. **Mensagem normal** (para garantir que funciona sem Calendar):
   - "Olá, como você está?"
   - "Me ajude com uma dúvida"

### Teste 3: Verificar no Google Calendar

Acesse [Google Calendar](https://calendar.google.com) e verifique se os eventos criados pelo bot aparecem corretamente.

## 🔍 Troubleshooting

### Erro: "COMPOSIO_API_KEY não configurada"

**Solução**: Adicione a chave ao arquivo `.env` e reinicie o backend.

### Erro: "Calendar tools não disponíveis"

**Possíveis causas**:
1. Você não executou `npx composio login`
2. Você não executou `npx composio add googlecalendar`
3. A autenticação OAuth expirou

**Solução**: Execute novamente os comandos de autenticação.

### O bot não cria eventos

**Verificar**:
1. Os logs do backend mostram `📅 Processando mensagem COM suporte a Calendar`?
2. Você vê `🔧 function call(s) detectada(s)` nos logs?
3. Há algum erro nos logs relacionado ao Composio?

### Eventos são criados com horário errado

**Solução**: Verifique a variável `TIMEZONE` no `.env` e certifique-se de que está correto (ex: `America/Sao_Paulo`).

## 📚 Referências

- [Composio Documentation](https://docs.composio.dev/)
- [Composio Google Calendar Integration](https://docs.composio.dev/integrations/googlecalendar)
- [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)

## 🎯 Próximos Passos

Após a configuração completa, você pode:

1. Testar diferentes cenários de agendamento
2. Adicionar mais ações (ex: deletar eventos com confirmação)
3. Implementar lembretes automáticos
4. Integrar com outros serviços do Google (Gmail, Drive, etc.)
