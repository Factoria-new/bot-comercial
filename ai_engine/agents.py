from crewai import Agent, LLM
from tools import WhatsAppSendTool, InstagramSendTool, WhatsAppSendAudioTool, GoogleCalendarTool, GoogleCalendarRescheduleTool, GoogleCalendarCheckAvailabilityTool
import os

def get_agents(user_id, custom_prompt=None, user_email=None):
    """
    Create CrewAI agents with Gemini LLM.
    user_id is actually the session_id (instance_1, instance_2, etc)
    user_email is the user's email for Google Calendar integration
    """
    
    # Configure Gemini LLM using CrewAI's native format
    # Requires GEMINI_API_KEY environment variable
    gemini_llm = LLM(
        model="gemini/gemini-3-flash-preview",  # Corrected to preview ID
        temperature=0.7
    )

    # WhatsApp Tool with correct session_id
    whats_tool = WhatsAppSendTool(session_id=user_id)
    whats_audio_tool = WhatsAppSendAudioTool(session_id=user_id)
    
    # Google Calendar Tools - uses user's email for Composio connection
    calendar_tool = GoogleCalendarTool(user_id=user_email or user_id)
    reschedule_tool = GoogleCalendarRescheduleTool(user_id=user_email or user_id)
    availability_tool = GoogleCalendarCheckAvailabilityTool(user_id=user_email or user_id)

    # Define dynamic backstory based on user prompt
    comercial_backstory = 'Vendedor experiente, empático e focado em fechamento.'
    comercial_goal = 'Converter leads do WhatsApp em vendas.'
    
    # Scheduling instructions to append to backstory
    scheduling_instructions = """

REGRAS CRÍTICAS DE AGENDAMENTO (SIGA RIGOROSAMENTE):

PASSO 1: VERIFICAR
Antes de sugerir ou confirmar qualquer horário, você DEVE usar a ferramenta 'Verificar Disponibilidade'.
- Se o cliente perguntar "Tem horário dia 20?", use a ferramenta.
- Se o cliente disser "Pode ser dia 20 às 15h?", use a ferramenta.
- NUNCA invente que está livre sem checar.

PASSO 2: CONFIRMAR
Se a ferramenta disser que está DISPONÍVEL, você NÃO deve agendar ainda.
Você deve enviar uma mensagem de confirmação para o cliente:
"O horário de [Data] às [Hora] está disponível. Posso confirmar o agendamento?"

PASSO 3: AGENDAR
SOMENTE após o cliente responder "Sim" ou "Pode marcar", use a ferramenta 'Agendar Compromisso'.
- Se a ferramenta retornar sucesso, envie a confirmação final.
- Se a ferramenta falhar, explique o motivo real retornado pela ferramenta.

REGRAS DE REAGENDAMENTO:
1. Use 'Reagendar Compromisso' passando APENAS email e nova data.
2. Se a ferramenta retornar uma LISTA numerada:
   - APRESENTE a lista para o cliente.
   - PERGUNTE qual número ele quer.
   - AGUARDE a resposta.
3. Quando o cliente responder o número:
   - Use 'Reagendar Compromisso' novamente passando 'event_index'.
   - NUNCA assuma que reagendou se a ferramenta pediu para selecionar.
"""
    
    if custom_prompt:
        comercial_backstory = f"Você é um agente comercial operando no WhatsApp. SUAS INSTRUÇÕES MESTRAS SÃO: {custom_prompt}. Siga estas instruções acima de tudo. IMPORTANTE: NUNCA use asteriscos (*), negrito (MD) ou bullet points. Para listar itens, use emojis ou apenas quebras de linha. O formato deve ser texto simples e limpo.{scheduling_instructions}"
        comercial_goal = f"Atender o cliente seguindo estritamente as instruções fornecidas, sem usar formatação markdown."

    # Commercial Agent (Uses WhatsApp + Calendar)
    comercial = Agent(
        role='Gerente Comercial / Atendente',
        goal=comercial_goal,
        backstory=comercial_backstory,
        tools=[whats_tool, whats_audio_tool, calendar_tool, reschedule_tool, availability_tool],
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


def get_instagram_agent(user_id, custom_prompt=None):
    """
    Create a single agent for Instagram DM responses.
    user_id is the user's email (connected account owner)
    """
    
    gemini_llm = LLM(
        model="gemini/gemini-3-flash-preview",
        temperature=0.7
    )

    instagram_tool = InstagramSendTool(user_id=user_id)
    calendar_tool = GoogleCalendarTool(user_id=user_id)
    reschedule_tool = GoogleCalendarRescheduleTool(user_id=user_id)
    availability_tool = GoogleCalendarCheckAvailabilityTool(user_id=user_id)

    backstory = 'Atendente experiente, empático e focado em ajudar o cliente.'
    goal = 'Atender clientes do Instagram DM com excelência.'
    
    # Scheduling instructions to append to backstory
    scheduling_instructions = """

REGRAS CRÍTICAS DE AGENDAMENTO (SIGA RIGOROSAMENTE):

PASSO 1: VERIFICAR
Antes de sugerir ou confirmar qualquer horário, você DEVE usar a ferramenta 'Verificar Disponibilidade'.
- Se o cliente perguntar "Tem horário dia 20?", use a ferramenta.
- Se o cliente disser "Pode ser dia 20 às 15h?", use a ferramenta.
- NUNCA invente que está livre sem checar.

PASSO 2: CONFIRMAR
Se a ferramenta disser que está DISPONÍVEL, você NÃO deve agendar ainda.
Você deve enviar uma mensagem de confirmação para o cliente:
"O horário de [Data] às [Hora] está disponível. Posso confirmar o agendamento?"

PASSO 3: AGENDAR
SOMENTE após o cliente responder "Sim" ou "Pode marcar", use a ferramenta 'Agendar Compromisso'.
- Se a ferramenta retornar sucesso, envie a confirmação final.
- Se a ferramenta falhar, explique o motivo real retornado pela ferramenta.

REGRAS DE REAGENDAMENTO:
1. Use 'Reagendar Compromisso' passando APENAS email e nova data.
2. Se a ferramenta retornar uma LISTA numerada:
   - APRESENTE a lista para o cliente.
   - PERGUNTE qual número ele quer.
   - AGUARDE a resposta.
3. Quando o cliente responder o número:
   - Use 'Reagendar Compromisso' novamente passando 'event_index'.
   - NUNCA assuma que reagendou se a ferramenta pediu para selecionar.
"""
    
    if custom_prompt:
        backstory = f"Você é um agente de atendimento operando no Instagram DM. SUAS INSTRUÇÕES MESTRAS SÃO: {custom_prompt}. Siga estas instruções acima de tudo. IMPORTANTE: NUNCA use asteriscos (*), negrito (MD) ou bullet points. Para listar itens, use emojis ou apenas quebras de linha. O formato deve ser texto simples e limpo.{scheduling_instructions}"
        goal = "Atender o cliente seguindo estritamente as instruções fornecidas, sem usar formatação markdown."

    return Agent(
        role='Atendente Instagram',
        goal=goal,
        backstory=backstory,
        tools=[instagram_tool, calendar_tool, reschedule_tool, availability_tool],
        llm=gemini_llm,
        verbose=True
    )

    """
    Create CrewAI agents with Gemini LLM.
    user_id is actually the session_id (instance_1, instance_2, etc)
    user_email is the user's email for Google Calendar integration
    """
    
    # Configure Gemini LLM using CrewAI's native format
    # Requires GEMINI_API_KEY environment variable
    # Configure Gemini LLM using CrewAI's native format
    # Requires GEMINI_API_KEY environment variable
    # Configure Gemini LLM using CrewAI's native format
    # Requires GEMINI_API_KEY environment variable
    # Configure Gemini LLM using CrewAI's native format
    # Requires GEMINI_API_KEY environment variable
    gemini_llm = LLM(
        model="gemini/gemini-3-flash-preview",  # Corrected to preview ID
        temperature=0.7
    )

    # WhatsApp Tool with correct session_id
    whats_tool = WhatsAppSendTool(session_id=user_id)
    whats_audio_tool = WhatsAppSendAudioTool(session_id=user_id)
    
    # Google Calendar Tools - uses user's email for Composio connection
    calendar_tool = GoogleCalendarTool(user_id=user_email or user_id)
    reschedule_tool = GoogleCalendarRescheduleTool(user_id=user_email or user_id)

    # Define dynamic backstory based on user prompt
    comercial_backstory = 'Vendedor experiente, empático e focado em fechamento.'
    comercial_goal = 'Converter leads do WhatsApp em vendas.'
    
    # Scheduling instructions to append to backstory
    scheduling_instructions = """

REGRAS DE AGENDAMENTO:
Quando o cliente quiser agendar algo, siga este fluxo:
1. Pergunte qual data e horário ele prefere
2. Pergunte o nome completo e e-mail dele
3. Use a ferramenta 'Agendar Compromisso' com todas as informações
4. Se o horário não estiver disponível, apresente as 3 sugestões próximas de forma amigável
5. Se estiver fora do horário de funcionamento, mostre os horários de funcionamento do estabelecimento
6. Quando o agendamento for confirmado, envie o link do Google Meet ou o endereço conforme apropriado

REGRAS DE REAGENDAMENTO:
Quando o cliente quiser MUDAR a data/hora de um agendamento existente:
1. Confirme que é um reagendamento (não um novo agendamento)
2. Pergunte o e-mail que foi usado no agendamento original
3. Pergunte a nova data e hora desejada
4. Use a ferramenta 'Reagendar Compromisso' - ela irá ATUALIZAR o evento existente (não criar um novo)
5. Se houver mais de um agendamento para o e-mail, confirme qual deve ser alterado
"""
    
    if custom_prompt:
        comercial_backstory = f"Você é um agente comercial operando no WhatsApp. SUAS INSTRUÇÕES MESTRAS SÃO: {custom_prompt}. Siga estas instruções acima de tudo. IMPORTANTE: NUNCA use asteriscos (*), negrito (MD) ou bullet points. Para listar itens, use emojis ou apenas quebras de linha. O formato deve ser texto simples e limpo.{scheduling_instructions}"
        comercial_goal = f"Atender o cliente seguindo estritamente as instruções fornecidas, sem usar formatação markdown."

    # Commercial Agent (Uses WhatsApp + Calendar)
    comercial = Agent(
        role='Gerente Comercial / Atendente',
        goal=comercial_goal,
        backstory=comercial_backstory,
        tools=[whats_tool, whats_audio_tool, calendar_tool, reschedule_tool],
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


def get_instagram_agent(user_id, custom_prompt=None):
    """
    Create a single agent for Instagram DM responses.
    user_id is the user's email (connected account owner)
    """
    
    gemini_llm = LLM(
        model="gemini/gemini-3-flash-preview",
        temperature=0.7
    )

    instagram_tool = InstagramSendTool(user_id=user_id)
    calendar_tool = GoogleCalendarTool(user_id=user_id)
    reschedule_tool = GoogleCalendarRescheduleTool(user_id=user_id)

    backstory = 'Atendente experiente, empático e focado em ajudar o cliente.'
    goal = 'Atender clientes do Instagram DM com excelência.'
    
    # Scheduling instructions to append to backstory
    scheduling_instructions = """

REGRAS DE AGENDAMENTO:
Quando o cliente quiser agendar algo, siga este fluxo:
1. Pergunte qual data e horário ele prefere
2. Pergunte o nome completo e e-mail dele
3. Use a ferramenta 'Agendar Compromisso' com todas as informações
4. Se o horário não estiver disponível, apresente as 3 sugestões próximas de forma amigável
5. Se estiver fora do horário de funcionamento, mostre os horários de funcionamento do estabelecimento
6. Quando o agendamento for confirmado, envie o link do Google Meet ou o endereço conforme apropriado

REGRAS DE REAGENDAMENTO:
Quando o cliente quiser MUDAR a data/hora de um agendamento existente:
1. Confirme que é um reagendamento (não um novo agendamento)
2. Pergunte o e-mail que foi usado no agendamento original
3. Pergunte a nova data e hora desejada
4. Use a ferramenta 'Reagendar Compromisso'
5. Se houver mais de um agendamento para o e-mail, confirme qual deve ser alterado
"""
    
    if custom_prompt:
        backstory = f"Você é um agente de atendimento operando no Instagram DM. SUAS INSTRUÇÕES MESTRAS SÃO: {custom_prompt}. Siga estas instruções acima de tudo. IMPORTANTE: NUNCA use asteriscos (*), negrito (MD) ou bullet points. Para listar itens, use emojis ou apenas quebras de linha. O formato deve ser texto simples e limpo.{scheduling_instructions}"
        goal = "Atender o cliente seguindo estritamente as instruções fornecidas, sem usar formatação markdown."

    return Agent(
        role='Atendente Instagram',
        goal=goal,
        backstory=backstory,
        tools=[instagram_tool, calendar_tool, reschedule_tool],
        llm=gemini_llm,
        verbose=True
    )
