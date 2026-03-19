"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

export function MetamorphosisScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Scale the portal to eventually cover the screen, smoothing the curve
  const portalScale = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0.5, 1, 15, 60]);
  const portalOpacity = useTransform(scrollYProgress, [0, 0.15, 0.3], [0, 1, 1]);
  
  // Fade out the old reality slower
  const oldRealityOpacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 0.8, 0]);
  const oldRealityScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.90]);

  // Fade in the new reality (The Dream) earlier, as the portal expands
  const dreamOpacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0, 0, 1]);
  const dreamY = useTransform(scrollYProgress, [0.3, 0.7], [50, 0]);

  return (
    <div ref={containerRef} className="relative h-[300vh] bg-[#020817]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        
        {/* The Old Reality (Stress/Burnout) */}
        <motion.div 
          style={{ opacity: oldRealityOpacity, scale: oldRealityScale }}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-10"
        >
          <div className="max-w-3xl space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-slate-300">
              A Pressão Insuportável do <br className="hidden md:block" />
              <span className="text-slate-500">Exame Nacional.</span>
            </h2>
            <p className="text-lg md:text-2xl text-slate-500 font-medium tracking-tight">
              Horas perdidas. 80€+ por mês em explicações. O medo constante de falhar. <br />
              Não devia ter de ser assim tão difícil.
            </p>
            {/* Visual representation of stress */}
            <div className="mt-12 opacity-60">
               <div className="w-full max-w-lg mx-auto aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
                 <img
                    src="/tiredstudying.jpg"
                    alt="Estudante cansado e frustrado"
                    className="w-full h-full object-cover grayscale mix-blend-luminosity"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent pointer-events-none" />
               </div>
            </div>
          </div>
        </motion.div>

        {/* The Glowing Portal (Wolfi AI) */}
        <motion.div 
          style={{ opacity: portalOpacity, scale: portalScale }}
          className="absolute z-20 w-32 h-32 rounded-full border border-blue-400 bg-blue-500/20 shadow-[0_0_100px_rgba(59,130,246,0.6)] flex items-center justify-center pointer-events-none"
        >
        </motion.div>

        {/* The Dream (Success + Freedom) */}
        <motion.div 
          style={{ opacity: dreamOpacity, y: dreamY }}
          className="absolute inset-0 flex items-center justify-center px-6 text-center z-30 bg-gradient-to-br from-indigo-900 via-[#0a0f25] to-[#020817]"
        >
          <div className="max-w-4xl space-y-10 relative">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
              Desbloqueia <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">O Sonho.</span>
            </h2>
            <p className="text-xl md:text-3xl text-slate-300 font-medium tracking-tight">
              Estuda 10x mais rápido. Domina o Exame. <br/> Entra na Universidade com que sempre sonhaste. <br/>
              <span className="italic opacity-80 mt-4 block text-lg">E continua a ter tempo para ti.</span>
            </p>

            {/* Premium App UI Representation */}
            <motion.div 
               initial={{ y: 20 }}
               whileInView={{ y: 0 }}
               transition={{ type: "spring", stiffness: 100, damping: 20 }}
               className="mt-12 relative w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(59,130,246,0.2)]"
            >
              {/* This would be an authentic Portuguese student lifestyle image or highly polished UI */}
               <img 
                 src="/hobbie8.jpg" 
                 alt="O Sonho Wolfi - Liberdade e Sucesso" 
                 className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f25] via-transparent to-transparent pointer-events-none" />
               <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
                  <div className="text-left backdrop-blur-md bg-black/40 p-4 rounded-xl border border-white/10">
                    <p className="text-white font-bold text-xl">Matemática A</p>
                    <p className="text-emerald-400 font-medium">100% Preparado</p>
                  </div>
               </div>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
