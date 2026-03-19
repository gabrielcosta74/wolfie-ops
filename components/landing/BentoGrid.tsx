"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import React, { MouseEvent } from "react";

// Inline Feature Highlight Card inspired by component1.txt with Mouse Tracking Spotlight
const FeatureCard = ({ 
  title, 
  description, 
  className, 
  delay = 0,
  children
}: { 
  title: string; 
  description: string; 
  className?: string;
  delay?: number;
  children?: React.ReactNode;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1, delay }}
      whileHover={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-[#020817] p-8 text-left transition-colors hover:bg-[#020817]/80 flex flex-col",
        className
      )}
    >
      {/* Dynamic Cursor Spotlight Overlay */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-500 group-hover:opacity-100 mix-blend-screen"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(59, 130, 246, 0.15),
              transparent 80%
            )
          `,
        }}
      />

      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        {/* Static subtle glow in background */}
        <div className="w-24 h-24 bg-blue-500 rounded-full blur-[50px]"></div>
      </div>
      
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tighter text-white mb-4">
          {title}
        </h3>
        <p className="text-slate-400 font-medium leading-relaxed mb-8 flex-grow">
          {description}
        </p>
        
        <div className="relative h-48 sm:h-auto sm:flex-grow w-full rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 flex items-center justify-center">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export function BentoGrid() {
  return (
    <section className="relative py-32 px-6 max-w-7xl mx-auto z-40 bg-transparent">
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="text-center mb-20"
      >
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">
          A tua vantagem injusta.
        </h2>
        <p className="mt-6 text-xl text-slate-400 tracking-tight max-w-2xl mx-auto">
          Tudo o que precisas para arrasar no exame, envolvido numa interface fluida e intuitiva.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[450px]">
        
        {/* Large Card: 7,111 Exercises */}
        <FeatureCard 
          title="Mais de 7.111 Exercícios" 
          description="Aceda a uma base de dados gigante de Matemática A. Domina cada sub-tópico com variações infinitas para que nunca tenhas de memorizar — apenas compreender genuinamente a matéria."
          className="md:col-span-2 md:row-span-2"
          delay={0.1}
        >
          {/* Visual Placeholder: Infinite scroll of questions or abstract geometry */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
             <div className="w-[150%] h-[150%] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
             <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400/50 to-emerald-400/50">7.111+</p>
          </div>
        </FeatureCard>

        {/* Small Card: 24/7 AI */}
        <FeatureCard 
          title="Tutor IA 24 horas" 
          description="Ficaste bloqueado num problema de Geometria às 2h da manhã? O Wolfi responde instantaneamente com guias passo-a-passo e dicas infalíveis."
          className="md:col-span-1 md:row-span-1"
          delay={0.2}
        >
          {/* Visual Placeholder: Chat bubbles */}
          <div className="flex flex-col gap-3 p-4 w-full opacity-80">
            <div className="bg-blue-600/30 self-end p-3 rounded-2xl rounded-tr-sm text-sm text-blue-100 max-w-[80%]">Como integro de x a 2?</div>
            <div className="bg-slate-800/80 self-start p-3 rounded-2xl rounded-tl-sm text-sm text-slate-300 max-w-[80%] border border-white/5">Vamos dividir em partes. Primeiro repara que a derivada...</div>
          </div>
        </FeatureCard>

        {/* Small Card: Exam Simulation */}
        <FeatureCard 
          title="Simulação Real IAVE" 
          description="Treina com a exata pressão dos exames. Controla limites de tempo, formatação e critérios rígidos de avaliação oficiais de Portugal."
          className="md:col-span-1 md:row-span-1"
          delay={0.3}
        >
           <div className="flex items-center justify-center w-full h-full">
              <svg width="80" height="80" className="text-blue-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </div>
        </FeatureCard>

      </div>
    </section>
  );
}
