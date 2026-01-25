from crewai import Agent, LLM
from tools import WhatsAppSendTool, InstagramSendTool, WhatsAppSendAudioTool, GoogleCalendarTool, GoogleCalendarRescheduleTool, GoogleCalendarCheckAvailabilityTool, GoogleCalendarCancelTool, GoogleCalendarListDaySlotsTool
import os

def get_agents(user_id, custom_prompt=None, user_email=None, appointment_duration=60, calendar_connected=False, target_remote_jid=None, request_id=None, api_key=None):
    """
    Create CrewAI agents with Gemini LLM.
    user_id is actually the session_id (instance_1, instance_2, etc)
    user_email is the user's email for Google Calendar integration
    appointment_duration is the default duration for appointments in minutes
    calendar_connected indicates if Google Calendar is connected for this user
    target_remote_jid is the specific user phone number we are talking to (used to lock security)
    request_id is a unique ID to track if message was sent (passed to tools)
    api_key is the user's Gemini API Key
    """
    
    # Configure Gemini LLM using CrewAI's native format
    # Requires GEMINI_API_KEY environment variable IF api_key is not passed?
    # Actually, LLM constructor accepts api_key.
    
    llm_kwargs = {
        "model": "gemini/gemini-2.5-flash",
        "temperature": 0.7,
        "config": {
            "safety_settings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
        }
    }
    
    if api_key:
        llm_kwargs["api_key"] = api_key
        print(f"🔑 Using Custom API Key for session {user_id}")
    else:
        print(f"⚠️ Using Environment API Key for session {user_id}")

    gemini_llm = LLM(**llm_kwargs)
    
    # WhatsApp Tool with correct session_id and locked recipient
    whats_tool = WhatsAppSendTool(session_id=user_id, default_recipient=target_remote_jid, request_id=request_id)
    whats_audio_tool = WhatsAppSendAudioTool(session_id=user_id, default_recipient=target_remote_jid, request_id=request_id)
    
    # Google Calendar Tools - uses user's email for Composio connection
    # Pass appointment_duration for scheduling
    calendar_tool = GoogleCalendarTool(user_id=user_email or user_id, appointment_duration=appointment_duration)
    reschedule_tool = GoogleCalendarRescheduleTool(user_id=user_email or user_id, appointment_duration=appointment_duration)
    availability_tool = GoogleCalendarCheckAvailabilityTool(user_id=user_email or user_id)
    cancel_tool = GoogleCalendarCancelTool(user_id=user_email or user_id)
    list_slots_tool = GoogleCalendarListDaySlotsTool(user_id=user_email or user_id)

    # Define dynamic backstory based on user prompt
    comercial_backstory = 'Vendedor experiente, empático e focado em fechamento.'
    comercial_goal = 'Converter leads do WhatsApp em vendas.'
    
    # Scheduling instructions to append to backstory
    scheduling_instructions = """

⚠️ IMPORTANTE: NUNCA escreva código JSON ou tool_code. EXECUTE as ferramentas diretamente!

REGRAS DE COMUNICAÇÃO (CHAT):
1. SEMPRE RESPONDA: Nunca fique em silêncio.
2. QUEBRA DE GELO: Se o cliente enviar risadas ("kkkk", "haha"), emojis ou mensagens casuais, RESPONDA com simpatia, emojis e tente engajar.
   - Exemplo: "kkkk 😄 Posso te ajudar com o agendamento?"
   - Exemplo: "Olá! Tudo bem? 😊"
3. NÃO IGNORE: Mesmo mensagens curtas devem ter resposta.

REGRAS DE AGENDAMENTO:

1. VERIFICAR: Antes de confirmar horário, use 'Verificar Disponibilidade'.

2. CONFIRMAR DADOS: Se disponível, envie por WhatsApp um resumo com: Tipo (Presencial/Online), Data, Horário, Serviço, Nome, E-mail, Local. Pergunte se pode confirmar.
   - ⚠️ DADOS REAIS: Se faltar qualquer dado (Nome, Email, etc), PERGUNTE ao cliente.
   - 🚫 ALUCINAÇÃO ZERO: NUNCA invente dados, nunca use placeholders e NUNCA use o e-mail como nome.

3. AGENDAR: Só use 'Agendar Compromisso' APÓS o cliente confirmar "sim".

REGRAS DE REAGENDAMENTO:
1. Use 'Reagendar Compromisso' passando APENAS email e nova data.
2. Se a ferramenta retornar uma LISTA numerada:
   - APRESENTE a lista para o cliente.
   - PERGUNTE qual número ele quer.
   - AGUARDE a resposta.
3. Quando o cliente responder o número:
   - Use 'Reagendar Compromisso' novamente passando 'event_index'.
   - NUNCA assuma que reagendou se a ferramenta pediu para selecionar.

REGRAS DE CANCELAMENTO:
1. Use 'Cancelar Agendamento' passando o email do cliente.
2. Se houver múltiplos agendamentos, PERGUNTE qual número quer cancelar.
3. SEMPRE peça confirmação antes de cancelar definitivamente.
4. Após confirmação, chame a ferramenta com 'confirmed=True'.
"""
    
    if custom_prompt:
        comercial_backstory = f"Você é um agente comercial operando no WhatsApp. SUAS INSTRUÇÕES MESTRAS SÃO: {custom_prompt}. Siga estas instruções acima de tudo. IMPORTANTE: NUNCA use asteriscos (*), negrito (MD) ou bullet points. Para listar itens, use emojis ou apenas quebras de linha. O formato deve ser texto simples e limpo.{scheduling_instructions}"
        comercial_goal = f"Atender o cliente seguindo estritamente as instruções fornecidas, sem usar formatação markdown."

    # Build tools list - only include calendar tools if Google Calendar is connected
    agent_tools = [whats_tool, whats_audio_tool]
    
    if calendar_connected:
        agent_tools.extend([calendar_tool, reschedule_tool, availability_tool, cancel_tool, list_slots_tool])
        print(f"📅 Calendar tools ENABLED for this agent")
    else:
        print(f"⚠️ Calendar tools DISABLED (Google Calendar not connected)")

    # Commercial Agent (Uses WhatsApp + Calendar if connected)
    comercial = Agent(
        role='Gerente Comercial / Atendente',
        goal=comercial_goal,
        backstory=comercial_backstory,
        tools=agent_tools,
        llm=gemini_llm,
        verbose=True
    )

    # Social Media Agent (simplified - no Composio for now)
    social_media = Agent(
        role='Social Media Manager',
        goal='Engajar audiência e criar desejo.',
        backstory='Criativo e antenado nas trends.',
        tools=[],  # No tools for now
        llm=gemini_llm,
        verbose=True
    )

    # Traffic Agent (simplified - no Google Ads for now)
    trafego = Agent(
        role='Gestor de Tráfego',
        goal='Otimizar campanhas baseado em vendas reais.',
        backstory='Especialista em mídia paga e otimização de ROI.',
        tools=[],  # No tools for now
        llm=gemini_llm,
        verbose=True
    )

    return comercial, social_media, trafego


def get_instagram_agent(user_id, custom_prompt=None, target_recipient_id=None, request_id=None):
    """
    Create a single agent for Instagram DM responses.
    user_id is the user's email (connected account owner)
    target_recipient_id is the customer ID to lock the tool to
    request_id is a unique ID to track if message was sent
    """
    
    gemini_llm = LLM(
        model="gemini/gemini-2.5-flash",
        temperature=0.7,
        config={
            "safety_settings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
        }
    )
    
    # LLM separado para function calling
    function_calling_llm = LLM(
        model="gemini/gemini-2.5-flash",
        temperature=0.1,
        config={
            "safety_settings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
        }
    )

    instagram_tool = InstagramSendTool(user_id=user_id, default_recipient=target_recipient_id, request_id=request_id)
    calendar_tool = GoogleCalendarTool(user_id=user_id)
    reschedule_tool = GoogleCalendarRescheduleTool(user_id=user_id)
    availability_tool = GoogleCalendarCheckAvailabilityTool(user_id=user_id)
    list_slots_tool = GoogleCalendarListDaySlotsTool(user_id=user_id)

    backstory = 'Atendente experiente, empático e focado em ajudar o cliente.'
    goal = 'Atender clientes do Instagram DM com excelência.'
    
    # Scheduling instructions to append to backstory
    scheduling_instructions = """

⚠️ IMPORTANTE: NUNCA escreva código JSON ou tool_code. EXECUTE as ferramentas diretamente!

REGRAS DE COMUNICAÇÃO (CHAT):
1. SEMPRE RESPONDA: Nunca fique em silêncio.
2. QUEBRA DE GELO: Se o cliente enviar risadas ("kkkk", "haha"), emojis ou mensagens casuais, RESPONDA com simpatia, emojis e tente engajar.
   - Exemplo: "kkkk 😄 Posso te ajudar com o agendamento?"
   - Exemplo: "Olá! Tudo bem? 😊"
3. NÃO IGNORE: Mesmo mensagens curtas devem ter resposta.

REGRAS DE AGENDAMENTO:

1. VERIFICAR: Antes de confirmar horário, use 'Verificar Disponibilidade'.

2. CONFIRMAR DADOS: Se disponível, envie um resumo com: Tipo (Presencial/Online), Data, Horário, Serviço, Nome, E-mail, Local. Pergunte se pode confirmar.

3. AGENDAR: Só use 'Agendar Compromisso' APÓS o cliente confirmar "sim".

REAGENDAMENTO:
- Use 'Reagendar Compromisso' com email e nova data.
- Se retornar lista, pergunte qual número e confirme dados antes de reagendar.
"""
    
    if custom_prompt:
        backstory = f"Você é um agente de atendimento operando no Instagram DM. SUAS INSTRUÇÕES MESTRAS SÃO: {custom_prompt}. Siga estas instruções acima de tudo. IMPORTANTE: NUNCA use asteriscos (*), negrito (MD) ou bullet points. Para listar itens, use emojis ou apenas quebras de linha. O formato deve ser texto simples e limpo.{scheduling_instructions}"
        goal = "Atender o cliente seguindo estritamente as instruções fornecidas, sem usar formatação markdown."

    return Agent(
        role='Atendente Instagram',
        goal=goal,
        backstory=backstory,
        tools=[instagram_tool, calendar_tool, reschedule_tool, availability_tool, list_slots_tool],
        llm=gemini_llm,
        function_calling_llm=function_calling_llm,
        verbose=True
    )
