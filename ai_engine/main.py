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


def format_history(history: Optional[List[HistoryItem]]) -> str:
    if not history:
        return "Nenhum histórico disponível."
    
    formatted = []
    for item in history:
        role_pt = "Atendente" if item.role == "assistant" else "Cliente"
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
        
        # userId is the session_id (instance_1, etc)
        comercial, social, trafego = get_agents(data.userId, custom_prompt)

        # Include remoteJid in task so agent knows where to send response
        task_atendimento = Task(
            description=f"""
O cliente com ID '{data.remoteJid}' enviou a seguinte mensagem: '{data.message}'

Histórico da Conversa:
{format_history(data.history)}

IMPORTANTE: Para responder, use a ferramenta 'Enviar Mensagem WhatsApp' com:
- remote_jid: {data.remoteJid}
- message: sua resposta

Analise a mensagem e responda de forma adequada seguindo suas instruções, LEVANDO EM CONTA O HISTÓRICO ACIMA. Se o histórico mostrar que você acabou de fazer uma pergunta, a mensagem atual é provavelmente a resposta para ela.
            """.strip(),
            expected_output="Mensagem enviada com sucesso ao cliente.",
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

@app.get("/health")
async def health_check():
    return {"status": "ok", "engine": "crewai"}
