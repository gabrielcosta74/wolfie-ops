"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export function ContributionCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // --- PHASE 1: The Call (0.0 to 0.3) ---
  const callOpacity = useTransform(scrollYProgress, [0, 0.1, 0.25, 0.3], [0, 1, 1, 0]);
  const callScale = useTransform(scrollYProgress, [0, 0.3], [0.9, 1.2]);

  // --- PHASE 2: The Asset Drop (0.3 to 0.7) ---
  // Background Vault Glow
  const vaultGlowOpacity = useTransform(scrollYProgress, [0.3, 0.4, 0.8, 1], [0, 1, 1, 0]);
  const vaultGlowScale = useTransform(scrollYProgress, [0.3, 0.7], [0.5, 1.5]);
  
  // Parallax Assets falling into the vault
  const asset1Y = useTransform(scrollYProgress, [0.3, 0.6], [200, -100]);
  const asset1Opacity = useTransform(scrollYProgress, [0.3, 0.4, 0.55, 0.6], [0, 1, 1, 0]);
  
  const asset2Y = useTransform(scrollYProgress, [0.35, 0.65], [300, -50]);
  const asset2Opacity = useTransform(scrollYProgress, [0.35, 0.45, 0.6, 0.65], [0, 1, 1, 0]);

  const asset3Y = useTransform(scrollYProgress, [0.4, 0.7], [250, -150]);
  const asset3Opacity = useTransform(scrollYProgress, [0.4, 0.5, 0.65, 0.7], [0, 1, 1, 0]);

  // Asset Phase Text
  const assetTextOpacity = useTransform(scrollYProgress, [0.4, 0.5, 0.65, 0.7], [0, 1, 1, 0]);
  const assetTextY = useTransform(scrollYProgress, [0.4, 0.7], [50, -50]);

  // --- PHASE 3: The Action Block (0.7 to 1.0) ---
  const actionOpacity = useTransform(scrollYProgress, [0.75, 0.85, 1], [0, 1, 1]);
  const actionScale = useTransform(scrollYProgress, [0.75, 0.85, 1], [0.8, 1, 1]);
  const actionY = useTransform(scrollYProgress, [0.75, 0.85, 1], [100, 0, 0]);

  return (
    <>
      <section ref={containerRef} className="relative h-[350vh] bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center perspective-[1000px]">
        
        {/* Deep Space Background */}
        <div className="absolute inset-0 bg-black pointer-events-none" />

        {/* --- PHASE 1: The Call --- */}
        <motion.div 
          style={{ opacity: callOpacity, scale: callScale }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4"
        >
          <div className="inline-flex mb-6 items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-300 backdrop-blur-md uppercase tracking-[0.2em]">
             Comunidade
          </div>
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white text-center drop-shadow-2xl">
            A educação do futuro <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-300 to-slate-600">
               é construída por ti.
            </span>
          </h2>
        </motion.div>

        {/* --- PHASE 2: The Asset Drop --- */}
        <motion.div style={{ opacity: vaultGlowOpacity, scale: vaultGlowScale }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px]" />
        </motion.div>

        {/* Floating Documents - Exclusively Matemática A with Premium Solid/Frosted White Design */}
        <motion.div style={{ y: asset1Y, opacity: asset1Opacity }} className="absolute left-[10%] md:left-[22%] top-[15%] rotate-[-8deg] z-10 w-fit">
           <div className="bg-white/95 backdrop-blur-3xl border border-white/40 p-5 rounded-2xl shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] flex items-start gap-4 hover:scale-105 transition-transform duration-500">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-inner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div className="flex flex-col pr-4">
                <div className="text-slate-900 font-extrabold text-sm tracking-tight">Matemática A</div>
                <div className="text-slate-500 text-xs mt-0.5 font-bold">Exame Nacional 2023 (1ª Fase)</div>
              </div>
           </div>
        </motion.div>

        <motion.div style={{ y: asset2Y, opacity: asset2Opacity }} className="absolute right-[8%] md:right-[18%] top-[35%] rotate-[6deg] z-10 w-fit">
           <div className="bg-white/95 backdrop-blur-3xl border border-white/40 p-5 rounded-2xl shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] flex items-start gap-4 hover:scale-105 transition-transform duration-500">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <div className="flex flex-col pr-4">
                <div className="text-slate-900 font-extrabold text-sm tracking-tight">Matemática A</div>
                <div className="text-slate-500 text-xs mt-0.5 font-bold">Resolução de Complexos (Vídeo)</div>
              </div>
           </div>
        </motion.div>

        <motion.div style={{ y: asset3Y, opacity: asset3Opacity }} className="absolute left-[15%] md:left-[28%] top-[55%] rotate-[-4deg] z-10 w-fit">
           <div className="bg-white/95 backdrop-blur-3xl border border-white/40 p-5 rounded-2xl shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] flex items-start gap-4 hover:scale-105 transition-transform duration-500">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shrink-0 shadow-inner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  <line x1="12" y1="11" x2="12" y2="17"/>
                  <line x1="9" y1="14" x2="15" y2="14"/>
                </svg>
              </div>
              <div className="flex flex-col pr-4">
                <div className="text-slate-900 font-extrabold text-sm tracking-tight">Matemática A</div>
                <div className="text-slate-500 text-xs mt-0.5 font-bold">Macro-Resumo de Geometria</div>
              </div>
           </div>
        </motion.div>

        {/* Phase 2 Text */}
        <motion.div style={{ y: assetTextY, opacity: assetTextOpacity }} className="absolute inset-0 flex items-center justify-center text-center px-4 pointer-events-none z-0">
           <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl max-w-4xl leading-[1.1]">
             De estudantes, <br/> <span className="text-blue-400">para estudantes.</span>
             <div className="text-xl md:text-2xl text-slate-300 font-medium tracking-tight mt-6 leading-relaxed max-w-3xl mx-auto drop-shadow-lg">
               A plataforma cresce com a comunidade. Adiciona os teus resumos, sugere vídeos e partilha testes passados para ajudar milhares de colegas.
             </div>
           </h3>
        </motion.div>


        {/* --- PHASE 3: The Action Block --- */}
        <motion.div 
          style={{ opacity: actionOpacity, scale: actionScale, y: actionY }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 md:px-6 z-20"
        >
          {/* Glassmorphism Vault Block */}
          <div className="relative w-full max-w-3xl max-h-[85dvh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#0a0f1d]/90 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-8 sm:p-10 md:p-12 text-center backdrop-blur-3xl shadow-[0_0_120px_rgba(37,99,235,0.15)]">
             
             {/* Inner Top Highlight */}
             <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
             
             <div className="inline-flex mb-6 md:mb-8 items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-2 text-sm font-bold text-amber-300 backdrop-blur-md uppercase tracking-[0.2em]">
                O Grande Torneio
             </div>

             <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-4 md:mb-6 leading-tight">
                A Corrida ao Cofre. <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Ganha Prémios a Sério.</span>
             </h2>
             
             <p className="text-base md:text-lg text-slate-400 font-medium mb-6 max-w-2xl mx-auto leading-relaxed">
               Partilha os teus testes de Matemática A para subires no Leaderboard. <strong className="text-white">A tua classificação depende 100% da quantidade de resumos e testes teus que os nossos Admins aprovarem.</strong><br/><br/><span className="text-white text-base relative mx-1">O Cofre destranca os prémios apenas aos 100 participantes inscritos e aos 500 followers no @wolfi.pt no instagram.<span className="absolute -bottom-1 left-0 w-full h-1 bg-amber-500/20 blur-[2px]"></span></span>
             </p>

             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10 font-bold text-sm tracking-wide">
               <div className="px-5 py-2.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-full text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">🥇 50€ + 3 Meses Premium</div>
               <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-slate-300 transform-gpu translate-y-2">🥈 10€ + 1 Mês Premium</div>
               <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-slate-300 transform-gpu translate-y-3">🥉 1 Mês Premium</div>
             </div>

             {/* The Premium CTA Button */}
             <Link href="/contribuir" className="inline-block relative group z-30">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="relative flex items-center justify-center px-10 py-5 rounded-full overflow-hidden bg-black/50 border border-white/20 backdrop-blur-2xl transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-full border border-white/10" />
                  
                  {/* Rotating Gradient Ring */}
                  {/* Opacity always 100 on desktop, but let's make it always visible for clarity of the CTA */}
                  <div className="absolute -inset-[1px] rounded-full overflow-hidden z-0">
                     <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#3b82f6_50%,transparent_100%)] opacity-80" />
                     <div className="absolute inset-[2px] rounded-full bg-black/90 backdrop-blur-3xl" />
                  </div>
                  
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none z-10" />

                  <span className="relative z-20 font-bold text-lg tracking-wide text-white drop-shadow-sm group-hover:text-blue-100 transition-colors">
                     Contribuir
                  </span>

                  {/* Sparkle Arrow Icon */}
                  <span className="relative z-20 ml-3 text-blue-400 group-hover:translate-x-1 transition-transform">
                     →
                  </span>
                </motion.div>
             </Link>
           </div>
        </motion.div>
      </div>
    </section>
      
      {/* Classic Footer Links - Fully external robust footer */}
      <footer className="w-full bg-black pt-16 pb-12 border-t border-white/10 pointer-events-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-600 text-sm font-medium tracking-tight">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
             <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden p-[2px]">
                <img src="/wolf-mascot.png" alt="Wolfi Logo" className="w-[85%] h-[85%] object-contain" />
             </div>
             <span>© 2026 Wolfi AI. Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacidade</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Termos</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
