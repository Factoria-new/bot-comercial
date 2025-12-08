import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { motion } from "framer-motion";

const testimonials = [
    {
        text: "Antes eu perdia vendas por demorar a responder. Com a Factoria, meu WhatsApp vende 24 horas por dia. O ROI foi imediato.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
        name: "Fernanda Silva",
        role: "Dona de E-commerce",
    },
    {
        text: "A capacidade de atender 500 clientes ao mesmo tempo sem perder a qualidade é impressionante. Minha equipe agora foca só no fechamento.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
        name: "Ricardo Mendes",
        role: "Gerente de Vendas",
    },
    {
        text: "Eu estava cético sobre IA, mas a naturalidade das conversas é assustadora. Meus clientes nem percebem que é um robô.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
        name: "Juliana Costa",
        role: "Diretora de Marketing",
    },
    {
        text: "Reduzimos nosso tempo de resposta de 2 horas para 2 segundos. A taxa de conversão subiu 40% no primeiro mês.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
        name: "Carlos Eduardo",
        role: "CEO",
    },
    {
        text: "A melhor parte é acordar e ver as vendas que aconteceram durante a madrugada. É literalmente ganhar dinheiro dormindo.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
        name: "Mariana Santos",
        role: "Fundadora",
    },
    {
        text: "A integração foi super simples e o suporte nos ajudou em cada etapa. Hoje não imagino minha operação sem isso.",
        image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80",
        name: "Patrícia Lima",
        role: "Líder de Operações",
    },
    {
        text: "O bot qualifica os leads perfeitamente. Só chegam para os vendedores os clientes prontos para comprar.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
        name: "Roberto Almeida",
        role: "Diretor Comercial",
    },
    {
        text: "Escalamos de 10 para 100 vendas diárias sem contratar nenhum atendente novo. A tecnologia se pagou na primeira semana.",
        image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=100&q=80",
        name: "Camila Rocha",
        role: "Growth Hacker",
    },
    {
        text: "Simplesmente revolucionário. O controle que tenho sobre os atendimentos e a consistência das respostas mudou nosso jogo.",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
        name: "Lucas Ferreira",
        role: "Empresário",
    },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export const TestimonialsSection = () => {
    return (
        <section className="bg-background my-20 relative">
            <div className="container z-10 mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
                >


                    <h2 className="text-xl text-center sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 ">
                        Transformando o atendimento do Brasil
                    </h2>
                    <p className="text-center mt-5 opacity-75">
                        Veja como empresas estão escalando suas vendas com nossa tecnologia.
                    </p>
                </motion.div>

                <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
                    <TestimonialsColumn testimonials={firstColumn} duration={15} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
                </div>
            </div>
        </section>
    );
};
