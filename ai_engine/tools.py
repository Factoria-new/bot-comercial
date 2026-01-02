from crewai.tools import BaseTool
import requests
import os

class WhatsAppSendTool(BaseTool):
    name: str = "Enviar Mensagem WhatsApp"
    description: str = "Envia uma mensagem de texto para um cliente no WhatsApp. Use para responder dúvidas ou fechar vendas."

    def _run(self, user_id: str, phone_number: str, message: str):
        node_api_url = os.getenv("NODE_BACKEND_URL") # ex: http://localhost:3003
        
        try:
            response = requests.post(f"{node_api_url}/api/internal/whatsapp/send-text", json={
                "userId": user_id,
                "phoneNumber": phone_number,
                "message": message
            })
            if response.status_code == 200:
                return "Mensagem enviada com sucesso."
            else:
                return f"Falha ao enviar: {response.text}"
        except Exception as e:
            return f"Erro de conexão com o WhatsApp: {str(e)}"
