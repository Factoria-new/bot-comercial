from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import traceback
import time
import random
import asyncio
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

app = FastAPI()

class HistoryItem(BaseModel):
    role: str
    content: str

class MessageInput(BaseModel):
    userId: str
    remoteJid: str
    message: str
    agentPrompt: Optional[str] = None
    history: Optional[List[HistoryItem]] = None
    userEmail: Optional[str] = None  # Email do usuário para Google Calendar
    appointmentDuration: Optional[int] = 60  # Duração padrão dos agendamentos em minutos
    serviceType: Optional[str] = "online"  # "online" ou "presencial"
    businessAddress: Optional[str] = None  # Endereço do estabelecimento
    calendarConnected: Optional[bool] = False  # Se o Google Calendar está conectado

class InstagramMessageInput(BaseModel):
    userId: str  # User's email
    senderId: str  # Instagram user ID who sent the message
    message: str
    agentPrompt: Optional[str] = None
    history: Optional[List[HistoryItem]] = None


def format_history(history: Optional[List[HistoryItem]]) -> str:
    if not history:
        return "Nenhum histórico disponível."
    
    formatted = []
    for item in history:
        role_pt = "Atendente" if item.role in ["assistant", "model"] else "Cliente"
        formatted.append(f"{role_pt}: {item.content}")
    
    # Pegar as últimas 40 mensagens para manter contexto robusto (Gemini aguenta muito mais)
    return "\n".join(formatted[-30:])


def get_calendar_tools_description(calendar_connected: bool, current_year: int) -> str:
    """Returns calendar tools description if connected, otherwise a warning message."""
    if not calendar_connected:
        return """
⚠️ AGENDAMENTO NÃO DISPONÍVEL
O Google Calendar não está conectado. Você NÃO possui ferramentas de agendamento.
Se o cliente solicitar agendamento, informe que no momento não é possível agendar
pelo WhatsApp e peça para entrar em contato por outro canal.
"""
    
    return f"""
2. 'Verificar Disponibilidade' [⚠️ OBRIGATÓRIO ANTES DE AGENDAR]
   🔍 Use ANTES de confirmar qualquer horário
   Parâmetros:
   - requested_date: data no formato YYYY-MM-DD (ex: {current_year}-01-22)
   - requested_time: hora no formato HH:mm (ex: 14:00)
   
   QUANDO USAR:
   - Cliente pergunta "tem horário dia X às Y?"
   - Cliente sugere um horário para agendar
   - SEMPRE antes de usar 'Agendar Compromisso'

3. 'Agendar Compromisso'
   📅 Use quando o cliente CONFIRMAR que deseja agendar
   ⚠️ ANTES: sempre use 'Verificar Disponibilidade'
   Parâmetros:
   - customer_name: nome do cliente
   - customer_email: e-mail do cliente
   - start_datetime: início (ISO: {current_year}-01-22T14:00:00)
   - end_datetime: fim (ISO: {current_year}-01-22T15:00:00)
   - description: descrição (opcional)

4. 'Reagendar Compromisso'
   🔄 Use quando o cliente quiser MUDAR data/hora de um agendamento
   Parâmetros:
   - customer_email: e-mail usado no agendamento original
   - new_start_datetime: nova data/hora (ISO: {current_year}-01-25T10:00:00)
   - event_index: número do evento (só usar após cliente escolher da lista)
   
   FLUXO:
   a) Primeira chamada: só customer_email e new_start_datetime
   b) Se retornar lista, pergunte ao cliente qual número
   c) Segunda chamada: inclua event_index com o número escolhido

5. 'Cancelar Agendamento'
   ❌ Use quando o cliente quiser CANCELAR um agendamento
   Parâmetros:
   - customer_email: e-mail usado no agendamento
   - event_index: número do evento (só usar após cliente escolher da lista)
   
   FLUXO:
   a) Primeira chamada: só customer_email
   b) Se retornar lista, pergunte ao cliente qual número
   c) Confirme com o cliente antes de cancelar definitivamente
   d) Segunda chamada: inclua event_index com o número escolhido
"""

# Timeout configuration (in seconds)
CREW_TIMEOUT_SECONDS = 90  # Maximum time to wait for crew.kickoff()

# Thread pool for running synchronous crew operations
_executor = ThreadPoolExecutor(max_workers=4)

async def run_crew_with_timeout(crew, timeout=CREW_TIMEOUT_SECONDS):
    """
    Executa o crew.kickoff() com timeout para evitar travamentos.
    Usa ThreadPoolExecutor para rodar a operação síncrona em thread separada.
    """
    loop = asyncio.get_event_loop()
    
    try:
        print(f"⏱️ Iniciando crew.kickoff() com timeout de {timeout}s...")
        # Run synchronous crew.kickoff() in thread pool with timeout
        result = await asyncio.wait_for(
            loop.run_in_executor(_executor, crew.kickoff),
            timeout=timeout
        )
        print(f"✅ crew.kickoff() completado com sucesso")
        return result
    except asyncio.TimeoutError:
        print(f"❌ TIMEOUT: crew.kickoff() excedeu {timeout}s")
        raise TimeoutError(f"O processamento excedeu o limite de {timeout} segundos. Tente novamente.")

async def run_crew_with_retry(crew, retries=3, delay=2):
    """
    Executa o crew.kickoff() com mecanismo de retry e timeout.
    """
    last_exception = None
    
    for attempt in range(retries):
        try:
            return await run_crew_with_timeout(crew)
        except TimeoutError as e:
            last_exception = e
            if attempt < retries - 1:
                wait_time = delay * (attempt + 1)
                print(f"⚠️ Timeout (Tentativa {attempt+1}/{retries}). Tentando novamente em {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                print(f"❌ Timeout após {retries} tentativas.")
                raise e
        except Exception as e:
            last_exception = e
            error_str = str(e)
            
            # Verificar se é erro 500 ou mensagem de erro interno
            if "500" in error_str or "Internal error" in error_str or "INTERNAL" in error_str:
                wait_time = delay * (attempt + 1) + random.uniform(0, 1)
                print(f"⚠️ Erro 500 detectado (Tentativa {attempt+1}/{retries}). Tentando novamente em {wait_time:.1f}s...")
                await asyncio.sleep(wait_time)
            else:
                # Se não for erro de servidor, falha imediatamente (ex: erro de validação)
                raise e
                
    # Se esgotou tentativas
    print(f"❌ Falha após {retries} tentativas.")
    raise last_exception


@app.post("/webhook/whatsapp")
async def handle_whatsapp_message(data: MessageInput):
    try:
        # Importar aqui para ver erros de import separadamente
        from crewai import Crew, Process, Task
        from agents import get_agents
        
        # Se vier um prompt do Node.js, usamos ele. Se não, usa o default.
        custom_prompt = data.agentPrompt
        
        # Get user email for Google Calendar (falls back to userId if not provided)
        user_email = data.userEmail or data.userId
        
        # Get appointment duration (default to 60 if not provided)
        appointment_duration = data.appointmentDuration or 60
        
        # Check if calendar is connected
        calendar_connected = data.calendarConnected or False
        
        # userId is the session_id (instance_1, etc), userEmail is for Google Calendar
        comercial, social, trafego = get_agents(data.userId, custom_prompt, user_email, appointment_duration, calendar_connected)

        # Get current datetime for context
        now = datetime.now()
        current_date_str = now.strftime('%d/%m/%Y')
        current_time_str = now.strftime('%H:%M')
        current_year = now.year

        # Include remoteJid in task so agent knows where to send response
        task_atendimento = Task(
            description=f"""
📅 DATA E HORA ATUAL: {current_date_str} às {current_time_str} (Ano: {current_year})
⚠️ IMPORTANTE: Quando o cliente mencionar uma data sem ano (ex: "22/01"), assuma o ANO ATUAL ({current_year}) ou o próximo se a data já passou.

O cliente com ID '{data.remoteJid}' enviou a seguinte mensagem: '{data.message}'

Histórico da Conversa:
{format_history(data.history)}

═══════════════════════════════════════════════════════════════
                    FERRAMENTAS DISPONÍVEIS
═══════════════════════════════════════════════════════════════

1. 'Enviar Mensagem WhatsApp'
   📤 Use para responder ao cliente
   Parâmetros:
   - remote_jid: {data.remoteJid}
   - message: sua resposta (texto limpo, sem markdown)

{get_calendar_tools_description(calendar_connected, current_year)}

═══════════════════════════════════════════════════════════════

📍 INFORMAÇÕES DO ESTABELECIMENTO:
- Tipo de Atendimento: {'PRESENCIAL' if data.serviceType == 'presencial' else 'ONLINE (Google Meet)'}
- Endereço: {data.businessAddress if data.businessAddress else 'Não configurado'}
- Duração padrão dos agendamentos: {appointment_duration} minutos

═══════════════════════════════════════════════════════════════
                        INSTRUÇÕES GERAIS
═══════════════════════════════════════════════════════════════

REGRAS BÁSICAS:
- Analise a mensagem e responda seguindo suas instruções
- LEVE EM CONTA O HISTÓRICO ACIMA
- Se você fez uma pergunta, a mensagem atual é provavelmente a resposta
- NUNCA mencione "Factoria", "Factoria IA" ou qualquer coisa relacionada

FLUXO DE CONFIRMAÇÃO DE AGENDAMENTO:
Após verificar disponibilidade e ANTES de agendar, você DEVE enviar um RESUMO para confirmação:

📋 Confirme os dados do agendamento:
- Nome: [nome do cliente]
- E-mail: [email do cliente]
- Serviço: [serviço solicitado]
- Data: [data formatada]
- Horário: [horário]
- Duração: {appointment_duration} minutos
- Local: {'[ENDEREÇO DO ESTABELECIMENTO]' if data.serviceType == 'presencial' else 'Google Meet (link enviado por e-mail)'}

Só use 'Agendar Compromisso' APÓS o cliente confirmar "sim" ou "pode marcar".

APÓS AGENDAR COM SUCESSO:
⚠️ VOCÊ DEVE OBRIGATORIAMENTE usar a ferramenta 'Enviar Mensagem WhatsApp' para confirmar ao cliente!
- Para PRESENCIAL: Informe o endereço completo ({data.businessAddress if data.businessAddress else 'endereço não configurado'})
- Para ONLINE: Informe que o link do Google Meet foi enviado por e-mail
- NUNCA dê uma resposta final sem enviar a mensagem via ferramenta!
            """.strip(),
            expected_output="Mensagem de confirmação enviada ao cliente via ferramenta 'Enviar Mensagem WhatsApp'.",
            agent=comercial
        )

        crew = Crew(
            agents=[comercial, social, trafego],
            tasks=[task_atendimento],
            process=Process.sequential,
            memory=False
        )

        result = await run_crew_with_retry(crew)
        return {"status": "processing", "result": str(result)}
    
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"❌ Error in webhook: {error_msg}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/webhook/instagram")
async def handle_instagram_message(data: InstagramMessageInput):
    try:
        from crewai import Crew, Process, Task
        from agents import get_instagram_agent
        
        comercial = get_instagram_agent(data.userId, data.agentPrompt)

        task_atendimento = Task(
            description=f"""
O cliente do Instagram com ID '{data.senderId}' enviou a seguinte mensagem: '{data.message}'

Histórico da Conversa:
{format_history(data.history)}

IMPORTANTE: Para responder, use a ferramenta 'Enviar Mensagem Instagram' com:
- recipient_id: {data.senderId}
- message: sua resposta

Analise a mensagem e responda de forma adequada seguindo suas instruções, LEVANDO EM CONTA O HISTÓRICO ACIMA.
            """.strip(),
            expected_output="Mensagem Instagram enviada com sucesso ao cliente.",
            agent=comercial
        )

        crew = Crew(
            agents=[comercial],
            tasks=[task_atendimento],
            process=Process.sequential,
            memory=False
        )

        result = await run_crew_with_retry(crew)
        print(f"✅ Instagram message processed for {data.senderId}")
        return {"status": "processing", "result": str(result)}
    
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"❌ Error in Instagram webhook: {error_msg}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(status_code=500, detail=error_msg)


@app.get("/health")
async def health_check():
    return {"status": "ok", "engine": "crewai"}
