import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ContribuirForm } from "./ContribuirForm";
import secondarySchools from "./secondary-schools.json";
import Link from "next/link";

export default async function ContribuirPage() {
  const supabase = getSupabaseAdmin();

  const { data: subtemas } = await supabase
    .from("edu_subtemas_exame")
    .select("id, nome, tema:edu_temas_exame(nome)")
    .order("tema_id")
    .order("ordem");

  const subtemasOptions = (subtemas ?? []).map((s) => ({
    id: s.id,
    label: `${(s.tema as unknown as { nome: string } | null)?.nome ?? "Geral"} — ${s.nome}`,
  }));

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[40vw] h-[40vw] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:bg-blue-500 transition-colors">
              W
            </div>
            <span className="font-bold text-slate-200 text-lg tracking-tight group-hover:text-white transition-colors">
              Wolfi
            </span>
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Cofre de Conhecimento
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto relative z-10 flex flex-col items-center">
        
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-3xl">
          <div className="inline-flex mb-6 items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-300 backdrop-blur-md uppercase tracking-[0.2em]">
            ✦ O Torneio Mensal Wolfi
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6 leading-tight">
            Alimenta o Cofre. <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
               Destrói a Competição.
            </span>
          </h1>
          <p className="text-lg text-slate-400 font-medium">
            Sobe no ranking Nacional com os teus resumos. <strong className="text-white">A tua classificação depende do número de conteúdos que enviares e que sejam aprovados por um Admin do Wolfi.</strong>
            <br/><br/>
            <strong className="text-amber-400">Regras de Ouro:</strong> Os prémios desbloqueiam aos <strong className="text-white relative">100 alunos inscritos<span className="absolute -bottom-1 left-0 w-full h-1 bg-amber-600/30 blur-[2px]" /></strong> e <strong className="text-white relative">500 followers no @wolfi.pt<span className="absolute -bottom-1 left-0 w-full h-1 bg-amber-600/30 blur-[2px]" /></strong>. Seguir o Instagram é obrigatório.
          </p>
        </div>

        {/* Prize Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 w-full max-w-3xl">
          <div className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.05)] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">🥇</div>
             <span className="text-3xl font-black text-amber-400">1º</span>
             <span className="font-bold text-white text-center">Recompensa 50€</span>
             <span className="text-amber-500/80 text-xs font-bold uppercase tracking-widest">+ 3 Meses Premium</span>
          </div>

          <div className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl group-hover:scale-110 transition-transform">🥈</div>
             <span className="text-3xl font-black text-slate-300">2º</span>
             <span className="font-bold text-white text-center">Recompensa 10€</span>
             <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">+ 1 Mês Premium</span>
          </div>

           <div className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl group-hover:scale-110 transition-transform">🥉</div>
             <span className="text-3xl font-black text-orange-400/80">3º</span>
             <span className="font-bold text-white text-center">Destaque Exclusivo</span>
             <span className="text-orange-400/80 text-xs font-bold uppercase tracking-widest">+ 1 Mês Premium</span>
          </div>
        </div>

        {/* Instagram Follow Requirement Block */}
        <div className="w-full max-w-3xl mb-12 p-px rounded-3xl bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-amber-500/30 shadow-lg relative mx-auto overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 backdrop-blur-sm" />
          <div className="bg-[#0a0f1d]/90 backdrop-blur-3xl rounded-[23px] px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6 text-center sm:text-left">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 items-center justify-center text-white text-2xl shadow-lg border border-white/20">
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">Passo 0: Obrigatório</span>
                <h3 className="text-xl font-bold text-white mb-1">Segue o <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-400">@wolfi.pt</span></h3>
                <p className="text-sm text-slate-400 font-medium max-w-sm">Para garantires a tua vaga no torneio e poderes levantar os 50€, tens de nos seguir no Instagram.</p>
              </div>
            </div>
            
            <a 
              href="https://instagram.com/wolfi.pt" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 shrink-0 bg-white text-black text-sm font-bold rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Seguir Agora
            </a>
          </div>
        </div>

        {/* Wizard Form Wrapper */}
        <div className="w-full">
          <ContribuirForm
            subtemas={subtemasOptions}
            schools={secondarySchools as string[]}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5 text-center text-sm font-medium text-slate-500 mt-20 bg-black/20">
        © {new Date().getFullYear()} Wolfi AI. <Link href="/" className="hover:text-white transition-colors ml-2">Voltar ao início &rarr;</Link>
      </footer>
    </div>
  );
}
