import { SimpleHeader } from "@/components/SimpleHeader";
import Footer from "@/components/footer";

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <SimpleHeader />
            <main className="flex-grow pt-32 pb-16 px-4 md:px-8 font-['Poppins']">
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Termos de Serviço</h1>
                    <div className="prose prose-slate max-w-none text-slate-600">
                        <p className="mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar e usar os serviços da Caji Solutions, você concorda em cumprir e ficar vinculado a estes Termos de Serviço e todas as leis e regulamentos aplicáveis.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">2. Licença de Uso</h2>
                        <p>
                            Concedemos a você uma licença limitada, não exclusiva e intransferível para usar nossos serviços para fins pessoais ou comerciais internos, de acordo com estes termos.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">3. Responsabilidades do Usuário</h2>
                        <p>
                            Você é responsável por manter a confidencialidade de sua conta e senha. Você concorda em não usar o serviço para qualquer finalidade ilegal ou não autorizada.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">4. Propriedade Intelectual</h2>
                        <p>
                            Todo o conteúdo, marcas e tecnologia relacionados aos nossos serviços são de propriedade exclusiva da Caji Solutions ou de seus licenciadores.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">5. Limitação de Responsabilidade</h2>
                        <p>
                            Em nenhum caso a Caji Solutions será responsável por quaisquer danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou incapacidade de usar nossos serviços.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">6. Alterações nos Termos</h2>
                        <p>
                            Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação no site.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">7. Contato</h2>
                        <p>
                            Para dúvidas sobre os Termos de Serviço, entre em contato: contact@cajiassist.com
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;
