import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TermsModal = ({ isOpen, onClose }: TermsModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold text-slate-900">
                        Termos e Condições de Uso
                    </DialogTitle>
                    <DialogDescription>
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 pt-2">
                    <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">1. Aceitação dos Termos</h3>
                            <p>
                                Ao utilizar os serviços da Caji Assist, você concorda com estes Termos e Condições.
                                Se você não concordar com qualquer parte destes termos, você não deve utilizar nosso serviço.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">2. Descrição do Serviço</h3>
                            <p>
                                A Caji Assist fornece assistentes virtuais baseados em inteligência artificial para automação de atendimento
                                via WhatsApp e integração com Google Calendar.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">3. Coleta e Uso de Dados</h3>
                            <p className="mb-2">
                                Para o funcionamento adequado dos nossos serviços, coletamos e processamos os seguintes dados:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Dados de Conta:</strong> Nome, e-mail e informações de pagamento.</li>
                                <li><strong>WhatsApp:</strong> Ao conectar seu WhatsApp, temos acesso às mensagens recebidas e enviadas para permitir que o assistente responda automaticamente. Armazenamos o histórico de conversas em nosso banco de dados seguro para manter o contexto dos atendimentos.</li>
                                <li><strong>Google Calendar:</strong> Ao integrar com o Google Calendar, solicitamos permissão para visualizar e gerenciar seus eventos para realizar agendamentos automáticos.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">4. Privacidade e Segurança</h3>
                            <p>
                                Levamos a sua privacidade a sério. Seus dados são armazenados de forma segura e não compartilhamos
                                suas informações pessoais ou histórico de conversas com terceiros, exceto conforme necessário para
                                a prestação do serviço (como provedores de IA e infraestrutura).
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">5. Responsabilidades do Usuário</h3>
                            <p>
                                Você é responsável por manter a confidencialidade de sua conta e por todas as atividades que ocorram
                                sob ela. O uso do assistente para fins ilegais ou não autorizados é estritamente proibido.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">6. Pagamentos e Cancelamento</h3>
                            <p>
                                O serviço é cobrado de acordo com o plano selecionado (Mensal, Semestral ou Anual).
                                Você pode cancelar sua assinatura a qualquer momento, mantendo o acesso até o final do período pago.
                            </p>
                        </section>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
