from crewai import Agent, LLM
from tools import WhatsAppSendTool
import os

def get_agents(user_id, custom_prompt=None):
    """
    Create CrewAI agents with Gemini LLM.
    user_id is actually the session_id (instance_1, instance_2, etc)
    """
    
    # Configure Gemini LLM using CrewAI's native format
    # Requires GEMINI_API_KEY environment variable
    gemini_llm = LLM(
        model="gemini/gemini-2.0-flash-exp",  # Same model used in backend
        temperature=0.7
    )

    # WhatsApp Tool with correct session_id
    whats_tool = WhatsAppSendTool(session_id=user_id)

    # Define dynamic backstory based on user prompt
    comercial_backstory = 'Vendedor experiente, empático e focado em fechamento.'
    comercial_goal = 'Converter leads do WhatsApp em vendas.'
    
    if custom_prompt:
        comercial_backstory = f"Você é um agente comercial operando no WhatsApp. SUAS INSTRUÇÕES MESTRAS SÃO: {custom_prompt}. Siga estas instruções acima de tudo."
        comercial_goal = f"Atender o cliente seguindo estritamente as instruções fornecidas."

    # Commercial Agent (Uses WhatsApp)
    comercial = Agent(
        role='Gerente Comercial / Atendente',
        goal=comercial_goal,
        backstory=comercial_backstory,
        tools=[whats_tool],
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
