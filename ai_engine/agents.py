from crewai import Agent
from composio import Composio
from composio_crewai import CrewAIProvider
from tools import WhatsAppSendTool
from langchain_google_genai import ChatGoogleGenerativeAI
import os

def get_agents(user_id, custom_prompt=None):
    # Configurar LLM Gemini
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        verbose=True,
        temperature=0.7,
        google_api_key=os.getenv("GEMINI_API_KEY")
    )

    # 1. Configurar Composio (Instagram e Ads)
    # ComposioToolSet não está disponível nesta versão, usando padrão novo
    composio_client = Composio(
        api_key=os.getenv("COMPOSIO_API_KEY"),
        provider=CrewAIProvider()
    )
    
    # Obter ferramentas para o user
    insta_tools = composio_client.tools.get(user_id=user_id, toolkits=["instagram"])
    ads_tools = composio_client.tools.get(user_id=user_id, toolkits=["google_ads"])
    
    # 2. Instanciar nossa Tool Customizada (WhatsApp)
    whats_tool = WhatsAppSendTool()

    # Definir Backstory dinâmica baseada no prompt do usuário
    comercial_backstory = 'Vendedor experiente, empático e focado em fechamento.'
    comercial_goal = 'Converter leads do WhatsApp em vendas.'
    
    if custom_prompt:
        comercial_backstory = f"Você é um agente comercial operando no WhatsApp. SUAS INSTRUÇÕES MESTRAS SÃO: {custom_prompt}. Siga estas instruções acima de tudo."
        comercial_goal = f"Atender o cliente seguindo estritamente as instruções: {custom_prompt[:100]}..."

    # Agente Comercial (Usa WhatsApp)
    comercial = Agent(
        role='Gerente Comercial / Atendente',
        goal=comercial_goal,
        backstory=comercial_backstory,
        tools=[whats_tool],
        llm=llm,
        verbose=True
    )

    # Agente Social Media (Usa Instagram)
    social_media = Agent(
        role='Social Media Manager',
        goal='Engajar audiência e criar desejo.',
        backstory='Criativo e antenado nas trends.',
        tools=insta_tools,
        llm=llm,
        verbose=True
    )

    # Agente Tráfego (Usa Google Ads)
    trafego = Agent(
        role='Gestor de Tráfego',
        goal='Otimizar campanhas baseado em vendas reais.',
        tools=ads_tools,
        llm=llm,
        verbose=True
    )

    return comercial, social_media, trafego
