"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="relative bg-[#020817] border-t border-white/5 pt-24 pb-12 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-blue-900/10 rounded-[100%] blur-[80px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="max-w-2xl"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
            Não deixes o exame <br/> roubar-te o verão.
          </h2>
          <p className="text-lg text-slate-400 font-medium mb-12">
            Junta-te aos alunos de elite que usam o Wolfi para estudar menos e tirar melhores notas. 
            Os lugares na lista de espera são estritamente limitados.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="inline-block"
          >
            <Link 
              href="/signup"
              className={cn(
                "relative flex items-center justify-center px-10 py-5 rounded-full overflow-hidden",
                "bg-blue-600 border border-blue-400/50 shadow-[0_0_40px_rgba(37,99,235,0.4)]",
                "text-white font-bold text-lg tracking-tight transition-all duration-300",
                "hover:bg-blue-500 hover:shadow-[0_0_60px_rgba(37,99,235,0.6)]"
              )}
            >
              <span className="relative z-10">Acesso Antecipado</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
            </Link>
          </motion.div>
        </motion.div>

        <div className="mt-32 w-full flex flex-col md:flex-row justify-between items-center text-slate-600 text-sm font-medium tracking-tight border-t border-white/5 pt-8">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
             <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 24 24" fill="none" width="12" height="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: "#94a3b8"}}>
                  <path d="M12 2L2 22h20L12 2z" />
                </svg>
             </div>
             <span>© 2026 Wolfi AI. Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacidade</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Termos</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
