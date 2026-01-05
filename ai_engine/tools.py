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
