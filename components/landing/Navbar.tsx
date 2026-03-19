"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import React from "react";

export function Navbar() {
  return (
    <motion.nav 
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md bg-transparent"
    >
      <div className="flex items-center gap-2">
        {/* Wolfi Logo Placeholder / Text */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-[2px]">
            <img src="/wolf-mascot.png" alt="Wolfi Logo" className="w-[85%] h-[85%] object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">Wolfi</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Liquid Glass Contributor Button */}
        <Link href="/contribuir">
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={{
              hover: { scale: 1.05 },
              tap: { scale: 0.95 }
            }}
            className="group relative flex items-center justify-center rounded-full bg-black/40 px-6 py-2.5 font-medium text-white backdrop-blur-xl transition-all duration-300 overflow-hidden"
          >
            {/* Base static border for structure */}
            <div className="absolute inset-0 rounded-full border border-white/10" />
            
            {/* Animated Gradient Border - Spins around the button on hover */}
            <div className="absolute -inset-[1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden z-0">
               <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#60a5fa_100%)]" />
               <div className="absolute inset-[1px] rounded-full bg-black/80 backdrop-blur-2xl" />
            </div>
            
            {/* Top Highlight line simulating actual glass light reflection */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

            <span className="relative z-20 text-sm tracking-wide group-hover:text-blue-200 transition-colors duration-300 drop-shadow-sm">Contribuir</span>
          </motion.div>
        </Link>
      </div>
    </motion.nav>
  );
}
