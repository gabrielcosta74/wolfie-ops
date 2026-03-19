"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function CinematicFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // --- PHASE 1: Introduction (0.0 to 0.2) ---
  const introOpacity = useTransform(scrollYProgress, [0, 0.1, 0.15], [1, 1, 0]);
  const introScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.2]);
  const introY = useTransform(scrollYProgress, [0, 0.15], [0, -100]);

  // --- PHASE 2: 7,111+ Exercises (0.15 to 0.45) ---
  const phase2Opacity = useTransform(scrollYProgress, [0.15, 0.2, 0.4, 0.45], [0, 1, 1, 0]);
  const phase2Scale = useTransform(scrollYProgress, [0.15, 0.3, 0.45], [0.8, 1, 1.2]);
  const phase2Y = useTransform(scrollYProgress, [0.15, 0.3, 0.45], [100, 0, -100]);

  // --- PHASE 3: 24/7 AI Tutor (0.45 to 0.75) ---
  const phase3Opacity = useTransform(scrollYProgress, [0.45, 0.5, 0.7, 0.75], [0, 1, 1, 0]);
  const phase3Scale = useTransform(scrollYProgress, [0.45, 0.6, 0.75], [0.8, 1, 1.1]);
  const phase3Y = useTransform(scrollYProgress, [0.45, 0.6, 0.75], [100, 0, -100]);

  // Messages in Phase 3
  const msg1Y = useTransform(scrollYProgress, [0.5, 0.6], [50, 0]);
  const msg1Opacity = useTransform(scrollYProgress, [0.5, 0.55], [0, 1]);
  const msg2Y = useTransform(scrollYProgress, [0.55, 0.65], [50, 0]);
  const msg2Opacity = useTransform(scrollYProgress, [0.55, 0.6], [0, 1]);

  // --- PHASE 4: IAVE Simulation (0.75 to 1.0) ---
  const phase4Opacity = useTransform(scrollYProgress, [0.75, 0.8, 1], [0, 1, 1]);
  const phase4Scale = useTransform(scrollYProgress, [0.75, 0.9, 1], [0.8, 1, 1]);
  const phase4Y = useTransform(scrollYProgress, [0.75, 0.9, 1], [100, 0, 0]);

  return (
    <section ref={containerRef} className="relative h-[400vh] bg-[#020617]">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center perspective-[1000px]">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

        {/* --- PHASE 1: Introduction --- */}
        <motion.div 
          style={{ opacity: introOpacity, scale: introScale, y: introY }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
        >
          <div className="inline-flex mb-8 items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300 backdrop-blur-md uppercase tracking-widest">
            A Anatomia do Sistema
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
            A tua vantagem <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-cyan-200">injusta.</span>
          </h2>
          <p className="mt-8 text-xl md:text-2xl text-slate-400 font-medium tracking-tight max-w-2xl">
            Tudo o que precisas para arrasar no exame. Desenhado com precisão cirúrgica.
          </p>
        </motion.div>

        {/* --- PHASE 2: 7,111+ Exercises --- */}
        <motion.div 
          style={{ opacity: phase2Opacity, scale: phase2Scale, y: phase2Y }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <div className="relative w-full max-w-4xl px-4 flex flex-col items-center">
            {/* The Giant Number Graphic */}
            <div className="relative flex items-center justify-center mb-12">
               <div className="absolute inset-0 bg-blue-500/20 blur-[120px] rounded-full" />
               <h3 className="text-[8rem] md:text-[14rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-white opacity-90 drop-shadow-[0_0_80px_rgba(59,130,246,0.3)]">
                  7.111<span className="text-blue-500">+</span>
               </h3>
            </div>
            
            <h4 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
              O Treino Infinito.
            </h4>
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium">
              Variações infinitas de parâmetros. Compreende genuinamente a matemática em vez de memorizares os passos. Nunca mais te vai calhar um padrão que não conheças.
            </p>
          </div>
        </motion.div>

        {/* --- PHASE 3: 24/7 AI Tutor --- */}
        <motion.div 
          style={{ opacity: phase3Opacity, scale: phase3Scale, y: phase3Y }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4"
        >
          <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
             
             {/* Left: Holographic Chat UI */}
             <div className="relative h-[400px] w-full flex flex-col justify-end pb-8">
                {/* Glow */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-cyan-500/20 blur-[100px] rounded-full" />
                
                <motion.div style={{ y: msg1Y, opacity: msg1Opacity }} className="self-end max-w-[80%] mb-6">
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl rounded-tr-sm shadow-2xl text-white font-medium text-lg">
                    Como derivo f(x) = sin(x²)? Fico sempre preso nisto...
                  </div>
                </motion.div>

                <motion.div style={{ y: msg2Y, opacity: msg2Opacity }} className="self-start max-w-[90%] flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-300 shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">W</span>
                  </div>
                  <div className="backdrop-blur-xl bg-blue-900/30 border border-blue-500/20 p-5 rounded-3xl rounded-tl-sm shadow-2xl text-blue-100 font-medium text-lg leading-relaxed">
                    Vamos usar a Regra da Cadeia! Derivamos o exterior "sin" (que fica "cos") e multiplicamos pela derivada do interior "x²" (que é "2x"). Assim: <br/><br/>
                    <span className="font-mono bg-black/40 px-2 py-1 rounded text-emerald-300">f'(x) = 2x · cos(x²)</span>
                  </div>
                </motion.div>
             </div>

             {/* Right: Copy */}
             <div className="text-center lg:text-left space-y-6 lg:pl-12">
                <h4 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                  Sempre acordado. <br className="hidden lg:block"/>
                  <span className="text-cyan-400">Sempre genial.</span>
                </h4>
                <p className="text-xl md:text-2xl text-slate-400 font-medium">
                  Preso à meia noite? O Wolfi guia-te com dicas cirúrgicas e explicações à prova de bala invés de te dar apenas a resposta.
                </p>
             </div>
          </div>
        </motion.div>

        {/* --- PHASE 4: IAVE Simulation --- */}
        <motion.div 
          style={{ opacity: phase4Opacity, scale: phase4Scale, y: phase4Y }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 backdrop-blur-[2px] bg-black/20"
        >
          <div className="max-w-4xl space-y-12">
            <h4 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
              Pressão <span className="text-red-500">Real.</span>
            </h4>
            <div className="relative mx-auto w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] transform-style-3d">
               {/* UI Mockup of the Exam Environment */}
               <div className="absolute top-0 left-0 right-0 h-1 w-full bg-red-500/20 rounded-t-3xl overflow-hidden">
                 <div className="h-full w-2/3 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
               </div>
               
               <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                 <div className="text-left">
                   <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Simulação Oficial</div>
                   <div className="text-xl font-bold text-white">Exame Nacional 2024</div>
                 </div>
                 <div className="flex items-center gap-2 text-red-400 font-mono text-xl bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                   01:14:59
                 </div>
               </div>

               <p className="text-xl md:text-2xl text-slate-400 font-medium tracking-tight">
                  Avaliação idêntica aos critérios do IAVE. Sem surpresas no dia 25 de Junho. Se o Wolfi diz que passas, <span className="text-emerald-400">tu passas.</span>
               </p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
