import { SimpleHeader } from "@/components/SimpleHeader";
import Footer from "@/components/footer";

const Lgpd = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <SimpleHeader />
            <main className="flex-grow pt-32 pb-16 px-4 md:px-8 font-['Poppins']">
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">LGPD - Lei Geral de Proteção de Dados</h1>
                    <div className="prose prose-slate max-w-none text-slate-600">
                        <p className="mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">1. Nosso Compromisso com a LGPD</h2>
                        <p>
                            A Caji Solutions está comprometida com a proteção dos seus dados pessoais e com o cumprimento da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">2. Seus Direitos como Titular de Dados</h2>
                        <p>
                            De acordo com a LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>Confirmação da existência de tratamento;</li>
                            <li>Acesso aos dados;</li>
                            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                            <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                            <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
                            <li>Eliminação dos dados pessoais tratados com o consentimento do titular;</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">3. Como Coletamos e Tratamos Dados</h2>
                        <p>
                            Coletamos apenas os dados necessários para a prestação dos nossos serviços, sempre com base legal adequada, como consentimento ou execução de contrato.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">4. Encarregado de Dados (DPO)</h2>
                        <p>
                            Para exercer seus direitos ou tirar dúvidas sobre o tratamento de seus dados pessoais, você pode entrar em contato com nosso Encarregado de Proteção de Dados.
                        </p>
                        <p className="mt-2 font-medium">E-mail para contato: contact@cajiassist.com</p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">5. Segurança da Informação</h2>
                        <p>
                            Adotamos medidas técnicas e administrativas para proteger seus dados pessoais contra acessos não autorizados e situações acidentais ou ilícitas.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Lgpd;
