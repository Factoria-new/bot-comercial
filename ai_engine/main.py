from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import traceback
import time
import random
import asyncio
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
import requests
import os
import uuid
from tools import TOOLS_USAGE_STATE

# NOTE: load_dotenv() removed - API keys are provided by users via request parameter

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
    serviceType: Optional[str] = "online"  # "online" ou "presencial"
    businessAddress: Optional[str] = None  # Endereço do estabelecimento
    calendarConnected: Optional[bool] = False  # Se o Google Calendar está conectado
    apiKey: Optional[str] = None # User provided API Key

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
            result = await run_crew_with_timeout(crew)
            
            # Check for None or empty response from LLM
            if result is None or (isinstance(result, str) and not result.strip()):
                raise ValueError("Invalid response from LLM call - None or empty")
            
            return result
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
            
            # Verificar se é erro de resposta vazia (transiente)
            if "None or empty" in error_str or "Invalid response from LLM" in error_str:
                wait_time = delay * (attempt + 1) + random.uniform(0.5, 2)
                print(f"⚠️ Resposta vazia do LLM (Tentativa {attempt+1}/{retries}). Tentando novamente em {wait_time:.1f}s...")
                await asyncio.sleep(wait_time)
            # Verificar se é erro 500 ou mensagem de erro interno
            elif "500" in error_str or "Internal error" in error_str or "INTERNAL" in error_str:
                wait_time = delay * (attempt + 1) + random.uniform(0, 1)
                print(f"⚠️ Erro 500 detectado (Tentativa {attempt+1}/{retries}). Tentando novamente em {wait_time:.1f}s...")
                await asyncio.sleep(wait_time)
            # Rate limit errors
            elif "429" in error_str or "quota" in error_str.lower() or "rate" in error_str.lower():
                wait_time = delay * (attempt + 1) * 2 + random.uniform(1, 3)
                print(f"⚠️ Rate limit detectado (Tentativa {attempt+1}/{retries}). Tentando novamente em {wait_time:.1f}s...")
                await asyncio.sleep(wait_time)
            else:
                # Se não for erro de servidor/transiente, falha imediatamente (ex: erro de validação)
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
        
        # Tracker to verify if message was sent via tool
        request_id = str(uuid.uuid4())
        TOOLS_USAGE_STATE[request_id] = {"sent": False}
        
        # userId is the session_id (instance_1, etc), userEmail is for Google Calendar
        comercial, social, trafego = get_agents(
            user_id=data.userId, 
            custom_prompt=custom_prompt, 
            user_email=user_email, 
            appointment_duration=appointment_duration, 
            calendar_connected=calendar_connected,
            target_remote_jid=data.remoteJid,  # SECURITY: Lock tools to this user
            request_id=request_id,             # STATEFUL: Track usage via global state
            api_key=data.apiKey                # Pass custom API Key
        )

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
APÓS SUCESSO:
Use 'Enviar Mensagem WhatsApp' para confirmar ao cliente.
Para PRESENCIAL: informe o endereço ({data.businessAddress if data.businessAddress else 'não configurado'})
Para ONLINE: informe que o link Google Meet foi enviado por e-mail.
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
        
        # --- RETRY LOGIC FOR WHATSAPP ---
        final_answer = str(result)
        
        # ANTI-DUPLICATION: Check if message was already sent before attempting retry
        # This prevents duplicate messages when LLM returns empty but tool already executed
        message_was_sent = TOOLS_USAGE_STATE.get(request_id, {}).get("sent", False)
        
        if message_was_sent:
            # Message was already successfully sent - no retry needed
            print(f"✅ Message already sent for request {request_id}. Skipping retry.")
        elif not final_answer or final_answer.strip() == "" or "None" in final_answer:
            # LLM returned empty/None but message wasn't sent
            print(f"⚠️ LLM returned empty response and message not sent. Cannot retry without content.")
        else:
            # LLM returned content but tool was NOT used - force retry
            print(f"⚠️ Agent finished but 'sent' tracker is False. Retry triggered.")
            print(f"Agent generated text: {final_answer}")
            
            # Before retry, double-check that message wasn't sent between checks
            if TOOLS_USAGE_STATE.get(request_id, {}).get("sent", False):
                print(f"✅ Message was sent during processing. Cancelling retry.")
            else:
                retry_task = Task(
                    description=f"""
🚨 ATENÇÃO: Você gerou uma resposta mas NÃO usou a ferramenta de envio!
Sua tarefa NÃO ESTÁ COMPLETA.

Você DEVE usar a ferramenta 'Enviar Mensagem WhatsApp' agora mesmo.

A mensagem que você gerou foi:
"{final_answer}"

👉 SUA TAREFA AGORA: Use a ferramenta 'Enviar Mensagem WhatsApp' para enviar EXATAMENTE o texto acima para o cliente.
NÃO mude o texto. Apenas envie.
                    """.strip(),
                    expected_output="Confirmação de 'Mensagem enviada com sucesso' vinda da ferramenta.",
                    agent=comercial
                )
                
                crew_retry = Crew(
                   agents=[comercial],
                   tasks=[retry_task],
                   process=Process.sequential,
                   memory=False
                )
                
                print("🔄 Starting RETRY to force message sending...")
                result = await run_crew_with_retry(crew_retry)
                final_answer = str(result)
                print(f"✅ Retry result: {final_answer}")

        return {"status": "success", "result": final_answer}
    
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"❌ Error in webhook: {error_msg}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(status_code=500, detail=error_msg)
    finally:
        # Cleanup global state
        if 'request_id' in locals():
            TOOLS_USAGE_STATE.pop(request_id, None)


@app.post("/webhook/instagram")
async def handle_instagram_message(data: InstagramMessageInput):
    try:
        from crewai import Crew, Process, Task
        from agents import get_instagram_agent
        
        # Tracker
        request_id = str(uuid.uuid4())
        TOOLS_USAGE_STATE[request_id] = {"sent": False}

        comercial = get_instagram_agent(
            user_id=data.userId, 
            custom_prompt=data.agentPrompt,
            target_recipient_id=data.senderId,  # SECURITY: Lock tools to this user
            request_id=request_id               # STATEFUL: Track usage via global state
        )

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
        
        # --- RETRY LOGIC FOR INSTAGRAM ---
        final_answer = str(result)
        
        if not message_tracker.get("sent"):
             print(f"⚠️ Agent finished but 'sent' tracker (Instagram) is False. Retry triggered.")
             
             retry_task = Task(
                 description=f"""
🚨 ATENÇÃO: Você gerou uma resposta mas NÃO usou a ferramenta de envio do Instagram!
Sua tarefa NÃO ESTÁ COMPLETA.

Você DEVE usar a ferramenta 'Enviar Mensagem Instagram' agora mesmo.

A mensagem que você gerou foi:
"{final_answer}"

👉 SUA TAREFA AGORA: Use a ferramenta 'Enviar Mensagem Instagram' para enviar EXATAMENTE o texto acima.
                 """.strip(),
                 expected_output="Confirmação de 'Mensagem Instagram enviada...' vinda da ferramenta.",
                 agent=comercial
             )
             
             crew_retry = Crew(
                agents=[comercial],
                tasks=[retry_task],
                process=Process.sequential,
                memory=False
             )
             
             print("🔄 Starting RETRY to force Instagram message sending...")
             result = await run_crew_with_retry(crew_retry)
             final_answer = str(result)
             print(f"✅ Retry result: {final_answer}")
             
        return {"status": "success", "result": final_answer}

    except Exception as e:
        print(f"❌ Error (Instagram): {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup global state
        if 'request_id' in locals():
            TOOLS_USAGE_STATE.pop(request_id, None)


@app.get("/health")
async def health_check():
    return {"status": "ok", "engine": "crewai"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
