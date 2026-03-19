import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { MetamorphosisScroll } from "@/components/landing/MetamorphosisScroll";
import { CinematicFeatures } from "@/components/landing/CinematicFeatures";
import { ContributionCTA } from "@/components/landing/ContributionCTA";
import { ZoomParallax } from "@/components/landing/ZoomParallax";
import { LogoCarousel, type Logo } from "@/components/landing/LogoCarousel";

export const metadata = {
  title: "Wolfi",
};

const TecnicoLogo = () => (
  <div
    className="flex flex-col items-start leading-none font-bold text-white tracking-widest"
    style={{ fontFamily: "Arial, sans-serif" }}
  >
    <span className="text-xl">TÉCNICO</span>
    <span className="text-lg">LISBOA</span>
  </div>
);

const IscteLogo = () => (
  <div className="flex flex-col items-start text-white">
    <span className="text-3xl font-black tracking-tighter leading-none lowercase">
      iscte
    </span>
    <span className="mt-1 text-[6px] font-medium leading-tight tracking-[0.2em]">
      INSTITUTO <br /> UNIVERSITÁRIO <br /> DE LISBOA
    </span>
  </div>
);

const FmulLogo = () => (
  <div className="flex items-center gap-2 text-white">
    <svg
      width="24"
      height="28"
      viewBox="0 0 24 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="opacity-80"
    >
      <path d="M12 2L4 6v8c0 5 3.5 9.5 8 12 4.5-2.5 8-7 8-12V6z" />
    </svg>
    <div className="flex flex-col items-start leading-none">
      <span className="font-serif text-2xl font-bold tracking-wider">FMUL</span>
    </div>
  </div>
);

const UcpLogo = () => (
  <div className="flex items-center gap-2 text-white">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 2h2v6h6v2h-6v12h-2V10H5V8h6V2z" />
    </svg>
    <span className="text-left font-serif text-[10px] font-bold leading-[1.1] tracking-tight">
      UNIVERSIDADE
      <br />
      CATÓLICA
      <br />
      PORTUGUESA
    </span>
  </div>
);

const UPortoLogo = () => (
  <div className="flex items-center text-3xl font-bold tracking-tighter text-white">
    <span className="font-light">U.</span>PORTO
  </div>
);

const FctNovaLogo = () => (
  <div className="flex items-end gap-1.5 leading-none tracking-tighter text-white">
    <span className="text-3xl font-black">NOVA</span>
    <span className="mb-0.5 text-lg font-medium text-slate-300">FCT</span>
  </div>
);

const NovaSbeLogo = () => (
  <div className="flex flex-col items-start leading-none tracking-tighter text-white">
    <span className="text-2xl font-black">NOVA</span>
    <span className="text-xl font-light">SBE</span>
  </div>
);

const UcLogo = () => (
  <div className="flex flex-col items-center font-serif leading-none text-white">
    <span className="text-3xl font-bold tracking-widest">U C</span>
    <span className="mt-1 text-[6px] font-medium tracking-[0.2em] text-slate-300">
      UNIVERSIDADE DE COIMBRA
    </span>
  </div>
);

const UMinhoLogo = () => (
  <div className="flex scale-75 flex-col items-center justify-center text-white">
    <span className="font-serif text-lg italic leading-none">Universidade</span>
    <span className="mt-0.5 border-t border-slate-500 pt-0.5 font-serif text-xl leading-none">
      do Minho
    </span>
  </div>
);

const UbiLogo = () => (
  <div className="flex items-center gap-1.5 tracking-tighter text-white">
    <span className="text-3xl font-black">UBI</span>
  </div>
);

const UNIVERSITY_LOGOS: Logo[] = [
  { id: 1, name: "IST", component: <TecnicoLogo /> },
  { id: 2, name: "UPORTO", component: <UPortoLogo /> },
  { id: 3, name: "FCT_NOVA", component: <FctNovaLogo /> },
  { id: 4, name: "ISCTE", component: <IscteLogo /> },
  { id: 5, name: "FMUL", component: <FmulLogo /> },
  { id: 6, name: "UC", component: <UcLogo /> },
  { id: 7, name: "UMINHO", component: <UMinhoLogo /> },
  { id: 8, name: "UBI", component: <UbiLogo /> },
  { id: 9, name: "Catolica", component: <UcpLogo /> },
  { id: 10, name: "NOVA_SBE", component: <NovaSbeLogo /> },
];

const PARALLAX_IMAGES = [
  {
    src: "/hobbie1.jpg",
    alt: "Estilo de vida Wolfi",
  },
  {
    src: "/hobbie2.jpg",
    alt: "Experiência de Sucesso",
  },
  {
    src: "/hobbie3.jpg",
    alt: "Momentos de Descontração",
  },
  {
    src: "/hobbie4.jpg",
    alt: "Equilíbrio Estudo e Lazer",
  },
  {
    src: "/hobbie5.jpg",
    alt: "Rotina de Elevada Performance",
  },
  {
    src: "/hobbie6.jpg",
    alt: "Estudos com Amigos",
  },
  {
    src: "/hobbie7.jpg",
    alt: "Hobbies e Paixões",
  },
];

export default function LandingPage() {
  return (
    <div className="relative w-full bg-[#020817] font-sans text-white selection:bg-blue-500/30 selection:text-white">
      <Navbar />

      <main className="flex w-full flex-col">
        <HeroSection />

        <section className="w-full border-y border-white/5 bg-white/[0.02] py-12">
          <div className="mx-auto mb-8 max-w-7xl px-6 text-center text-sm font-medium tracking-tight text-slate-500">
            A ESCOLHA DOS FUTUROS ALUNOS DAS MELHORES UNIVERSIDADES
          </div>
          <LogoCarousel logos={UNIVERSITY_LOGOS} />
        </section>

        <MetamorphosisScroll />

        <section className="relative z-30 w-full bg-[#020817] pb-32">
          <div className="z-40 w-full bg-[#020817] px-4 py-16 text-center">
            <h3 className="text-3xl font-bold tracking-tighter text-white drop-shadow-lg md:text-5xl">
              O teu tempo. De volta a ti.
            </h3>
          </div>
          <ZoomParallax images={PARALLAX_IMAGES} />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-40 h-64 bg-gradient-to-t from-[#020817] to-transparent" />
        </section>

        <div className="relative z-40 border-t border-white/5 bg-[#020617]">
          <CinematicFeatures />
        </div>
      </main>

      <ContributionCTA />
    </div>
  );
}
