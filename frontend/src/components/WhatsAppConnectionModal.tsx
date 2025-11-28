import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Loader, CheckCircle2, XCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ConnectionState = 'generating' | 'ready' | 'scanning' | 'connecting' | 'connected' | 'error' | 'input-phone' | 'pairing';

interface WhatsAppConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionState: ConnectionState;
  qrCode?: string;
  errorMessage?: string;
  instanceName: string;
  onConnect: (phoneNumber: string) => void;
  pairingCode?: string;
}

const WhatsAppConnectionModal = ({
  isOpen,
  onClose,
  connectionState,
  qrCode,
  errorMessage,
  instanceName,
  onConnect,
  pairingCode
}: WhatsAppConnectionModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');

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
      case 'input-phone':
        return (
          <form onSubmit={handleConnectSubmit} className="flex flex-col space-y-4 py-4 px-4">
            <div className="text-center space-y-2 mb-2">
              <h3 className="text-lg font-semibold text-white">Conectar ao WhatsApp</h3>
              <p className="text-sm text-white/80">Digite o número do telefone para gerar o código de pareamento</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Número do Telefone</Label>
              <Input
                id="phone"
                placeholder="Ex: 5511999999999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                autoFocus
              />
              <p className="text-xs text-white/60">Inclua o código do país (ex: 55 para Brasil)</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-mint-glow text-[#243B6B] text-white hover:bg-mint-glow/90 font-semibold"
              disabled={!phoneNumber || phoneNumber.length < 10}
            >
              Gerar Código de Pareamento
            </Button>
          </form>
        );

      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 py-6 sm:py-8 px-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center">
                <QrCode size={24} className="sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-white">Gerando Código</h3>
              <p className="text-xs sm:text-sm text-white/80">Preparando código para {instanceName}...</p>
            </div>
          </div>
        );

      case 'pairing':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-6 px-4">
            <div className="text-center space-y-2 mb-4">
              <h3 className="text-lg font-semibold text-white">Código de Pareamento</h3>
              <p className="text-sm text-white/80">Digite este código no seu WhatsApp</p>
            </div>

            <div className="bg-white/95 p-6 rounded-xl border border-white/40 backdrop-blur-xl shadow-2xl w-full max-w-xs text-center">
              <span className="text-3xl font-mono font-bold tracking-widest text-[#243B6B]">
                {pairingCode ?
                  `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}` :
                  '....-....'
                }
              </span>
            </div>

            <div className="text-center space-y-2 max-w-sm mt-4">
              <div className="space-y-1 text-left bg-white/10 p-4 rounded-lg">
                <p className="text-sm text-white font-medium mb-2">Como conectar:</p>
                <p className="text-xs text-white/90">1. Abra o WhatsApp no celular</p>
                <p className="text-xs text-white/90">2. Vá em Configurações › Aparelhos conectados</p>
                <p className="text-xs text-white/90">3. Toque em "Conectar um aparelho"</p>
                <p className="text-xs text-white/90">4. Toque em "Conectar com número de telefone"</p>
                <p className="text-xs text-white/90">5. Digite o código acima</p>
              </div>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 py-3 sm:py-4 px-4">
            {qrCode && (
              <>
                <div className="bg-white/95 p-2 sm:p-4 rounded-xl border border-white/40 backdrop-blur-xl shadow-2xl max-w-full" style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                }}>
                  <img
                    src={qrCode}
                    alt="Código WhatsApp"
                    className="w-48 h-48 sm:w-64 sm:h-64 object-contain mx-auto"
                  />
                </div>
                <div className="text-center space-y-2 max-w-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Escaneie o Código</h3>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-white/90">1. Abra o WhatsApp no seu celular</p>
                    <p className="text-xs sm:text-sm text-white/90">2. Vá em Configurações › Aparelhos conectados</p>
                    <p className="text-xs sm:text-sm text-white/90">3. Clique em "Conectar um aparelho"</p>
                    <p className="text-xs sm:text-sm text-white/90">4. Escaneie este código</p>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'scanning':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 py-6 sm:py-8 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-400/20 rounded-full flex items-center justify-center">
              <Loader size={24} className="sm:w-8 sm:h-8 text-yellow-400 animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-yellow-400">Verificando Código</h3>
              <p className="text-xs sm:text-sm text-white/80">Detectamos que você inseriu o código...</p>
            </div>
          </div>
        );

      case 'connecting':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 py-6 sm:py-8 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Loader size={24} className="sm:w-8 sm:h-8 text-white animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-white">Conectando ao WhatsApp</h3>
              <p className="text-xs sm:text-sm text-white/80">Estabelecendo conexão segura...</p>
            </div>
          </div>
        );

      case 'connected':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 py-6 sm:py-8 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-400/20 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="sm:w-10 sm:h-10 text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-white">Conectado com Sucesso!</h3>
              <p className="text-xs sm:text-sm text-white/80">{instanceName} está pronto para uso</p>
            </div>
            <Button
              onClick={onClose}
              className="bg-white text-[#243B6B] hover:bg-white/90 transition-all duration-300 w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base font-semibold"
            >
              Fechar
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 py-6 sm:py-8 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-400/20 rounded-full flex items-center justify-center">
              <XCircle size={32} className="sm:w-10 sm:h-10 text-red-400" />
            </div>
            <div className="text-center space-y-2 max-w-sm">
              <h3 className="text-base sm:text-lg font-semibold text-red-400">Erro na Conexão</h3>
              <p className="text-xs sm:text-sm text-white/80">{errorMessage || 'Não foi possível conectar ao WhatsApp'}</p>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-red-400/50 text-red-400 hover:bg-red-400/10 w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base"
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
        <DialogContent className="w-[95vw] max-w-md sm:max-w-md bg-[#243B6B] border border-[#1e3257] backdrop-blur-lg shadow-2xl mx-auto">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <DialogTitle className="text-center text-lg sm:text-xl font-bold text-white">
              WhatsApp Web
            </DialogTitle>
          </DialogHeader>
          {renderContent()}

          {/* Botão Cancelar para estados em progresso */}
          {(connectionState === 'generating' || connectionState === 'ready' || connectionState === 'scanning' || connectionState === 'connecting' || connectionState === 'input-phone' || connectionState === 'pairing') && (
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