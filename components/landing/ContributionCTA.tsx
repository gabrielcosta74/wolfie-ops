import Link from "next/link";

export function ContributionCTA() {
  return (
    <>
    <section className="w-full bg-black flex flex-col items-center justify-center text-center px-4 py-32 md:py-44">
      <div className="inline-flex mb-6 items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-300 backdrop-blur-md uppercase tracking-[0.2em]">
        Em breve
      </div>
      <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-2xl">
        Lançamento <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-300 to-slate-600">
          em breve.
        </span>
      </h2>
    </section>
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
