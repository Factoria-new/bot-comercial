from crewai.tools import BaseTool
from pydantic import Field
import requests
import os

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
