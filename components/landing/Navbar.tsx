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

    </motion.nav>
  );
}
