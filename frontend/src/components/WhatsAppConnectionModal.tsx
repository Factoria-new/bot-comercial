import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import {
  Loader,
  CheckCircle2,
  XCircle,
  QrCode,
  Smartphone,
  LogOut,
  Lock,
  MessageSquare,
  Users,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ConnectionState = 'selection' | 'generating' | 'ready' | 'scanning' | 'connecting' | 'connected' | 'error' | 'input-phone' | 'pairing';

interface WhatsAppConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionState: ConnectionState;
  qrCode?: string;
  errorMessage?: string;
  instanceName: string;
  onConnect: (phoneNumber: string) => void;
  onMethodSelected: (method: 'qr' | 'code') => void;
  pairingCode?: string;
  onDisconnect?: () => void;
}

const WhatsAppConnectionModal = ({
  isOpen,
  onClose,
  connectionState,
  qrCode,
  errorMessage,
  instanceName,
  onConnect,
  onMethodSelected,
  pairingCode,
  onDisconnect
}: WhatsAppConnectionModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  // NEW: Loading animation state
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const connectingSteps = [
    { text: "Estabelecendo conexão segura...", icon: Lock },
    { text: "Sincronizando conversas...", icon: MessageSquare },
    { text: "Importando contatos...", icon: Users },
    { text: "Finalizando configuração...", icon: ShieldCheck }
  ];

  // Cycle through connecting steps
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (connectionState === 'connecting' || connectionState === 'scanning') {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % connectingSteps.length);
      }, 2000);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [connectionState]);

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber) {
      // Remove caracteres não numéricos
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      onConnect(cleanPhone);
    }
  };

  const renderContent = () => {
    switch (connectionState) {
      case 'selection':
        return (
          <div className="flex flex-col space-y-6 py-6 px-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Como deseja conectar?</h3>
              <p className="text-sm text-gray-600">Escolha o método de conexão para {instanceName}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => onMethodSelected('qr')}
                className="flex flex-col items-center justify-center p-6 space-y-3 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-[#19B159] hover:bg-[#19B159]/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#19B159]/20 transition-colors">
                  <QrCode className="w-6 h-6 text-gray-600 group-hover:text-[#19B159]" />
                </div>
                <div className="text-center">
                  <span className="block font-medium text-gray-900">QR Code</span>
                  <span className="text-xs text-gray-500">Escanear com a câmera</span>
                </div>
              </button>

              <button
                onClick={() => onMethodSelected('code')}
                className="flex flex-col items-center justify-center p-6 space-y-3 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-[#19B159] hover:bg-[#19B159]/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#19B159]/20 transition-colors">
                  <Smartphone className="w-6 h-6 text-gray-600 group-hover:text-[#19B159]" />
                </div>
                <div className="text-center">
                  <span className="block font-medium text-gray-900">Código</span>
                  <span className="text-xs text-gray-500">Digitar número</span>
                </div>
              </button>
            </div>
          </div>
        );

      case 'input-phone':
        return (
          <form onSubmit={handleConnectSubmit} className="flex flex-col space-y-4 py-4 px-4">
            <div className="text-center space-y-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Conectar ao WhatsApp</h3>
              <p className="text-sm text-gray-600">Digite o número do telefone para gerar o código de pareamento</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700">Número do Telefone</Label>
              <Input
                id="phone"
                placeholder="Ex: 5511999999999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus-visible:ring-[#00A947] focus:border-[#BCBCBC] transition-colors"
                autoFocus
              />
              <p className="text-xs text-gray-500">Inclua o código do país (ex: 55 para Brasil)</p>
            </div>

            <Button
              type="submit"
              className="w-full btn-qr-code rounded-xl h-10 sm:h-11 text-sm sm:text-base"
              disabled={!phoneNumber || phoneNumber.length < 10}
            >
              Gerar Código de Pareamento
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => onMethodSelected('qr')}
              className="w-full flex items-center justify-center gap-2 border-dashed border-gray-300 hover:border-[#19B159] text-gray-600 hover:text-[#19B159] hover:bg-[#19B159]/5 transition-all h-10 items-center justify-center"
            >
              <QrCode size={16} />
              Conectar com QR Code
            </Button>
          </form>
        );

      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 py-6 sm:py-8 px-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#19B159]/10 rounded-full flex items-center justify-center">
                <QrCode size={24} className="sm:w-8 sm:h-8 text-[#19B159]" />
              </div>
              <div className="absolute inset-0 border-4 border-transparent border-t-[#19B159] rounded-full animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Gerando Código</h3>
              <p className="text-xs sm:text-sm text-gray-600">Preparando código para {instanceName}...</p>
            </div>

          </div>
        );

      case 'pairing':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-6 px-4">
            <div className="text-center space-y-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Código de Pareamento</h3>
              <p className="text-sm text-gray-600">Digite este código no seu WhatsApp</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm w-full max-w-xs text-center">
              <span className="text-3xl font-mono font-bold tracking-widest text-[#00A947]">
                {pairingCode ?
                  `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}` :
                  '....-....'
                }
              </span>
            </div>

            <div className="text-center space-y-2 max-w-sm mt-4">
              <div className="space-y-1 text-left bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-900 font-medium mb-2">Como conectar:</p>
                <p className="text-xs text-gray-600">1. Abra o WhatsApp no celular</p>
                <p className="text-xs text-gray-600">2. Vá em Configurações › Aparelhos conectados</p>
                <p className="text-xs text-gray-600">3. Toque em "Conectar um aparelho"</p>
                <p className="text-xs text-gray-600">4. Toque em "Conectar com número de telefone"</p>
                <p className="text-xs text-gray-600">5. Digite o código acima</p>
              </div>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 py-3 sm:py-4 px-4">
            {qrCode && (
              <>
                <div className="bg-white p-2 sm:p-4 rounded-xl border border-gray-100 shadow-lg max-w-full">
                  <img
                    src={qrCode}
                    alt="Código WhatsApp"
                    className="w-48 h-48 sm:w-64 sm:h-64 object-contain mx-auto"
                  />
                </div>
                <div className="text-center space-y-2 max-w-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Escaneie o Código</h3>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-gray-600">1. Abra o WhatsApp no seu celular</p>
                    <p className="text-xs sm:text-sm text-gray-600">2. Vá em Configurações › Aparelhos conectados</p>
                    <p className="text-xs sm:text-sm text-gray-600">3. Clique em "Conectar um aparelho"</p>
                    <p className="text-xs sm:text-sm text-gray-600">4. Escaneie este código</p>
                  </div>
                </div>

                <div className="pt-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onMethodSelected('code')}
                    className="w-full flex items-center justify-center gap-2 border-dashed border-gray-300 hover:border-[#19B159] text-gray-600 hover:text-[#19B159] hover:bg-[#19B159]/5 transition-all h-10"
                  >
                    <Smartphone size={16} />
                    Conectar com número de telefone
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      case 'scanning':
      case 'connecting':
        const CurrentIcon = connectingSteps[loadingStepIndex].icon;
        return (
          <div className="flex flex-col items-center justify-center space-y-6 py-8 px-4 h-[300px]"> {/* Fixed height to prevent layout shifts */}
            <div className="relative">
              {/* Outer ring */}
              <div className="w-24 h-24 border-4 border-[#19B159]/20 rounded-full"></div>
              {/* Spinning ring */}
              <div className="absolute inset-0 border-4 border-t-[#19B159] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>

              {/* Centered Icon with Transition */}
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={loadingStepIndex}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3 }}
                    className="text-[#19B159]"
                  >
                    <CurrentIcon size={32} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="text-center space-y-2 h-[60px] flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {connectionState === 'scanning' ? 'Verificando Código' : 'Conectando ao WhatsApp'}
              </h3>
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingStepIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-gray-600"
                >
                  {connectingSteps[loadingStepIndex].text}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        );

      case 'connected':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 py-6 sm:py-8 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="sm:w-10 sm:h-10 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Conectado com Sucesso!</h3>
              <p className="text-xs sm:text-sm text-gray-600">Seu WhatsApp está pronto para receber mensagens.</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={onClose}
                className="bg-[#19B159] text-white hover:bg-[#19B159]/90 transition-all duration-300 w-full h-10 sm:h-11 text-sm sm:text-base font-semibold"
              >
                Continuar
              </Button>
              {onDisconnect && (
                <Button
                  onClick={() => {
                    onDisconnect();
                    onClose();
                  }}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-10 sm:h-11 text-sm sm:text-base"
                >
                  <LogOut size={16} />
                  Desconectar
                </Button>
              )}
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 py-6 sm:py-8 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle size={32} className="sm:w-10 sm:h-10 text-red-600" />
            </div>
            <div className="text-center space-y-2 max-w-sm">
              <h3 className="text-base sm:text-lg font-semibold text-red-600">Erro na Conexão</h3>
              <p className="text-xs sm:text-sm text-gray-600">{errorMessage || 'Não foi possível conectar ao WhatsApp'}</p>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base"
            >
              Fechar
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 backdrop-blur-md bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogContent className="w-[95vw] max-w-md sm:max-w-md bg-white border border-gray-200 shadow-xl mx-auto">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <DialogTitle className="text-center text-lg sm:text-xl font-bold text-gray-900">
              WhatsApp Web
            </DialogTitle>
          </DialogHeader>
          {renderContent()}

          {/* Botão Cancelar para estados em progresso */}
          {(connectionState === 'generating' || connectionState === 'ready' || connectionState === 'scanning' || connectionState === 'connecting' || connectionState === 'input-phone' || connectionState === 'pairing' || connectionState === 'selection') && (
            <div className="flex justify-center pb-4 px-4 sm:px-6">
              <Button
                onClick={onClose}
                variant="outline"
                className="min-w-[100px] w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base btn-destructive"
              >
                Cancelar
              </Button>
            </div>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default WhatsAppConnectionModal; 