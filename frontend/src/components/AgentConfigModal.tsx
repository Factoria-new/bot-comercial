import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Save, Sparkles, FileText, Volume2, Calendar, CheckCircle, ExternalLink, Loader2, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import API_CONFIG from '@/config/api';
import CalendarSettingsModal from './CalendarSettingsModal';

export interface AgentConfig {
  aiProvider: 'gemini' | 'openai';
  apiKey: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  assistantId?: string; // Para OpenAI
  ttsEnabled?: boolean; // Habilitar TTS
  ttsVoice?: string; // Voz do TTS
}

interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AgentConfig) => Promise<void>;
  initialConfig?: AgentConfig;
  instanceName: string;
  instanceId: number;
  userEmail: string;
}

const GEMINI_VOICES = [
  { value: 'Aoede', label: 'Aoede', gender: 'Feminino' },
  { value: 'Kore', label: 'Kore', gender: 'Feminino' },
  { value: 'Charon', label: 'Charon', gender: 'Masculino' },
  { value: 'Fenrir', label: 'Fenrir', gender: 'Masculino' },
  { value: 'Puck', label: 'Puck', gender: 'Não-binário' },
  { value: 'Orus', label: 'Orus', gender: 'Masculino' },
];

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente virtual prestativo e profissional. Responda de forma clara, objetiva e amigável às perguntas dos usuários.`;

const AgentConfigModal = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  instanceName,
  instanceId,
  userEmail
}: AgentConfigModalProps) => {
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>(initialConfig?.aiProvider || 'gemini');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [systemPrompt, setSystemPrompt] = useState(initialConfig?.systemPrompt || DEFAULT_SYSTEM_PROMPT);
  const [assistantId, setAssistantId] = useState(initialConfig?.assistantId || '');
  const [ttsEnabled, setTtsEnabled] = useState(initialConfig?.ttsEnabled || false);
  const [ttsVoice, setTtsVoice] = useState(initialConfig?.ttsVoice || 'Aoede');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { authenticatedFetch } = useAuthenticatedFetch();

  // Estados para integração do Google Calendar
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [isCheckingCalendar, setIsCheckingCalendar] = useState(false);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState<any>(null);

  useEffect(() => {
    if (initialConfig) {
      setAiProvider(initialConfig.aiProvider || 'gemini');
      setApiKey(initialConfig.apiKey || '');
      setSystemPrompt(initialConfig.systemPrompt || DEFAULT_SYSTEM_PROMPT);
      setAssistantId(initialConfig.assistantId || '');
      setTtsEnabled(initialConfig.ttsEnabled || false);
      setTtsVoice(initialConfig.ttsVoice || 'Aoede');
    }
  }, [initialConfig]);

  // Verificar status do Calendar quando o modal abrir
  useEffect(() => {
    if (isOpen && instanceId) {
      checkCalendarStatus();
    }
  }, [isOpen, instanceId]);

  const checkCalendarStatus = async () => {
    if (!instanceId) return;

    setIsCheckingCalendar(true);
    try {
      const sessionId = `instance_${instanceId}`;
      let url = `${API_CONFIG.BASE_URL}/api/calendar/status/${sessionId}`;
      const params = new URLSearchParams();
      if (userEmail) params.append('userId', userEmail);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await authenticatedFetch(url);
      const data = await response.json();

      setCalendarConnected(data.connected || false);
      setCalendarEnabled(data.connected || false);
      if (data.settings) {
        setCalendarSettings(data.settings);
      }
    } catch (error) {
      console.error('Erro ao verificar status do Calendar:', error);
    } finally {
      setIsCheckingCalendar(false);
    }
  };

  const handleConnectCalendar = () => {
    setShowCalendarSettings(true);
  };

  const handleCalendarSettingsConfirm = async (settings: any) => {
    if (!instanceId) return;

    setIsConnectingCalendar(true);
    const sessionId = `instance_${instanceId}`;

    try {
      const response = await authenticatedFetch(`${API_CONFIG.BASE_URL}/api/calendar/connect`, {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          userId: userEmail,
          settings
        }),
      });

      const data = await response.json();

      if (data.alreadyConnected) {
        setCalendarConnected(true);
        setIsConnectingCalendar(false);
        setShowCalendarSettings(false);
        setCalendarSettings(settings);
        toast({
          title: "Conexão Reativada",
          description: "Sua conta do Google Calendar foi reativada com sucesso.",
        });
        return;
      }

      if (data.authUrl && data.connectionId) {
        setShowCalendarSettings(false);
        setCalendarSettings(settings);

        // Abrir popup OAuth
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const authWindow = window.open(
          data.authUrl,
          'Connect Google Calendar',
          `width=${width},height=${height},top=${top},left=${left}`
        );

        // Polling para verificar se conectou
        const startTime = Date.now();
        const checkInterval = setInterval(async () => {
          if (Date.now() - startTime > 300000) {
            clearInterval(checkInterval);
            setIsConnectingCalendar(false);
            return;
          }

          let isWindowClosed = false;
          try {
            isWindowClosed = !!authWindow?.closed;
          } catch (e) {
            // Ignorar erro de Cross-Origin
          }

          if (isWindowClosed) {
            clearInterval(checkInterval);
            await checkCalendarStatus();
            setIsConnectingCalendar(false);
          } else {
            try {
              let statusUrl = `${API_CONFIG.BASE_URL}/api/calendar/status/${sessionId}?connectionId=${data.connectionId}`;
              if (userEmail) statusUrl += `&userId=${userEmail}`;

              const statusResponse = await authenticatedFetch(statusUrl);
              const statusData = await statusResponse.json();

              if (statusData.connected) {
                clearInterval(checkInterval);
                try { authWindow?.close(); } catch (e) { }
                setCalendarConnected(true);
                setIsConnectingCalendar(false);
                toast({
                  title: "Conectado!",
                  description: "Google Calendar conectado com sucesso.",
                });
              }
            } catch (e) {
              // Ignorar erros de rede temporários
            }
          }
        }, 2000);
      } else {
        throw new Error('URL de autenticação não recebida');
      }
    } catch (error) {
      console.error('Erro ao conectar Calendar:', error);
      setIsConnectingCalendar(false);
      toast({
        title: "Erro",
        description: "Falha ao iniciar conexão. Verifique o backend.",
        variant: "destructive"
      });
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!instanceId) return;

    try {
      const sessionId = `instance_${instanceId}`;
      let disconnectUrl = `${API_CONFIG.BASE_URL}/api/calendar/disconnect/${sessionId}`;
      if (userEmail) disconnectUrl += `?userId=${userEmail}`;

      const response = await authenticatedFetch(disconnectUrl, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao desconectar');
      }

      setCalendarConnected(false);
      setCalendarEnabled(false);
      setCalendarSettings(null);

      toast({
        title: "Desconectado",
        description: "Google Calendar desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao desconectar Calendar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar o Google Calendar.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    // Validações
    if (aiProvider === 'gemini' && !apiKey.trim()) {
      toast({
        title: "API Key obrigatória",
        description: "Por favor, insira sua API Key do Google Gemini para usar o sistema.",
        variant: "destructive",
      });
      return;
    }

    if (aiProvider === 'openai' && !assistantId.trim()) {
      toast({
        title: "Assistant ID obrigatório",
        description: "Por favor, insira o ID do seu assistente OpenAI.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const config: AgentConfig = {
        aiProvider,
        apiKey: apiKey.trim(), // Sempre envia a API key (vazia ou preenchida)
        model: 'gemini-2.5-flash', // Modelo fixo no backend
        systemPrompt: aiProvider === 'gemini' ? systemPrompt.trim() : undefined,
        temperature: 1.0, // Temperatura fixa no backend
        assistantId: aiProvider === 'openai' ? assistantId.trim() : undefined,
        ttsEnabled: aiProvider === 'gemini' ? ttsEnabled : undefined,
        ttsVoice: aiProvider === 'gemini' && ttsEnabled ? ttsVoice : undefined,
      };

      await onSave(config);

      toast({
        title: "Configuração salva",
        description: `Assistente ${aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'} configurado com sucesso!`,
      });

      onClose();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setTtsEnabled(false);
    setTtsVoice('Aoede');
    toast({
      title: "Configurações resetadas",
      description: "Todas as configurações voltaram aos valores padrão.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 backdrop-blur-md bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 border border-gray-200 backdrop-blur-xl shadow-2xl mx-auto">
          <DialogHeader className="px-6 pt-6 space-y-2">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-6 h-6 text-gray-900" />
              Editar Agente
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Configure o assistente de IA para {instanceName}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-6">
            {/* Tabs de Provedor */}
            <Tabs value={aiProvider} onValueChange={(v) => setAiProvider(v as 'gemini')} className="w-full ">
              <TabsList className="items-center justify-center w-full grid-cols-2 bg-white/70 border border-gray-200 backdrop-blur-md">
                <TabsTrigger value="gemini" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Google Gemini
                </TabsTrigger>
              </TabsList>

              {/* Configurações Gemini */}
              <TabsContent value="gemini" className="space-y-4 mt-4">

                {/* API Key do Gemini */}
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-gray-900 flex items-center gap-2 font-medium">
                    <Sparkles className="w-4 h-4 text-gray-900" />
                    API Key do Google Gemini <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      placeholder="AIza..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-3 py-2 bg-white/90 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A947]/50 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 text-xs"
                    >
                      {showApiKey ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    🔑 Obtenha sua chave em: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#00A947] hover:underline font-semibold">Google AI Studio</a>
                    <br />
                    💳 Você precisa de sua própria chave de API para usar o sistema. É gratuito para começar!
                  </p>
                </div>

                {/* Prompt do Sistema */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-prompt" className="text-[#00A947] flex items-center gap-2 font-medium">
                      <FileText className="w-4 h-4 text-[#00A947]" />
                      Prompt do Sistema
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetToDefault}
                      className="text-xs text-[#00A947] hover:text-[#00A947]/80 hover:bg-[#00A947]/10"
                    >
                      Resetar padrão
                    </Button>
                  </div>
                  <Textarea
                    id="system-prompt"
                    placeholder="Instruções personalizadas para o assistente..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={8}
                    className="resize-none bg-white focus:border-gray-200 focus-visible:ring-[#00A947] text-gray-900 placeholder:text-gray-400 font-mono text-sm shadow-inner"
                  />
                  <p className="text-xs text-gray-500">
                    Instrua o modelo sobre como ele deve se comportar, seu tom, personalidade e diretrizes.
                  </p>
                </div>

                {/* Configurações de TTS */}
                <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-gray-900" />
                      <Label htmlFor="tts-enabled" className="text-sm font-medium text-gray-900 cursor-pointer">
                        Respostas em Áudio (<span className="text-[#00A947]">TTS</span>)
                      </Label>
                    </div>
                    <Switch
                      id="tts-enabled"
                      checked={ttsEnabled}
                      onCheckedChange={setTtsEnabled}
                      className="data-[state=checked]:bg-[#00A947]"
                    />
                  </div>

                  {ttsEnabled && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="tts-voice" className="text-sm text-gray-900 font-medium">
                        Voz do Assistente
                      </Label>
                      <Select value={ttsVoice} onValueChange={setTtsVoice}>
                        <SelectTrigger className="bg-white/90 backdrop-blur-sm border-gray-200 text-gray-900 hover:bg-white transition-colors">
                          <SelectValue placeholder="Selecione a voz" />
                        </SelectTrigger>
                        <SelectContent
                          className="bg-white/95 backdrop-blur-md border-gray-200 shadow-xl"
                          side="bottom"
                          sideOffset={4}
                        >
                          {GEMINI_VOICES.map((voice) => (
                            <SelectItem
                              key={voice.value}
                              value={voice.value}
                              className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                            >
                              <div>
                                <div className="font-medium">{voice.label}</div>
                                <div className="text-xs text-gray-600">{voice.gender}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        ℹ️ O <span className="text-[#00A947]">TTS</span> funciona perfeitamente com o Gemini 2.5 Flash configurado no sistema.
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-600">
                    Ative para permitir que o assistente envie mensagens em áudio.
                  </p>
                </div>

                {/* Integração Google Calendar - Seção Expansível */}
                <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 ${calendarConnected ? 'text-[#00A947]' : 'text-gray-900'}`} />
                      <Label htmlFor="calendar-enabled" className="text-sm font-medium text-gray-900 cursor-pointer">
                        Google Calendar
                        {calendarConnected && (
                          <span className="ml-2 text-xs text-[#00A947] font-normal">(Conectado)</span>
                        )}
                      </Label>
                      {isCheckingCalendar && (
                        <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {calendarConnected && (
                        <CheckCircle className="w-4 h-4 text-[#00A947]" />
                      )}
                      <Switch
                        id="calendar-enabled"
                        checked={calendarEnabled}
                        onCheckedChange={(checked) => {
                          if (checked && !calendarConnected) {
                            setCalendarEnabled(true);
                          } else if (!checked && calendarConnected) {
                            // Se desativar e está conectado, perguntar se quer desconectar
                            setCalendarEnabled(false);
                          } else {
                            setCalendarEnabled(checked);
                          }
                        }}
                        className="data-[state=checked]:bg-[#00A947]"
                      />
                    </div>
                  </div>

                  {calendarEnabled && (
                    <div className="space-y-3 animate-fade-in">
                      <p className="text-xs text-gray-500">
                        📅 Permita que o assistente agende eventos automaticamente via WhatsApp.
                      </p>

                      {calendarConnected ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-2 bg-[#00A947]/10 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-[#00A947]" />
                            <span className="text-sm text-[#00A947] font-medium">Conta Google conectada</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCalendarSettings(true)}
                              className="flex-1 text-xs h-8 gap-1.5 btn-qr-code"
                            >
                              <Settings className="h-3 w-3" />
                              Editar Calendar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDisconnectCalendar}
                              className="flex-1 text-xs h-8 border-[#FE601E]/20 text-[#FE601E] hover:bg-[#FE601E] hover:text-white transition-colors"
                            >
                              Desconectar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            onClick={handleConnectCalendar}
                            disabled={isConnectingCalendar}
                            className="w-full gap-2 text-xs h-9 bg-[#00A947] hover:bg-[#00A947]/90 text-white"
                          >
                            {isConnectingCalendar ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Conectando...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="h-3.5 w-3.5" />
                                Conectar Google Calendar
                              </>
                            )}
                          </Button>
                          <p className="text-[10px] text-center text-gray-400">
                            🔒 Acesso seguro via OAuth 2.0
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!calendarEnabled && (
                    <p className="text-xs text-gray-600">
                      Ative para permitir agendamentos automáticos de reuniões.
                    </p>
                  )}
                </div>
              </TabsContent>

            </Tabs>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 btn-destructive rounded-xl"
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || (calendarEnabled && !calendarConnected)}
                className="flex-1 btn-new-instance rounded-xl"
              >
                {isSaving ? (
                  <>
                    <Bot className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>

      {/* Modal de Configurações do Calendar */}
      <CalendarSettingsModal
        isOpen={showCalendarSettings}
        onClose={() => setShowCalendarSettings(false)}
        onConfirm={handleCalendarSettingsConfirm}
        isLoading={isConnectingCalendar}
        initialSettings={calendarSettings}
      />
    </Dialog>
  );
};

export default AgentConfigModal;
