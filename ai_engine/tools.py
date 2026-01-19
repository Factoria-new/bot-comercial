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
    
    ⚠️ IMPORTANTE - DURAÇÃO FIXA:
    A duração dos agendamentos é configurada pelo dono do estabelecimento.
    Você NÃO precisa perguntar a duração ao cliente - ela é aplicada automaticamente.
    Se não fornecer end_datetime, o sistema calcula automaticamente baseado na duração configurada.
    
    ANTES de usar esta ferramenta, você DEVE coletar:
    - Nome do cliente
    - E-mail do cliente
    - Data e hora INICIAL desejada (o fim é calculado automaticamente)
    
    A ferramenta irá automaticamente:
    1. Verificar se o horário está dentro do funcionamento do estabelecimento
    2. Verificar se o horário está livre no calendário
    3. Criar a reunião com link do Google Meet (se online) ou enviar endereço (se presencial)
    4. Sugerir 3 horários alternativos próximos à data solicitada se o horário não estiver disponível
    
    Parâmetros necessários:
    - customer_name: Nome do cliente
    - customer_email: E-mail do cliente (será adicionado como participante do evento)
    - start_datetime: Data e hora de início (formato ISO: 2026-01-20T14:00:00)
    - end_datetime: Data e hora de fim (OPCIONAL - calculado automaticamente se não fornecido)
    - description: Descrição do compromisso (opcional)
    """
    
    user_id: str = Field(default="", description="Email do usuário dono do calendário")
    appointment_duration: int = Field(default=60, description="Duração padrão dos agendamentos em minutos")

    def _run(self, customer_name: str, customer_email: str, start_datetime: str, 
             end_datetime: str = "", description: str = ""):
        """
        Agenda um compromisso validando horário de funcionamento e disponibilidade.
        
        Args:
            customer_name: Nome do cliente
            customer_email: E-mail do cliente
            start_datetime: Data e hora de início (formato ISO)
            end_datetime: Data e hora de fim (formato ISO) - opcional, calculado automaticamente
            description: Descrição opcional do compromisso
        """
        node_api_url = os.getenv("NODE_BACKEND_URL", "http://localhost:3003")
        
        # Calculate end_datetime if not provided, using configured appointment_duration
        if not end_datetime:
            from datetime import datetime, timedelta
            try:
                if 'Z' in start_datetime:
                    start_dt = datetime.fromisoformat(start_datetime.replace('Z', '+00:00'))
                elif '+' in start_datetime or (start_datetime.count('-') > 2):
                    start_dt = datetime.fromisoformat(start_datetime)
                else:
                    start_dt = datetime.fromisoformat(start_datetime)
                
                end_dt = start_dt + timedelta(minutes=self.appointment_duration)
                end_datetime = end_dt.strftime('%Y-%m-%dT%H:%M:%S')
            except Exception:
                # If parsing fails, let backend handle it with default duration
                end_datetime = start_datetime  # Backend will use appointmentDuration from DB
        
        # Validação de antecedência mínima de 2 horas
        from datetime import datetime, timedelta, timezone
        try:
            # Parse o datetime de início
            if 'Z' in start_datetime:
                start_dt = datetime.fromisoformat(start_datetime.replace('Z', '+00:00'))
            elif '+' in start_datetime or (start_datetime.count('-') > 2):
                start_dt = datetime.fromisoformat(start_datetime)
            else:
                # Sem timezone, assume UTC-3 (Brasil)
                start_dt = datetime.fromisoformat(start_datetime)
            
            # Converter para comparação naive se necessário
            now = datetime.now()
            if start_dt.tzinfo:
                start_dt_naive = start_dt.replace(tzinfo=None)
            else:
                start_dt_naive = start_dt
            
            min_time = now + timedelta(hours=2)
            
            if start_dt_naive < min_time:
                return f"⚠️ AÇÃO NÃO REALIZADA: O horário solicitado ({start_datetime}) é muito próximo. É necessário agendar com pelo menos 2 horas de antecedência. O horário mínimo disponível agora é {min_time.strftime('%d/%m/%Y às %H:%M')}. Por favor, escolha outro horário."
        except Exception as parse_error:
            pass  # Se falhar o parse, deixa o backend validar
        
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


class GoogleCalendarRescheduleTool(BaseTool):
    name: str = "Reagendar Compromisso"
    description: str = """
    Ferramenta para REAGENDAR um compromisso existente no calendário (mudar data/hora).
    USE ESTA FERRAMENTA quando o cliente quiser MUDAR a data ou hora de um agendamento já existente.
    
    ⚠️ DURAÇÃO: A duração do agendamento é mantida automaticamente conforme configurado.
    Você só precisa informar a nova data/hora de INÍCIO.
    
    FLUXO DE USO:
    1. Primeira chamada: passe customer_email e new_start_datetime
       - Se houver 1 evento: reagenda automaticamente
       - Se houver mais de 1: retorna lista numerada (1, 2, 3...)
    
    2. Segunda chamada (se houve lista): passe os MESMOS parâmetros + event_index
       - event_index: número que o cliente escolheu (1, 2, 3...)
       - A ferramenta busca novamente e usa o evento correspondente
    
    IMPORTANTE: 
    - event_index é o NÚMERO da lista (1, 2, 3...), NÃO o ID técnico
    - Você DEVE chamar a ferramenta novamente após cliente escolher
    
    Parâmetros:
    - customer_email: E-mail do cliente (OBRIGATÓRIO)
    - new_start_datetime: Nova data/hora de INÍCIO (formato ISO: 2026-01-20T14:00:00) (OBRIGATÓRIO)
    - event_index: Número do evento na lista (1, 2, 3...) - use SOMENTE após cliente escolher
    """
    
    user_id: str = Field(default="", description="Email do usuário dono do calendário")
    appointment_duration: int = Field(default=60, description="Duração configurada dos agendamentos em minutos")

    def _run(self, customer_email: str, new_start_datetime: str, event_index: int = 0):
        """
        Reagenda um compromisso existente.
        
        Args:
            customer_email: E-mail do cliente
            new_start_datetime: Nova data e hora de início (formato ISO)
            event_index: Número do evento na lista (1, 2, 3...) - opcional
        """
        node_api_url = os.getenv("NODE_BACKEND_URL", "http://localhost:3003")
        
        # Validação de antecedência mínima de 2 horas
        from datetime import datetime, timedelta
        try:
            if 'Z' in new_start_datetime:
                start_dt = datetime.fromisoformat(new_start_datetime.replace('Z', '+00:00'))
            elif '+' in new_start_datetime or (new_start_datetime.count('-') > 2):
                start_dt = datetime.fromisoformat(new_start_datetime)
            else:
                start_dt = datetime.fromisoformat(new_start_datetime)
            
            now = datetime.now()
            if start_dt.tzinfo:
                start_dt_naive = start_dt.replace(tzinfo=None)
            else:
                start_dt_naive = start_dt
            
            min_time = now + timedelta(hours=2)
            
            if start_dt_naive < min_time:
                return f"⚠️ AÇÃO NÃO REALIZADA: O horário solicitado ({new_start_datetime}) é muito próximo. É necessário reagendar com pelo menos 2 horas de antecedência. O horário mínimo disponível agora é {min_time.strftime('%d/%m/%Y às %H:%M')}. Por favor, escolha outro horário."
        except Exception as parse_error:
            pass  # Se falhar o parse, deixa o backend validar
        
        try:
            # Sempre buscar eventos pelo email primeiro
            search_response = requests.get(
                f"{node_api_url}/api/google-calendar/customer-events",
                params={
                    "userId": self.user_id,
                    "customerEmail": customer_email
                }
            )
            search_result = search_response.json()
            
            if not search_result.get("success"):
                return f"⚠️ AÇÃO NÃO REALIZADA: Erro ao buscar agendamentos: {search_result.get('error', 'Erro desconhecido')}"
            
            events = search_result.get("events", [])
            
            if len(events) == 0:
                return f"⚠️ AÇÃO NÃO REALIZADA: Não encontrei nenhum agendamento futuro para o e-mail {customer_email}. Verifique se o e-mail está correto."
            
            event_id = None
            selected_event = None
            
            if len(events) == 1:
                # Só tem 1 evento - usar ele
                event_id = events[0]["id"]
                selected_event = events[0]
            elif event_index > 0:
                # Cliente escolheu um número da lista
                if event_index > len(events):
                    return f"⚠️ AÇÃO NÃO REALIZADA: O número {event_index} não existe na lista. Escolha um número entre 1 e {len(events)}."
                
                selected_event = events[event_index - 1]  # Converter para 0-indexed
                event_id = selected_event["id"]
            else:
                # Múltiplos eventos e cliente não escolheu ainda - mostrar lista
                event_list = "\n".join([
                    f"  {i+1}. {e['summary']} - {e['start']}" 
                    for i, e in enumerate(events)
                ])
                return f"""⚠️ AÇÃO NÃO REALIZADA - PRECISO QUE O CLIENTE ESCOLHA:

Encontrei {len(events)} agendamentos para {customer_email}:
{event_list}

👉 PERGUNTE ao cliente qual número ele deseja reagendar.
👉 Depois que ele responder, CHAME ESTA FERRAMENTA NOVAMENTE com:
   - customer_email: "{customer_email}"
   - new_start_datetime: "{new_start_datetime}"
   - event_index: [número que o cliente escolheu]

ATENÇÃO: O reagendamento NÃO foi feito. Você DEVE chamar a ferramenta novamente."""
            
            # Calcular horário de término
            end_dt = start_dt + timedelta(minutes=self.appointment_duration)
            new_end_datetime = end_dt.strftime('%Y-%m-%dT%H:%M:%S')
            
            # Fazer o reagendamento
            response = requests.post(
                f"{node_api_url}/api/google-calendar/reschedule-appointment",
                json={
                    "userId": self.user_id,
                    "eventId": event_id,
                    "newStart": new_start_datetime,
                    "newEnd": new_end_datetime
                }
            )
            
            result = response.json()
            
            if result.get("success"):
                meet_link = result.get("meetLink")
                address = result.get("address")
                customer_name = result.get("customerName") or selected_event.get('summary', 'Agendamento')
                
                # Formatar data para exibição
                try:
                    display_date = start_dt.strftime('%d/%m/%Y às %H:%M')
                except:
                    display_date = new_start_datetime
                
                # Build response based on service type
                if meet_link:
                    # Online appointment
                    return f"✅ REAGENDAMENTO CONCLUÍDO COM SUCESSO!\n\nO compromisso '{customer_name}' foi alterado para {display_date}.\n\nLink da reunião: {meet_link}"
                elif address:
                    # Presencial appointment
                    return f"✅ REAGENDAMENTO CONCLUÍDO COM SUCESSO!\n\nO compromisso '{customer_name}' foi alterado para {display_date}.\n\nEndereço: {address}"
                else:
                    return f"✅ REAGENDAMENTO CONCLUÍDO COM SUCESSO!\n\nO compromisso '{customer_name}' foi alterado para {display_date}."
            
            elif result.get("reason") == "insufficient_advance_time":
                return f"⚠️ AÇÃO NÃO REALIZADA: {result.get('message')}"
            
            elif result.get("reason") == "outside_business_hours":
                formatted_hours = result.get('formattedHours', 'Horários não disponíveis')
                return f"⚠️ AÇÃO NÃO REALIZADA: {result.get('message', 'Horário fora do funcionamento')}\n\nHorário de funcionamento:\n{formatted_hours}"
            
            elif result.get("reason") == "calendar_conflict":
                suggestions = result.get("suggestions", [])
                if suggestions:
                    suggestion_text = "\n".join([
                        f"  • {s['formatted']}" for s in suggestions
                    ])
                    return f"⚠️ AÇÃO NÃO REALIZADA: O novo horário não está disponível.\n\nSugestões de horários próximos:\n{suggestion_text}"
                else:
                    return "⚠️ AÇÃO NÃO REALIZADA: O novo horário não está disponível e não encontramos alternativas próximas."
            
            else:
                return f"⚠️ AÇÃO NÃO REALIZADA: {result.get('error', result.get('message', 'Erro desconhecido'))}"
                
        except Exception as e:
            return f"⚠️ AÇÃO NÃO REALIZADA: Erro de conexão com o serviço de calendário: {str(e)}"


class GoogleCalendarCheckAvailabilityTool(BaseTool):
    name: str = "Verificar Disponibilidade"
    description: str = """
    Ferramenta OBRIGATÓRIA para verificar se um horário está livre ANTES de sugerir ou confirmar.
    
    USE ESTA FERRAMENTA QUANDO:
    1. O cliente perguntar se tem horário disponível em tal dia/hora
    2. O cliente sugerir um horário para agendar ("Pode ser dia 20 às 15h?")
    3. ANTES de você usar a ferramenta "Agendar Compromisso"
    
    A ferramenta verifica:
    1. Se é um horário futuro válido (mínimo 2h antecedência)
    2. Se está dentro do horário de funcionamento
    3. Se não há conflito com outros agendamentos
    
    Parâmetros:
    - requested_date: Data (YYYY-MM-DD)
    - requested_time: Hora (HH:mm)
    """
    
    user_id: str = Field(default="", description="Email do usuário dono do calendário")

    def _run(self, requested_date: str, requested_time: str):
        """
        Verifica disponibilidade de um horário.
        
        Args:
            requested_date: Data (YYYY-MM-DD)
            requested_time: Hora (HH:mm)
        """
        node_api_url = os.getenv("NODE_BACKEND_URL", "http://localhost:3003")
        
        try:
            response = requests.post(f"{node_api_url}/api/google-calendar/check-availability", json={
                "userId": self.user_id,
                "date": requested_date,
                "time": requested_time
            })
            
            result = response.json()
            
            if result.get("success"):
                if result.get("available"):
                     return f"✅ O horário {requested_date} às {requested_time} está DISPONÍVEL! Você deve agora:\n1. Perguntar ao cliente se ele confirma o agendamento\n2. Se ele confirmar, usar a ferramenta 'Agendar Compromisso'"
                else:
                    reason = result.get("reason", "unknown")
                    message = result.get("message", "Indisponível")
                    
                    if reason == "insufficient_advance_time":
                         return f"❌ INDISPONÍVEL: {message}"
                    
                    elif reason == "outside_business_hours":
                        formatted_hours = result.get('formattedHours', 'Horários não disponíveis')
                        return f"❌ INDISPONÍVEL: Fora do horário de funcionamento.\nHorários:\n{formatted_hours}"
                    
                    elif reason == "calendar_conflict":
                        suggestions = result.get("suggestions", [])
                        if suggestions:
                            suggestion_text = "\n".join([
                                f"  • {s['formatted']}" for s in suggestions
                            ])
                            return f"❌ INDISPONÍVEL: Já existe um agendamento neste horário.\n\nSugestões próximas:\n{suggestion_text}"
                        else:
                             return "❌ INDISPONÍVEL: Já existe um agendamento e não há horários próximos livres."
                    
                    else:
                        return f"❌ INDISPONÍVEL: {message}"
            else:
                 return f"Erro ao verificar disponibilidade: {result.get('error', 'Erro desconhecido')}"
                 
        except Exception as e:
            return f"Erro de conexão: {str(e)}"


class GoogleCalendarListDaySlotsTool(BaseTool):
    name: str = "Listar Horários Disponíveis do Dia"
    description: str = """
    Lista TODOS os horários disponíveis para um dia específico.
    
    USE ESTA FERRAMENTA QUANDO:
    1. O cliente perguntar "quais horários tem?" ou "tem vaga no dia X?"
    2. O cliente pedir horários disponíveis para uma parte do dia ("de tarde", "de manhã")
    3. Você quiser mostrar opções ao cliente antes de agendar
    
    Esta ferramenta considera automaticamente:
    - A duração configurada dos agendamentos
    - O horário de funcionamento do estabelecimento
    - Os agendamentos já existentes no calendário
    
    Parâmetros:
    - date: Data no formato YYYY-MM-DD (OBRIGATÓRIO)
    - period: 'morning' (manhã), 'afternoon' (tarde), 'evening' (noite), ou 'all' (OPCIONAL, padrão: all)
    """
    
    user_id: str = Field(default="", description="Email do usuário dono do calendário")

    def _run(self, date: str, period: str = "all"):
        """
        Lista todos os horários disponíveis para um dia.
        
        Args:
            date: Data (YYYY-MM-DD)
            period: 'morning', 'afternoon', 'evening', ou 'all'
        """
        node_api_url = os.getenv("NODE_BACKEND_URL", "http://localhost:3003")
        
        try:
            response = requests.post(f"{node_api_url}/api/google-calendar/available-slots-for-day", json={
                "userId": self.user_id,
                "date": date,
                "period": period
            })
            
            result = response.json()
            
            if result.get("success"):
                slots = result.get("slots", [])
                day_name = result.get("dayName", "")
                formatted_date = result.get("formattedDate", date)
                total = result.get("totalSlots", len(slots))
                duration = result.get("durationMinutes", 60)
                
                if total == 0:
                    message = result.get("message", "Não há horários disponíveis neste dia.")
                    return f"❌ {message}"
                
                # Format slots nicely
                period_name = {
                    'morning': 'pela manhã',
                    'afternoon': 'à tarde',
                    'evening': 'à noite',
                    'all': ''
                }.get(period, '')
                
                slot_times = [s['time'] for s in slots]
                
                # Group by period for better readability
                morning_slots = [t for t in slot_times if int(t.split(':')[0]) < 12]
                afternoon_slots = [t for t in slot_times if 12 <= int(t.split(':')[0]) < 18]
                evening_slots = [t for t in slot_times if int(t.split(':')[0]) >= 18]
                
                response_parts = [f"📅 *Horários disponíveis para {day_name}, {formatted_date}*"]
                response_parts.append(f"\n(⏱️ Duração: {duration} min)\n")
                
                if morning_slots:
                    morning_formatted = '\n• '.join(morning_slots)
                    response_parts.append(f"\n🌅 *MANHÃ*\n\n• {morning_formatted}")
                if afternoon_slots:
                    afternoon_formatted = '\n• '.join(afternoon_slots)
                    response_parts.append(f"\n\n☀️ *TARDE*\n\n• {afternoon_formatted}")
                if evening_slots:
                    evening_formatted = '\n• '.join(evening_slots)
                    response_parts.append(f"\n\n🌙 *NOITE*\n\n• {evening_formatted}")
                
                response_parts.append(f"\n\n✅ *Total:* {total} horários livres.")
                response_parts.append("\n\nQual desses você prefere? 😊")
                
                return "".join(response_parts)
            else:
                return f"Erro ao listar horários: {result.get('error', 'Erro desconhecido')}"
                
        except Exception as e:
            return f"Erro de conexão: {str(e)}"

class GoogleCalendarCancelTool(BaseTool):
    name: str = "Cancelar Agendamento"
    description: str = """
    Ferramenta para CANCELAR um compromisso existente no calendário.
    USE ESTA FERRAMENTA quando o cliente quiser CANCELAR (remover) um agendamento.
    
    FLUXO DE USO:
    1. Primeira chamada: passe customer_email
       - Se houver 1 evento: pede confirmação antes de cancelar
       - Se houver mais de 1: retorna lista numerada (1, 2, 3...)
    
    2. Segunda chamada (se houve lista): passe customer_email + event_index
       - event_index: número que o cliente escolheu (1, 2, 3...)
       - A ferramenta busca novamente e cancela o evento correspondente
    
    IMPORTANTE: 
    - SEMPRE confirme com o cliente antes de cancelar definitivamente
    - event_index é o NÚMERO da lista (1, 2, 3...), NÃO o ID técnico
    - Você DEVE chamar a ferramenta novamente após cliente escolher
    
    Parâmetros:
    - customer_email: E-mail do cliente (OBRIGATÓRIO)
    - event_index: Número do evento na lista (1, 2, 3...) - use SOMENTE após cliente escolher
    - confirmed: True se o cliente já confirmou que deseja cancelar
    """
    
    user_id: str = Field(default="", description="Email do usuário dono do calendário")

    def _run(self, customer_email: str, event_index: int = 0, confirmed: bool = False):
        """
        Cancela um compromisso existente.
        
        Args:
            customer_email: E-mail do cliente
            event_index: Número do evento na lista (1, 2, 3...) - opcional
            confirmed: Se o cliente confirmou o cancelamento
        """
        node_api_url = os.getenv("NODE_BACKEND_URL", "http://localhost:3003")
        
        try:
            # 1. Primeiro, buscar eventos do cliente
            search_response = requests.get(
                f"{node_api_url}/api/google-calendar/customer-events",
                params={
                    "userId": self.user_id,
                    "customerEmail": customer_email
                }
            )
            search_result = search_response.json()
            
            if not search_result.get("success"):
                return f"⚠️ AÇÃO NÃO REALIZADA: Erro ao buscar agendamentos: {search_result.get('error', 'Erro desconhecido')}"
            
            events = search_result.get("events", [])
            
            if len(events) == 0:
                return f"⚠️ AÇÃO NÃO REALIZADA: Não encontrei nenhum agendamento futuro para o e-mail {customer_email}. Verifique se o e-mail está correto."
            
            event_id = None
            selected_event = None
            
            if len(events) == 1:
                # Só tem 1 evento - usar ele
                event_id = events[0]["id"]
                selected_event = events[0]
            elif event_index > 0:
                # Cliente escolheu um número da lista
                if event_index > len(events):
                    return f"⚠️ AÇÃO NÃO REALIZADA: O número {event_index} não existe na lista. Escolha um número entre 1 e {len(events)}."
                
                selected_event = events[event_index - 1]  # Converter para 0-indexed
                event_id = selected_event["id"]
            else:
                # Múltiplos eventos e cliente não escolheu ainda - mostrar lista
                event_list = "\n".join([
                    f"  {i+1}. {e['summary']} - {e['start']}" 
                    for i, e in enumerate(events)
                ])
                return f"""⚠️ AÇÃO NÃO REALIZADA - PRECISO QUE O CLIENTE ESCOLHA:

Encontrei {len(events)} agendamentos para {customer_email}:
{event_list}

👉 PERGUNTE ao cliente qual número ele deseja CANCELAR.
👉 Depois que ele responder, CHAME ESTA FERRAMENTA NOVAMENTE com:
   - customer_email: "{customer_email}"
   - event_index: [número que o cliente escolheu]
   - confirmed: False (para pedir confirmação)

ATENÇÃO: O cancelamento NÃO foi feito. Você DEVE chamar a ferramenta novamente."""
            
            # Pedir confirmação antes de cancelar
            if not confirmed:
                return f"""⚠️ CONFIRMAÇÃO NECESSÁRIA:

Você deseja realmente cancelar o seguinte agendamento?
📅 {selected_event['summary']}
🕐 {selected_event['start']}

👉 PERGUNTE ao cliente se ele CONFIRMA o cancelamento.
👉 Se ele confirmar, CHAME ESTA FERRAMENTA NOVAMENTE com:
   - customer_email: "{customer_email}"
   - event_index: {event_index if event_index > 0 else 1}
   - confirmed: True

ATENÇÃO: O cancelamento NÃO foi feito ainda. Aguarde confirmação do cliente."""
            
            # Fazer o cancelamento
            response = requests.post(
                f"{node_api_url}/api/google-calendar/cancel-appointment",
                json={
                    "userId": self.user_id,
                    "eventId": event_id
                }
            )
            
            result = response.json()
            
            if result.get("success"):
                return f"✅ Agendamento cancelado com sucesso!\n\nO compromisso '{selected_event['summary']}' foi removido do calendário."
            else:
                return f"❌ Erro ao cancelar: {result.get('error', 'Erro desconhecido')}"
                
        except Exception as e:
            return f"Erro de conexão com o serviço de calendário: {str(e)}"

