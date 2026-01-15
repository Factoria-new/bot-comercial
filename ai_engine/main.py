from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import traceback

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
    
    # Pegar apenas as últimas 10 mensagens para não estourar contexto
    return "\n".join(formatted[-10:])

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
        
        # userId is the session_id (instance_1, etc), userEmail is for Google Calendar
        comercial, social, trafego = get_agents(data.userId, custom_prompt, user_email)

        # Include remoteJid in task so agent knows where to send response
        task_atendimento = Task(
            description=f"""
O cliente com ID '{data.remoteJid}' enviou a seguinte mensagem: '{data.message}'

Histórico da Conversa:
{format_history(data.history)}

FERRAMENTAS DISPONÍVEIS:
1. 'Enviar Mensagem WhatsApp' - use com remote_jid: {data.remoteJid} e message: sua resposta
2. 'Agendar Compromisso' - use quando o cliente quiser agendar algo (requer nome, email, data/hora)

Analise a mensagem e responda de forma adequada seguindo suas instruções, LEVANDO EM CONTA O HISTÓRICO ACIMA. Se o histórico mostrar que você acabou de fazer uma pergunta, a mensagem atual é provavelmente a resposta para ela.

Se o cliente quiser agendar, use a ferramenta 'Agendar Compromisso' com os dados coletados.
            """.strip(),
            expected_output="Mensagem enviada com sucesso ao cliente ou agendamento realizado.",
            agent=comercial
        )

        crew = Crew(
            agents=[comercial, social, trafego],
            tasks=[task_atendimento],
            process=Process.sequential,
            memory=False
        )

        result = crew.kickoff()
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

        result = crew.kickoff()
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
