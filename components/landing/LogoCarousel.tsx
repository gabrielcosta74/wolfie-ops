"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface Logo {
  id: number;
  name: string;
  // Replaced generic SVG component with string for direct image src or fallback text
  text?: string; 
  component?: React.ReactNode;
}

interface LogoColumnProps {
  logos: Logo[];
  index: number;
  currentTime: number;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const distributeLogos = (allLogos: Logo[], columnCount: number): Logo[][] => {
  const shuffled = shuffleArray(allLogos);
  const columns: Logo[][] = Array.from({ length: columnCount }, () => []);

  shuffled.forEach((logo, index) => {
    columns[index % columnCount].push(logo);
  });

  const maxLength = Math.max(...columns.map((col) => col.length));
  columns.forEach((col) => {
    while (col.length < maxLength) {
      col.push(shuffled[Math.floor(Math.random() * shuffled.length)]);
    }
  });

  return columns;
};

const LogoColumn: React.FC<LogoColumnProps> = React.memo(
  ({ logos, index, currentTime }) => {
    const cycleInterval = 2500;
    const columnDelay = index * 300;
    const adjustedTime = (currentTime + columnDelay) % (cycleInterval * logos.length);
    const currentIndex = Math.floor(adjustedTime / cycleInterval);
    const CurrentLogo = useMemo(() => logos[currentIndex], [logos, currentIndex]);

    return (
      <motion.div
        className="relative h-16 w-32 overflow-hidden md:h-24 md:w-48 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm"
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          delay: index * 0.1,
          duration: 0.8,
          ease: "easeOut",
        }}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`${CurrentLogo.id}-${currentIndex}`}
            className="absolute inset-0 flex items-center justify-center p-4 text-center"
            initial={false}
            animate={{
              y: "0%",
              opacity: 1,
              filter: "blur(0px)",
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                mass: 1,
                bounce: 0.2,
                duration: 0.5,
              },
            }}
            exit={{
              y: "-20%",
              opacity: 0,
              filter: "blur(4px)",
              transition: {
                type: "tween",
                ease: "easeIn",
                duration: 0.3,
              },
            }}
          >
            {CurrentLogo.component ? (
              <div className="w-full h-full flex items-center justify-center opacity-70 grayscale brightness-200 hover:opacity-100 transition-opacity">
                {CurrentLogo.component}
              </div>
            ) : (
              <span className="text-white font-bold tracking-tight text-sm md:text-lg opacity-80">{CurrentLogo.text}</span>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }
);

interface LogoCarouselProps {
  columnCount?: number;
  logos: Logo[];
}

export function LogoCarousel({ columnCount = 4, logos }: LogoCarouselProps) {
  const [logoSets, setLogoSets] = useState<Logo[][]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  const updateTime = useCallback(() => {
    setCurrentTime((prevTime) => prevTime + 100);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(updateTime, 100);
    return () => clearInterval(intervalId);
  }, [updateTime]);

  useEffect(() => {
    const distributedLogos = distributeLogos(logos, columnCount);
    setLogoSets(distributedLogos);
  }, [logos, columnCount]);

  return (
    <div className="flex space-x-4 md:space-x-8 justify-center overflow-hidden py-8">
      {logoSets.map((colLogos, index) => (
        <LogoColumn
          key={index}
          logos={colLogos}
          index={index}
          currentTime={currentTime}
        />
      ))}
    </div>
  );
}
