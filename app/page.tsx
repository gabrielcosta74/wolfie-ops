"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { ArrowRight, Clock, BrainCircuit, ShieldCheck } from "lucide-react";
import "./landing.css";

const AppleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.536 12.001c.026-2.522 2.064-3.722 2.158-3.784-1.171-1.713-2.992-1.944-3.65-1.984-1.55-.157-3.033.91-3.823.91-.79 0-2.022-.892-3.314-.868-1.685.024-3.238.979-4.108 2.493-1.769 3.067-.453 7.608 1.258 10.082.84 1.215 1.83 2.585 3.12 2.535 1.238-.052 1.715-.802 3.197-.802 1.48 0 1.905.802 3.22.778 1.341-.026 2.18-.124 3.018-1.341 1.05-1.536 1.484-3.023 1.503-3.1-1.616-.628-2.618-2.316-2.579-4.919zm-2.03-7.58c.683-.827 1.144-1.977 1.018-3.127-1.002.04-2.188.667-2.894 1.517-.633.754-1.185 1.93-1.036 3.05 1.121.087 2.228-.614 2.912-1.44z" />
  </svg>
);

const PlayStoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.16 11L5.92 3.19C5.4 2.89 4.86 3.1 4.86 3.78V20.22C4.86 20.9 5.4 21.11 5.92 20.81L19.16 13C19.72 12.67 19.72 11.33 19.16 11Z" />
  </svg>
);

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export default function LandingPage() {
  const phoneRef = useRef<HTMLDivElement>(null);

  // Scoped scroll tracking: only the phone section drives the 3D rotation
  const { scrollYProgress: phoneProgress } = useScroll({
    target: phoneRef,
    offset: ["start end", "center center"],
  });

  const phoneRotateX = useTransform(phoneProgress, [0, 1], [50, 5]);
  const phoneRotateZ = useTransform(phoneProgress, [0, 1], [-30, 0]);
  const phoneScale = useTransform(phoneProgress, [0, 1], [0.85, 1]);

  useEffect(() => {
    document.body.classList.add("landing-page-active");
    return () => document.body.classList.remove("landing-page-active");
  }, []);

  return (
    <div className="lp-wrapper">
      {/* Fixed ambient blobs (CSS animated, no JS overhead) */}
      <div className="lp-blob-container">
        <div className="lp-blob-1" />
        <div className="lp-blob-2" />
        <div className="lp-blob-3" />
      </div>

      <nav className="lp-nav">
        <div className="lp-logo">
          <div className="lp-logo-w">W</div>
          Wolfie
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <motion.section
        className="lp-hero"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={fadeUp}>
          Substitui horas<br />por clareza.
        </motion.h1>
        <motion.p className="lp-hero-sub" variants={fadeUp}>
          O teu tutor privado, a fundo no secundário.
        </motion.p>
        <motion.p className="lp-hero-desc" variants={fadeUp}>
          A primeira IA desenhada para dominar os Exames Nacionais. Sem distrações — explica-te tudo passo a passo e não te deixa desistir.
        </motion.p>
        <motion.div variants={fadeUp} className="lp-scroll-hint">
          ↓ Faz scroll para descobrir
        </motion.div>
      </motion.section>

      {/* ===== 3D PHONE (Scroll-driven rotation scoped to this section only) ===== */}
      <section className="lp-phone-section" ref={phoneRef}>
        <motion.div
          className="lp-phone-wrapper"
          style={{
            rotateX: phoneRotateX,
            rotateZ: phoneRotateZ,
            scale: phoneScale,
          }}
        >
          <div className="lp-phone-frame">
            <div className="lp-phone-screen">
              <div className="lp-dynamic-island" />
              <Image
                src="/wolfie_chat_tutor.png"
                alt="Wolfie explicando Matemática passo-a-passo"
                fill
                className="lp-phone-image"
                unoptimized
                priority
              />
            </div>
          </div>

          {/* Mascot floater */}
          <motion.div
            className="lp-floating-mascot"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Image
              src="/wolf-mascot.png"
              alt="Wolfie mascot"
              width={90}
              height={90}
              className="lp-mascot-img"
              unoptimized
            />
          </motion.div>
        </motion.div>

        {/* Store buttons */}
        <motion.div
          className="lp-stores"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <a href="#" className="lp-store-btn" onClick={(e) => e.preventDefault()}>
            <AppleIcon /> App Store
          </a>
          <a href="#" className="lp-store-btn" onClick={(e) => e.preventDefault()}>
            <PlayStoreIcon /> Google Play
          </a>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          className="lp-chips-row"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div className="lp-glass-chip" variants={fadeUp}>
            <div className="lp-chip-icon"><Clock size={24} /></div>
            <div>
              <div className="lp-chip-title">Tempo Otimizado</div>
              <div className="lp-chip-sub">Ganha horas no teu dia.</div>
            </div>
          </motion.div>

          <motion.div className="lp-glass-chip" variants={fadeUp}>
            <div className="lp-chip-icon"><BrainCircuit size={24} /></div>
            <div>
              <div className="lp-chip-title">Tutor Passo a Passo</div>
              <div className="lp-chip-sub">Acabou a frustração a Matemática.</div>
            </div>
          </motion.div>

          <motion.div className="lp-glass-chip" variants={fadeUp}>
            <div className="lp-chip-icon"><ShieldCheck size={24} /></div>
            <div>
              <div className="lp-chip-title">Base de Dados Nacional</div>
              <div className="lp-chip-sub">100% alinhado com o currículo.</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== MARKETING COPY ===== */}
      <motion.section
        className="lp-marketing"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
      >
        <h2>
          Esquece as <span className="lp-highlight">mil fichas</span> que não saem no exame.
        </h2>
        <p>
          Dás por ti a resolver exercícios cegamente, a bater com a cabeça na parede e a perder a tarde inteira?
          O Wolfie deteta o teu ponto mais fraco. Dá-te apenas os problemas que precisas agora, e guia-te
          incansavelmente pelo raciocínio como um explicador sentado a teu lado.
          <br /><br />
          <strong style={{ color: "#fff" }}>Estudas menos, absorves o dobro, sacas a nota.</strong>
        </p>
      </motion.section>

      {/* ===== CTA ===== */}
      <motion.section
        className="lp-cta"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
      >
        <h2>Professores &amp; Mentes Geniais</h2>
        <p>
          O motor está vivo, mas precisamos da tua expertise. Constrói módulos letais para a nossa
          base de dados e treina o tutor perfeito.
        </p>
        <a href="#" className="lp-cta-btn" onClick={(e) => e.preventDefault()}>
          Junta-te à Task Force <ArrowRight size={22} />
        </a>
      </motion.section>

      <footer className="lp-footer">
        <p>© {new Date().getFullYear()} Wolfie AI. A reescrever o ensino secundário em Portugal.</p>
        <a href="/manager">Login Workspace</a>
      </footer>
    </div>
  );
}
