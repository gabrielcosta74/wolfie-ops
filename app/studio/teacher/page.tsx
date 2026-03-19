import Link from "next/link";
import { requireTeacherUser } from "@/lib/studio-auth";
import { getTeacherReviewDashboard } from "@/lib/teacher-review";
import { Play, CheckCircle2, Sparkles } from "lucide-react";

export default async function TeacherDashboard() {
  const user = await requireTeacherUser();
  const dashboard = await getTeacherReviewDashboard(user.id, user.email ?? null);

  return (
    <div className="max-w-5xl mx-auto w-full pt-2 pb-12 px-2">
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portal de Curadoria</h1>
        <p className="text-slate-500 mt-2 text-lg">
          Olá, {user.email}. A qualidade do Wolfi depende da tua revisão clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Action Area (Bento Left - span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {dashboard.activeBatch ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between h-full min-h-[280px]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-bold tracking-wide mb-6">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  SESSÃO ATIVA
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">
                  {dashboard.activeBatch.themeName}
                </h2>
                {dashboard.activeBatch.subtemaName && (
                  <p className="text-lg text-slate-500 font-medium">Tema: {dashboard.activeBatch.subtemaName}</p>
                )}
                
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex-1 mr-8">
                     <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                        <span>Progresso</span>
                        <span>{dashboard.activeBatch.reviewedCount} / {dashboard.activeBatch.questionCount}</span>
                     </div>
                     <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-blue-600 rounded-full" 
                         style={{ width: `${Math.max(5, Math.round((dashboard.activeBatch.reviewedCount / dashboard.activeBatch.questionCount) * 100))}%` }}
                       />
                     </div>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link href={`/studio/teacher/revisao/${dashboard.activeBatch.batchId}`} className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-md w-full sm:w-auto">
                  <Play size={20} fill="currentColor" /> Retomar Sessão
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-md flex flex-col justify-between h-full min-h-[280px]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-bold tracking-wide mb-6 hidden sm:inline-flex">
                  <Sparkles size={16} /> NOVO DESAFIO
                </div>
                <h2 className="text-3xl font-black text-white mb-3">
                  Pronto para rever?
                </h2>
                <p className="text-blue-100 text-lg max-w-sm leading-relaxed">
                  Escolhe um tema de Matemática e garante que nenhuma pergunta manhosa escapa para os alunos.
                </p>
              </div>
              <div className="mt-8">
                <Link href="/studio/teacher/revisao" className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all shadow-lg w-full sm:w-auto">
                   Começar Revisão <span className="ml-1">→</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Stats Area (Bento Right - span 1) */}
        <div className="space-y-6">
           <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-green-600" />
                 </div>
                 <h3 className="text-slate-500 font-semibold">Total Revisto</h3>
              </div>
              <div className="text-4xl font-black text-slate-900 mt-4">{dashboard.totalReviewed}</div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-slate-500 font-medium text-sm mb-3">Problemas</h3>
                <div className="text-2xl font-bold text-slate-900">{dashboard.totalIssues}</div>
             </div>
             <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-slate-500 font-medium text-sm mb-3">Flags Graves</h3>
                <div className="text-2xl font-bold text-red-600">{dashboard.totalCriticalFlags}</div>
             </div>
           </div>
           
           <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-slate-500 font-semibold">Sugestões de melhoria</h3>
                 <span className="text-2xl font-black text-slate-900">{dashboard.totalSuggestions}</span>
              </div>
              <Link href="/studio/teacher/sugestoes/nova" className="mt-4 inline-flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl transition-colors border border-slate-200">
                Enviar Sugestão
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
