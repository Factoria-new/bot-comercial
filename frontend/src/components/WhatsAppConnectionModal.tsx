"use client";

/**
 * WhatsAppConnectionModal
 * 
 * Unified modal for WhatsApp connection flow.
 * Supports both usage patterns:
 * - Direct props (connectionState, qrCode) - simpler API
 * - Wrapped props (modalState, instance) - used by dashboard
 */

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, LogOut, QrCode as QRCodeIcon } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/brand-icons";

// Connection state types
export type ConnectionState = 'idle' | 'generating' | 'ready' | 'connecting' | 'connected' | 'error' | 'scanning';

// Props for simpler direct usage
export interface WhatsAppConnectionModalDirectProps {
  isOpen: boolean;
  connectionState: ConnectionState;
  qrCode?: string;
  errorMessage?: string;
  onClose: () => void;
  onGenerateQR: (instanceId: number) => void;
  onDisconnect?: (instanceId: number) => void;
  instanceId?: number;
}

// Props for wrapped usage (dashboard pattern)
export interface WhatsAppConnectionModalWrappedProps {
  isOpen: boolean;
  modalState: {
    isOpen: boolean;
    connectionState: ConnectionState;
    errorMessage?: string;
  };
  instance?: {
    id: number;
    qrCode?: string;
    isConnected: boolean;
  };
  onClose: () => void;
  onGenerateQR: (sessionId: number) => void;
  onDisconnect: (sessionId: number) => void;
}

// Union type for both patterns
export type WhatsAppConnectionModalProps = WhatsAppConnectionModalDirectProps | WhatsAppConnectionModalWrappedProps;

// Type guard to determine which pattern is being used
function isWrappedProps(props: WhatsAppConnectionModalProps): props is WhatsAppConnectionModalWrappedProps {
  return 'modalState' in props;
}

export function WhatsAppConnectionModal(props: WhatsAppConnectionModalProps) {
  // Normalize props to a common format
  const isWrapped = isWrappedProps(props);

  const connectionState = isWrapped
    ? props.modalState.connectionState
    : props.connectionState;

  const qrCode = isWrapped
    ? props.instance?.qrCode
    : props.qrCode;

  const errorMessage = isWrapped
    ? props.modalState.errorMessage
    : props.errorMessage;

  const instanceId = isWrapped
    ? (props.instance?.id ?? 1)
    : (props.instanceId ?? 1);

  const { isOpen, onClose, onGenerateQR, onDisconnect } = props;

  // Early return moved here after all hook-like operations
  if (!isOpen) return null;

  const getSubtitleText = () => {
    switch (connectionState) {
      case 'connected': return 'Conectado!';
      case 'ready': return 'Escaneie o QR Code';
      case 'generating': return 'Gerando QR Code...';
      case 'connecting':
      case 'scanning': return 'Conectando...';
      default: return 'Escolha como conectar';
    }
  };

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
                  <WhatsAppIcon className="w-6 h-6" style={{ color: '#25D366' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Conectar WhatsApp</h2>
                  <p className="text-white/50 text-sm">{getSubtitleText()}</p>
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

            {/* Idle State */}
            {connectionState === 'idle' && (
              <div className="space-y-4">
                <p className="text-white/60 text-sm mb-6">
                  Conecte seu WhatsApp para que seu agente possa atender seus clientes automaticamente.
                </p>

                <Button
                  onClick={() => onGenerateQR(instanceId)}
                  className="w-full py-6 text-lg rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white flex items-center justify-center gap-3"
                >
                  <QRCodeIcon />
                  Conectar com QR Code
                </Button>
              </div>
            )}

            {/* Generating State */}
            {connectionState === 'generating' && (
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

            {/* QR Code Ready State */}
            {connectionState === 'ready' && qrCode && (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl mb-6">
                  <img
                    src={qrCode}
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

            {/* Connecting/Scanning State */}
            {(connectionState === 'connecting' || connectionState === 'scanning') && (
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

            {/* Connected State */}
            {connectionState === 'connected' && (
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
                  {onDisconnect && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        onDisconnect(instanceId);
                        onClose();
                      }}
                      className="w-full py-4 text-base rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Desconectar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Error State */}
            {connectionState === 'error' && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                  <X className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Erro na Conexão</h3>
                <p className="text-white/60 text-center mb-6">
                  {errorMessage || 'Não foi possível conectar. Tente novamente.'}
                </p>
                <Button
                  onClick={() => onGenerateQR(instanceId)}
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

// Default export for backwards compatibility with the primary component
export default WhatsAppConnectionModal;