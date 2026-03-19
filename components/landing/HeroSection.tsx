"use client";

import { motion, useSpring, useTransform, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

export function HeroSection() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Track mouse coordinates
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, absoluteX: 0, absoluteY: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    // Normalized coordinates from -1 to 1 for the 3D phone rotation
    const x = (e.clientX / windowSize.width) * 2 - 1;
    const y = (e.clientY / windowSize.height) * 2 - 1;
    
    // Smooth absolute tracking for the background gradient
    const rect = e.currentTarget.getBoundingClientRect();
    const absoluteX = e.clientX - rect.left;
    const absoluteY = e.clientY - rect.top;
    
    setMousePosition({ x, y, absoluteX, absoluteY });
  };

  // Smooth springs for 3D Phone tracking ONLY
  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 };
  const mouseX = useSpring(0, springConfig);
  const mouseY = useSpring(0, springConfig);

  useEffect(() => {
    mouseX.set(mousePosition.x);
    mouseY.set(mousePosition.y);
  }, [mousePosition, mouseX, mouseY]);

  // Map mouse coordinates to aggressive 3D rotation
  const rotateX = useTransform(mouseY, [-1, 1], [15, -15]);
  const rotateY = useTransform(mouseX, [-1, 1], [-20, 20]);

  // Text Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 40, rotateX: -90 },
    visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <section 
      className="relative min-h-[100vh] w-full flex flex-col lg:flex-row items-center justify-center pt-24 px-6 md:px-12 z-10 overflow-hidden perspective-[2000px] bg-[#020617]"
      onMouseMove={handleMouseMove}
      style={{
        // Real-time CSS radial gradient attached directly to the mouse without React re-renders glitching it
        backgroundImage: `radial-gradient(1200px circle at ${mousePosition.absoluteX}px ${mousePosition.absoluteY}px, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.1) 30%, transparent 60%)`
      }}
    >
      {/* Static Sub-Glow for depth */}
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-cyan-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* LEFT: Minimalist Kinetic Typography */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-start text-center lg:text-left z-20 space-y-8 mb-16 lg:mb-0">
        
        <motion.div 
          className="inline-flex items-center rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          O melhor explicador de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)] ml-1 font-bold">Matemática A</span>
        </motion.div>

        <motion.div 
          variants={containerVariants} 
          initial={false}
          animate="visible"
          className="perspective-[1000px] transform-style-3d"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.9]">
            <motion.span variants={wordVariants} className="block transform-origin-bottom">Domina</motion.span>
            <motion.span variants={wordVariants} className="block transform-origin-bottom">o Exame.</motion.span>
            <motion.span variants={wordVariants} className="block transform-origin-bottom text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 mt-2 pb-2">
              Recupera o Tempo.
            </motion.span>
          </h1>
        </motion.div>

        <motion.div 
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 pt-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl px-6 py-3 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all shadow-xl group">
             <svg viewBox="0 0 384 512" width="24" height="24" className="text-white">
                <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
             </svg>
             <div className="text-left leading-tight">
               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-slate-300 transition-colors">Em breve na</div>
               <div className="text-lg text-white font-bold tracking-tight">App Store</div>
             </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl px-6 py-3 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all shadow-xl group">
             <svg viewBox="0 0 24 24" width="28" height="28">
                <path fill="#4285F4" d="M3.6 2.4L3.6 21.6C3.6 22.3 4 22.8 4.6 23.3L15.4 12.5L4.6 1.7C4 2.2 3.6 2.7 3.6 2.4Z" />
                <path fill="#FBBC05" d="M16.8 13.9L20.8 11.6C21.6 11.1 21.6 10.3 20.8 9.8L16.8 7.5L14.4 9.9L16.8 13.9Z" />
                <path fill="#EA4335" d="M5.6 1.1L15.6 6.8L13.2 9.2L5.6 1.1Z" />
                <path fill="#34A853" d="M5.6 22.9L13.2 14.8L15.6 17.2L5.6 22.9Z" />
             </svg>
             <div className="text-left leading-tight">
               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-slate-300 transition-colors">Em breve no</div>
               <div className="text-lg text-white font-bold tracking-tight">Google Play</div>
             </div>
          </motion.div>
        </motion.div>
      </div>

      {/* RIGHT: 3D Mouse-tracking Phone */}
      <div className="w-full lg:w-1/2 flex justify-center items-center z-20 mt-12 lg:mt-0 perspective-[2000px]">
        <motion.div
          style={{ rotateX, rotateY }}
          initial={false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-[340px] md:w-[400px] h-[650px] md:h-[800px] transform-style-3d hover:scale-105 transition-transform duration-500 ease-out"
        >
          <Image
            src="/appscreen.png"
            alt="Wolfi App Screen Prototype"
            fill
            className="object-contain drop-shadow-[0_30px_60px_rgba(37,99,235,0.25)]"
            priority
            unoptimized
          />
        </motion.div>
      </div>
    </section>
  );
}
