from fastapi import FastAPI
from pydantic import BaseModel
from crewai import Crew, Process, Task
from agents import get_agents

app = FastAPI()

class MessageInput(BaseModel):
    userId: str
    remoteJid: str
    message: str
    agentPrompt: str | None = None

@app.post("/webhook/whatsapp")
async def handle_whatsapp_message(data: MessageInput):
    # Se vier um prompt do Node.js, usamos ele. Se não, usa o default.
    custom_prompt = data.agentPrompt
    
    comercial, social, trafego = get_agents(data.userId, custom_prompt)

    # Definir a Tarefa Dinâmica
    task_atendimento = Task(
        description=f"O cliente (ID: {data.remoteJid}) disse: '{data.message}'. Analise, responda no WhatsApp se for dúvida, ou acione o Social Media se pedirem portfólio.",
        expected_output="Ação executada com sucesso.",
        agent=comercial
    )

    crew = Crew(
        agents=[comercial, social, trafego],
        tasks=[task_atendimento],
        process=Process.sequential
    )

    result = crew.kickoff()
    return {"status": "processing", "result": result}
