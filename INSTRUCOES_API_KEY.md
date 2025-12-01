# 🔑 Configuração de API Key por Usuário

## ✅ Mudanças Implementadas

O sistema agora permite que **cada usuário configure sua própria API Key do Google Gemini** ao invés de usar uma chave global no backend.

---

## 📋 Como Usar

### **1. Obter sua API Key do Google Gemini**

1. Acesse: [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada (começa com `AIza...`)

### **2. Conectar o WhatsApp**

1. Abra o frontend: `http://localhost:5173`
2. Clique em **"Nova Instância"**
3. Clique em **"Conectar"**
4. Insira seu número de telefone (ex: `5516982007961`)
5. Digite o **Pairing Code** que aparecer no WhatsApp do celular
6. Aguarde a conexão (até 60 segundos)

### **3. Configurar o Agente com sua API Key**

1. Após conectar, clique em **"Configurar Agente"**
2. No campo **"API Key do Google Gemini"**, cole sua chave
3. Configure o **Prompt do Sistema** (opcional)
4. Ative o **TTS** se desejar respostas em áudio (opcional)
5. Clique em **"Salvar Alterações"**

### **4. Testar o Bot**

1. Envie uma mensagem para o número do WhatsApp conectado
2. O bot deve responder usando sua API Key configurada
3. Verifique os logs do backend para confirmar

---

## 🔍 Verificação

### **No Frontend:**
- O campo de API Key deve estar visível no modal de configuração
- A validação deve exigir que a API Key seja preenchida
- Após salvar, deve aparecer "Assistente IA Configurado"

### **No Backend:**
- Verifique os logs: `API Key configurada: Sim`
- A configuração deve ser salva em: `backend/sessions/instance_XXXXX/config.json`

### **Teste de Mensagem:**
1. Envie uma mensagem de teste para o WhatsApp
2. O bot deve responder usando sua API Key
3. Se houver erro de API Key inválida, verifique se copiou corretamente

---

## 🚨 Solução de Problemas

### **Erro: "API Key obrigatória"**
- Certifique-se de preencher o campo de API Key no modal
- A chave deve começar com `AIza...`

### **Erro: "Invalid API Key"**
- Verifique se a chave foi copiada corretamente (sem espaços)
- Confirme que a chave está ativa no Google AI Studio
- Tente gerar uma nova chave

### **Bot não responde**
1. Verifique se a instância está conectada (badge verde)
2. Confirme que o agente está configurado (ícone de robô verde)
3. Verifique os logs do backend para erros
4. Teste com uma mensagem simples como "Olá"

---

## 📝 Notas Importantes

- ✅ **Cada instância** pode ter sua própria API Key
- ✅ **Segurança**: As API Keys são armazenadas localmente no servidor
- ✅ **Fallback**: Se não configurar API Key, o sistema usa a do `.env` (se existir)
- ✅ **Persistência**: A configuração é salva em disco e restaurada após reiniciar

---

## 🎯 Próximos Passos

1. **Teste a conexão** do WhatsApp
2. **Configure sua API Key** no modal
3. **Envie mensagens** de teste
4. **Monitore os logs** para verificar se está funcionando

Qualquer dúvida, verifique os logs do backend! 🚀
