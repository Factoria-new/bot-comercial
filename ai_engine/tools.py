from crewai.tools import BaseTool
from pydantic import Field
import requests
import os
import json

class WhatsAppSendTool(BaseTool):
    name: str = "Enviar Mensagem WhatsApp"
    description: str = "Envia uma mensagem de texto para o cliente no WhatsApp. Use o remote_jid fornecido na tarefa para responder."
    
    # Store session_id as instance variable
    session_id: str = Field(default="instance_1", description="Session ID do WhatsApp")

    def _run(self, remote_jid: str, message: str):
        """
        Envia mensagem para o WhatsApp.
        
        Args:
            remote_jid: O ID do cliente (ex: 109384344584362@lid ou 5531999527076@s.whatsapp.net)
            message: A mensagem a ser enviada
        """
        node_api_url = os.getenv("NODE_BACKEND_URL", "http://localhost:3003")
        
        try:
            response = requests.post(f"{node_api_url}/api/internal/whatsapp/send-text", json={
                "userId": self.session_id,  # This is the WhatsApp session ID (instance_1, etc)
                "phoneNumber": remote_jid,   # This is the client's JID
                "message": message
            })
            if response.status_code == 200:
                return f"Mensagem enviada com sucesso para {remote_jid}."
            else:
                return f"Falha ao enviar: {response.text}"
        except Exception as e:
            return f"Erro de conexão com o WhatsApp: {str(e)}"


class InstagramSendTool(BaseTool):
    name: str = "Enviar Mensagem Instagram"
    description: str = "Envia uma mensagem de texto para o cliente no Instagram DM. Use o sender_id fornecido na tarefa para responder."
    
    # Store user_id (email) as instance variable
    user_id: str = Field(default="", description="Email do usuário conectado")

    def _run(self, recipient_id: str, message: str):
        """
        Envia mensagem para o Instagram DM.
        
        Args:
            recipient_id: O ID do cliente no Instagram
            message: A mensagem a ser enviada
        """
        node_api_url = os.getenv("NODE_BACKEND_URL", "http://localhost:3003")
        
        try:
            response = requests.post(f"{node_api_url}/api/internal/instagram/send-dm", json={
                "userId": self.user_id,
                "recipientId": recipient_id,
                "message": message
            })
            if response.status_code == 200:
                return f"Mensagem Instagram enviada com sucesso para {recipient_id}."
            else:
                return f"Falha ao enviar Instagram DM: {response.text}"
        except Exception as e:
            return f"Erro de conexão com o Instagram: {str(e)}"


class WhatsAppSendAudioTool(BaseTool):
    name: str = "Enviar Áudio WhatsApp"
    description: str = "Envia uma resposta em ÁUDIO (voz) para o cliente no WhatsApp. Use esta ferramenta quando o cliente solicitar áudio especificamente (ex: 'manda áudio') ou quando você julgar que uma resposta falada é melhor. O texto fornecido será convertido em fala."
    
    # Store session_id as instance variable
    session_id: str = Field(default="instance_1", description="Session ID do WhatsApp")

    def _run(self, remote_jid: str, message: str):
        """
        Envia mensagem de áudio (TTS) para o WhatsApp.
        
        Args:
            remote_jid: O ID do cliente (ex: 109384344584362@lid ou 5531...)
            message: O texto que será falado no áudio
        """
        node_api_url = os.getenv("NODE_BACKEND_URL", "http://localhost:3003")
        
        try:
            response = requests.post(f"{node_api_url}/api/internal/whatsapp/send-audio", json={
                "userId": self.session_id,
                "phoneNumber": remote_jid,
                "message": message
            })
            if response.status_code == 200:
                return f"Áudio enviado com sucesso para {remote_jid}."
            else:
                return f"Falha ao enviar áudio: {response.text}"
        except Exception as e:
            return f"Erro de conexão com o WhatsApp: {str(e)}"

class GoogleCalendarTool(BaseTool):
    name: str = "Agendar Compromisso"
    description: str = """
    Ferramenta para agendar compromissos no calendário. Use esta ferramenta quando o cliente 
    quiser marcar uma reunião, consulta, atendimento ou qualquer compromisso.
    
    ANTES de usar esta ferramenta, você DEVE coletar:
    - Nome do cliente
    - E-mail do cliente
    - Data e hora desejada
    
    A ferramenta irá automaticamente:
    1. Verificar se o horário está dentro do funcionamento do estabelecimento
    2. Verificar se o horário está livre no calendário
    3. Criar a reunião com link do Google Meet (se online) ou enviar endereço (se presencial)
    4. Sugerir 3 horários alternativos próximos à data solicitada se o horário não estiver disponível
    
    Parâmetros necessários:
    - customer_name: Nome do cliente
    - customer_email: E-mail do cliente (será adicionado como participante do evento)
    - start_datetime: Data e hora de início (formato ISO: 2026-01-20T14:00:00)
    - end_datetime: Data e hora de fim (formato ISO: 2026-01-20T15:00:00)
    - description: Descrição do compromisso (opcional)
    """
    
    user_id: str = Field(default="", description="Email do usuário dono do calendário")

    def _run(self, customer_name: str, customer_email: str, start_datetime: str, 
             end_datetime: str, description: str = ""):
        """
        Agenda um compromisso validando horário de funcionamento e disponibilidade.
        
        Args:
            customer_name: Nome do cliente
            customer_email: E-mail do cliente
            start_datetime: Data e hora de início (formato ISO)
            end_datetime: Data e hora de fim (formato ISO)
            description: Descrição opcional do compromisso
        """
        node_api_url = os.getenv("NODE_BACKEND_URL", "http://localhost:3003")
        
        try:
            response = requests.post(
                f"{node_api_url}/api/google-calendar/schedule-appointment",
                json={
                    "userId": self.user_id,
                    "customerName": customer_name,
                    "customerEmail": customer_email,
                    "requestedStart": start_datetime,
                    "requestedEnd": end_datetime,
                    "description": description
                }
            )
            
            result = response.json()
            
            if result.get("success"):
                # Agendamento bem-sucedido
                if result.get("meetLink"):
                    return f"✅ Agendamento confirmado para {customer_name}! Link da reunião online: {result['meetLink']}"
                elif result.get("address"):
                    return f"✅ Agendamento confirmado para {customer_name}! Endereço do atendimento: {result['address']}"
                else:
                    return f"✅ Agendamento confirmado para {customer_name}!"
            
            elif result.get("reason") == "outside_business_hours":
                # Fora do horário de funcionamento
                formatted_hours = result.get('formattedHours', 'Horários não disponíveis')
                return f"❌ {result.get('message', 'Horário fora do funcionamento')}\n\nHorário de funcionamento:\n{formatted_hours}"
            
            elif result.get("reason") == "calendar_conflict":
                # Conflito no calendário - sugerir alternativas
                suggestions = result.get("suggestions", [])
                if suggestions:
                    suggestion_text = "\n".join([
                        f"  • {s['formatted']}" for s in suggestions
                    ])
                    return f"❌ O horário solicitado não está disponível.\n\nSugestões de horários próximos:\n{suggestion_text}"
                else:
                    return "❌ O horário solicitado não está disponível e não encontramos alternativas próximas."
            
            else:
                return f"Erro ao agendar: {result.get('error', result.get('message', 'Erro desconhecido'))}"
                
        except Exception as e:
            return f"Erro de conexão com o serviço de calendário: {str(e)}"

