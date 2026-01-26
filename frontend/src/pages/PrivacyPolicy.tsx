import { SimpleHeader } from "@/components/SimpleHeader";
import Footer from "@/components/footer";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <SimpleHeader />
            <main className="flex-grow pt-32 pb-16 px-4 md:px-8 font-['Poppins']">
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Política de Privacidade</h1>
                    <div className="prose prose-slate max-w-none text-slate-600">
                        <p className="mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">1. Introdução</h2>
                        <p>
                            A Caji Solutions ("nós", "nosso" ou "empresa") está comprometida em proteger a sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você visita nosso site ou usa nossos serviços.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">2. Coleta de Informações</h2>
                        <p>
                            Podemos coletar informações pessoais que você nos fornece voluntariamente, como nome, endereço de e-mail e número de telefone, quando você se registra em nossos serviços ou entra em contato conosco.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">3. Uso das Informações</h2>
                        <p>
                            Usamos as informações coletadas para fornecer e melhorar nossos serviços, comunicar com você, e para fins de marketing e promoções, sempre respeitando suas preferências.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">4. Compartilhamento de Dados</h2>
                        <p>
                            Não vendemos suas informações pessoais para terceiros. Podemos compartilhar dados com prestadores de serviços confiáveis que nos ajudam a operar nosso negócio, desde que concordem em manter essas informações confidenciais.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">5. Segurança</h2>
                        <p>
                            Implementamos medidas de segurança para proteger suas informações pessoais. No entanto, nenhum método de transmissão pela Internet é 100% seguro, e não podemos garantir segurança absoluta.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">6. Seus Direitos</h2>
                        <p>
                            Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. Entre em contato conosco através do e-mail de suporte para exercer esses direitos.
                        </p>

                        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">7. Contato</h2>
                        <p>
                            Se tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco pelo e-mail: contact@cajiassist.com
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
