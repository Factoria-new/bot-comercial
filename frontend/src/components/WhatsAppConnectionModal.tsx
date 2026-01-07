"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, LogOut } from "lucide-react";

// Types derived from usage (or imported if available)
interface WhatsAppConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalState: {
    isOpen: boolean;
    connectionState: 'idle' | 'generating' | 'ready' | 'connecting' | 'connected' | 'error' | 'scanning';
    errorMessage?: string;
  };
  instance: {
    id: number;
    qrCode?: string;
    isConnected: boolean;
  } | undefined;
  onGenerateQR: (sessionId: number) => void;
  onDisconnect: (sessionId: number) => void;
}

export default function WhatsAppConnectionModal({
  isOpen,
  onClose,
  modalState,
  instance,
  onGenerateQR,
  onDisconnect
}: WhatsAppConnectionModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full relative"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#25D36620' }}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Conectar WhatsApp</h2>
                  <p className="text-white/50 text-sm">
                    {modalState.connectionState === 'connected' ? 'Conectado!' :
                      modalState.connectionState === 'ready' ? 'Escaneie o QR Code' :
                        modalState.connectionState === 'generating' ? 'Gerando QR Code...' :
                          'Escolha como conectar'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content based on state */}
            {(!modalState.isOpen || modalState.connectionState === 'idle') && (
              /* Selection State - Initial */
              <div className="space-y-4">
                <p className="text-white/60 text-sm mb-6">
                  Conecte seu WhatsApp para que seu agente possa atender seus clientes automaticamente.
                </p>

                <Button
                  onClick={() => onGenerateQR(1)}
                  className="w-full py-6 text-lg rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h7v7H3V3zm1 1v5h5V4H4zm-1 9h7v7H3v-7zm1 1v5h5v-5H4zm9-10h7v7h-7V3zm1 1v5h5V4h-5zm-1 9h2v2h-2v-2zm2 2h2v2h-2v-2zm2 2h2v2h-2v-2zm-4 0h2v2h-2v-2zm4-4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                  </svg>
                  Conectar com QR Code
                </Button>
              </div>
            )}

            {modalState.connectionState === 'generating' && (
              /* Generating State */
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-[#25D366] animate-spin" />
                  </div>
                </div>
                <p className="text-white/70 mt-6 text-center">
                  Gerando QR Code...<br />
                  <span className="text-white/50 text-sm">Aguarde um momento</span>
                </p>
              </div>
            )}

            {modalState.connectionState === 'ready' && instance?.qrCode && (
              /* QR Code Ready State */
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl mb-6">
                  <img
                    src={instance.qrCode}
                    alt="QR Code WhatsApp"
                    className="w-56 h-56 object-contain"
                  />
                </div>
                <div className="text-center space-y-2 mb-6">
                  <p className="text-white/70 text-sm">
                    1. Abra o WhatsApp no seu celular
                  </p>
                  <p className="text-white/70 text-sm">
                    2. Vá em <span className="text-white">Configurações → Aparelhos conectados</span>
                  </p>
                  <p className="text-white/70 text-sm">
                    3. Toque em <span className="text-white">Conectar um aparelho</span>
                  </p>
                  <p className="text-white/70 text-sm">
                    4. Escaneie este QR Code
                  </p>
                </div>
              </div>
            )}

            {modalState.connectionState === 'connecting' && (
              /* Connecting State */
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-[#25D366] animate-spin" />
                </div>
                <p className="text-white/70 mt-6 text-center">
                  Conectando ao WhatsApp...<br />
                  <span className="text-white/50 text-sm">Estabelecendo conexão segura</span>
                </p>
              </div>
            )}

            {modalState.connectionState === 'connected' && (
              /* Connected State */
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Conectado com Sucesso!</h3>
                <p className="text-white/60 text-center mb-6">
                  Seu WhatsApp está pronto para receber mensagens.
                </p>
                <div className="flex flex-col gap-3 w-full">
                  <Button
                    onClick={onClose}
                    className="w-full py-4 text-lg rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Continuar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onDisconnect(1);
                      onClose();
                    }}
                    className="w-full py-4 text-base rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Desconectar
                  </Button>
                </div>
              </div>
            )}

            {modalState.connectionState === 'error' && (
              /* Error State */
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                  <X className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Erro na Conexão</h3>
                <p className="text-white/60 text-center mb-6">
                  {modalState.errorMessage || 'Não foi possível conectar. Tente novamente.'}
                </p>
                <Button
                  onClick={() => onGenerateQR(1)}
                  className="w-full py-4 text-lg rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  Tentar Novamente
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}