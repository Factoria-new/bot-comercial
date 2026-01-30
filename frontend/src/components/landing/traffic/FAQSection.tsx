import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQSection = () => {
    const faqs = [
        {
            question: "Preciso saber programar para usar?",
            answer: "Não! O Caji Assist foi feito para ser plug-and-play. Com poucos cliques você conecta seu WhatsApp, faz upload dos seus arquivos de treinamento e a IA já começa a aprender."
        },
        {
            question: "A IA entende áudio?",
            answer: "Sim, nossa tecnologia é capaz de transcrever e entender mensagens de voz enviadas pelos clientes, respondendo em texto de forma natural."
        },
        {
            question: "Posso intervir na conversa se precisar?",
            answer: "Com certeza. Você tem acesso a um painel de controle onde pode ver todas as conversas em tempo real e assumir o controle manualmente a qualquer momento."
        },
        {
            question: "Funciona 24 horas por dia?",
            answer: "Sim, seu agente virtual trabalha 24/7 sem interrupções, garantindo que nenhum lead fique sem resposta, mesmo de madrugada ou finais de semana."
        },
        {
            question: "É seguro conectar meu WhatsApp?",
            answer: "Utilizamos a API Oficial do WhatsApp (ou os métodos de conexão mais seguros do mercado), garantindo estabilidade e segurança para sua conta."
        }
    ];

    return (
        <section className="py-24 bg-lp-background/50">
            <div className="container px-4 md:px-6 max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                        Dúvidas Frequentes
                    </h2>
                    <p className="text-lp-muted-foreground text-lg">
                        Tudo o que você precisa saber sobre a implementação.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqs.map((faq, index) => (
                        <AccordionItem
                            key={index}
                            value={`item-${index}`}
                            className="border border-lp-border/30 rounded-xl bg-lp-card px-6 data-[state=open]:border-lp-accent/50 transition-colors"
                        >
                            <AccordionTrigger className="text-lg font-medium text-white hover:text-lp-accent hover:no-underline py-6">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-lp-muted-foreground text-base pb-6">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
};

export default FAQSection;
