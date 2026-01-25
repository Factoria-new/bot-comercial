import { Target, TrendingUp, Cpu, Shield, Share2, Zap, Users, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function AboutSection() {
    return (
        <section id="sobre" className="py-24 xl:py-32 relative overflow-hidden bg-white/50">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00A947]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 xl:px-8 relative z-10">
                {/* Header Section */}
                <div className="max-w-3xl mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A947]/10 border border-[#00A947]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00A947]" />
                        <span className="text-xs font-bold text-[#00A947] uppercase tracking-wider">
                            Quem Somos
                        </span>
                    </div>

                    <h2 className="text-4xl xl:text-5xl font-bold text-black tracking-tight">
                        A força invisível que <br />
                        <span className="text-[#00A947]">impulsiona seus resultados</span>
                    </h2>

                    <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                        Não somos apenas uma ferramenta de automação. Somos uma tecnologia de ponta
                        desenvolvida para multiplicar a capacidade humana de vender e atender.
                    </p>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">

                    {/* Card 1: Main Mission (Large) */}
                    <Card className="md:col-span-2 row-span-2 relative overflow-hidden group border-zinc-200 hover:border-[#00A947]/30 transition-all duration-500 hover:shadow-xl bg-white">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00A947]/10 to-transparent rounded-bl-full z-0 transition-transform duration-700 group-hover:scale-110" />

                        <CardContent className="p-8 xl:p-10 relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="w-12 h-12 rounded-xl bg-[#00A947] text-white flex items-center justify-center mb-6 shadow-lg shadow-[#00A947]/20">
                                    <Target className="w-6 h-6" />
                                </div>
                                <h3 className="text-3xl font-bold text-black mb-4">
                                    Nossa Missão
                                </h3>
                                <p className="text-gray-600 text-lg leading-relaxed max-w-xl">
                                    Democratizar o acesso à Inteligência Artificial de alta performance.
                                    Transformamos interações complexas em diálogos fluidos que convertem,
                                    permitindo que empresas de qualquer tamanho joguem de igual para igual
                                    com os gigantes do mercado.
                                </p>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-3xl font-bold text-black">10M+</span>
                                    <span className="text-sm text-gray-500 font-medium">Mensagens Processadas</span>
                                </div>
                                <div className="w-px bg-gray-200" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-3xl font-bold text-black">500+</span>
                                    <span className="text-sm text-gray-500 font-medium">Empresas Ativas</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Technology (Tall) */}
                    <Card className="row-span-2 relative overflow-hidden group border-zinc-200 hover:border-[#00A947]/30 transition-all duration-500 hover:shadow-xl bg-black text-white">
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black opacity-50" />
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00A947] via-transparent to-transparent" />

                        <CardContent className="p-8 relative z-10 h-full flex flex-col">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm text-[#00A947] flex items-center justify-center mb-6 border border-white/10">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Tecnologia Proprietária</h3>
                            <p className="text-zinc-400 mb-6 flex-grow">
                                Desenvolvemos uma arquitetura neural exclusiva focada em:
                            </p>
                            <ul className="space-y-4">
                                {[
                                    { icon: Zap, text: "Respostas em < 2s" },
                                    { icon: Users, text: "Contexto Infinito" },
                                    { icon: Share2, text: "Aprendizado Contínuo" }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-zinc-300">
                                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                                            <item.icon className="w-4 h-4 text-[#00A947]" />
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Card 3: Security */}
                    <Card className="group border-zinc-200 hover:border-[#00A947]/30 transition-all duration-300 hover:shadow-lg bg-white">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-black text-lg mb-1">Segurança Militar</h4>
                                <p className="text-sm text-gray-500">
                                    Criptografia ponta a ponta e total conformidade com a LGPD.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 4: Integrity/Integration */}
                    <Card className="group border-zinc-200 hover:border-[#00A947]/30 transition-all duration-300 hover:shadow-lg bg-white">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-black text-lg mb-1">Dados Blindados</h4>
                                <p className="text-sm text-gray-500">
                                    Seus dados são seus. Não usamos informações de clientes para treinar modelos públicos.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 5: Vision (Wide) */}
                    <Card className="md:col-span-2 xl:col-span-1 group border-zinc-200 hover:border-[#00A947]/30 transition-all duration-300 hover:shadow-lg bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-lg bg-[#00A947]/10 text-[#00A947]">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-black text-lg">Visão de Futuro</h4>
                            </div>
                            <p className="text-sm text-gray-500">
                                Expandindo fronteiras da inovação brasileira para o mercado global,
                                criando o padrão-ouro em atendimento automatizado.
                            </p>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </section>
    );
}
