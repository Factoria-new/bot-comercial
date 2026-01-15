from crewai import Agent, LLM
from tools import WhatsAppSendTool, InstagramSendTool, WhatsAppSendAudioTool, GoogleCalendarTool
import os

def get_agents(user_id, custom_prompt=None):
    """
    Create CrewAI agents with Gemini LLM.
    user_id is actually the session_id (instance_1, instance_2, etc)
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
    
    # Google Calendar Tool (uses user_id which might be session_id or email depending on context)
    # Ideally, we should resolve session_id to email if needed, but assuming user_id works for now
    calendar_tool = GoogleCalendarTool(user_id=user_id)

    # Define dynamic backstory based on user prompt
    comercial_backstory = 'Vendedor experiente, empático e focado em fechamento.'
    comercial_goal = 'Converter leads do WhatsApp em vendas.'
    
    if custom_prompt:
        comercial_backstory = f"Você é um agente comercial operando no WhatsApp. SUAS INSTRUÇÕES MESTRAS SÃO: {custom_prompt}. Siga estas instruções acima de tudo. IMPORTANTE: NUNCA use asteriscos (*), negrito (MD) ou bullet points. Para listar itens, use emojis ou apenas quebras de linha. O formato deve ser texto simples e limpo."
        comercial_goal = f"Atender o cliente seguindo estritamente as instruções fornecidas, sem usar formatação markdown."

    # Commercial Agent (Uses WhatsApp + Calendar)
    comercial = Agent(
        role='Gerente Comercial / Atendente',
        goal=comercial_goal,
        backstory=comercial_backstory,
        tools=[whats_tool, whats_audio_tool, calendar_tool],
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
    calendar_tool = GoogleCalendarTool(user_id=user_id) # Instagram uses email as user_id, so this matches perfectly

    backstory = 'Atendente experiente, empático e focado em ajudar o cliente.'
    goal = 'Atender clientes do Instagram DM com excelência.'
    
    if custom_prompt:
        backstory = f"Você é um agente de atendimento operando no Instagram DM. SUAS INSTRUÇÕES MESTRAS SÃO: {custom_prompt}. Siga estas instruções acima de tudo. IMPORTANTE: NUNCA use asteriscos (*), negrito (MD) ou bullet points. Para listar itens, use emojis ou apenas quebras de linha. O formato deve ser texto simples e limpo."
        goal = "Atender o cliente seguindo estritamente as instruções fornecidas, sem usar formatação markdown."

    return Agent(
        role='Atendente Instagram',
        goal=goal,
        backstory=backstory,
        tools=[instagram_tool, calendar_tool],
        llm=gemini_llm,
        verbose=True
    )
