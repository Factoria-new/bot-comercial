import { Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AboutSection() {
    const stats = [
        { number: "10M+", label: "Mensagens Processadas" },
        { number: "500+", label: "Empresas Confiam" },
        { number: "99.9%", label: "Disponibilidade" },
        { number: "24/7", label: "Suporte Dedicado" }
    ];

    return (
        <section id="sobre" className="py-20 xl:py-32 bg-background relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #e2e8f0 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }} />
            </div>



            <div className="container mx-auto px-4 xl:px-8 relative z-10">
                {/* Header */}
                <div className="max-w-3xl mb-16">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 bg-[#00A947] rounded-full" />
                        <span className="text-sm font-semibold text-[#00A947] uppercase tracking-wider">
                            Quem Somos
                        </span>
                    </div>
                    <h2 className="text-4xl xl:text-5xl font-bold text-black mb-6">
                        Automatizando{' '}
                        <span className="text-[#00A947]">vendas</span>{' '}
                        no Brasil
                    </h2>
                    <p className="text-lg text-black">
                        Somos especialistas em criar agentes de IA que vendem. Tecnologia brasileira para empresas que querem crescer sem aumentar equipe.
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Large Feature Card - Mission */}
                    <Card className="relative border-border bg-card hover:shadow-2xl hover:border-[#00A947]/30 transition-all duration-300 group overflow-hidden transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <CardContent className="p-8 xl:p-10 relative">
                            <div className="w-14 h-14 rounded-lg bg-[#00A947] flex items-center justify-center mb-6">
                                <Target className="w-7 h-7 text-white" />
                            </div>
                            <CardHeader className="p-0 mb-4">
                                <CardTitle className="text-2xl xl:text-3xl text-black">
                                    Nossa Missão
                                </CardTitle>
                            </CardHeader>
                            <h3 className="text-xl font-semibold text-black mb-4">
                                Democratizar a IA para pequenas e médias empresas
                            </h3>
                            <p className="text-black text-lg">
                                Acreditamos que toda empresa merece acesso às melhores tecnologias de atendimento.
                            </p>


                        </CardContent>
                    </Card>

                    {/* Right Stack */}
                    <div className="flex flex-col gap-6">
                        {/* Stats Card */}
                        <Card className="border-border bg-card hover:shadow-2xl hover:border-[#00A947]/30 transition-all duration-300 transform hover:-translate-y-1">
                            <CardContent className="p-8">
                                <div className="grid grid-cols-2 gap-6">
                                    {stats.map((stat, i) => (
                                        <div key={i} className="text-center">
                                            <div className="text-3xl xl:text-4xl font-bold text-[#000000] mb-2">
                                                {stat.number}
                                            </div>
                                            <div className="text-sm text-black">
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vision Card */}
                        <Card className="border-border bg-card hover:shadow-2xl hover:border-[#00A947]/30 transition-all duration-300 group flex-1 transform hover:-translate-y-1">
                            <CardContent className="p-8 h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full bg-[#00A947]/20 flex items-center justify-center">
                                                <TrendingUp className="w-8 h-8 text-[#00A947]" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-black mb-3">
                                        Visão Global
                                    </h3>
                                    <p className="text-black text-lg">
                                        Expandindo fronteiras da inovação brasileira.
                                    </p>
                                </div>

                                {/* Decorative Elements */}
                                <div className="mt-6 flex gap-2">
                                    <div className="h-2 w-12 rounded-full bg-[#00A947]" />
                                    <div className="h-2 w-8 rounded-full bg-[#00A947]/60" />
                                    <div className="h-2 w-6 rounded-full bg-[#00A947]/30" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}
