import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ElementalTransition = ({ isTriggered, onBoom, onComplete }) => {
  useEffect(() => {
    if (isTriggered) {
      // Precise timing for the "Boom" reveal
      // Sequence: Wave (0.8s) -> Fire (0.8s, starts late) -> Boom (Apex at ~1.0s)
      const boomTimer = setTimeout(() => {
        onBoom();
      }, 900);

      const completeTimer = setTimeout(() => {
        onComplete();
      }, 1800);

      return () => {
        clearTimeout(boomTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isTriggered, onBoom, onComplete]);

  return (
    <AnimatePresence>
      {isTriggered && (
        <div className="fixed inset-0 z-[20000] pointer-events-none overflow-hidden">
          
          {/* THE OCEAN WAVE - Massive Deep Blue */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 bg-blue-700 border-r-[40px] border-blue-400 z-10"
            style={{ borderRadius: '0 100% 100% 0' }}
          />

          {/* THE FIRE - Jagged High-Voltage Orange */}
          <motion.div
            initial={{ x: '-120%' }}
            animate={{ x: '120%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 bg-[#FF6B00] border-r-[60px] border-yellow-400 z-20"
            style={{ 
              clipPath: 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)' 
            }}
          />

          {/* THE BOOM - Centralized Light Blast */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.5, 4], 
              opacity: [0, 1, 0] 
            }}
            transition={{ duration: 0.8, delay: 0.8, ease: "circOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vmax] h-[100vmax] bg-white z-30 rounded-full"
          />

          {/* PARTICLE SPLASH EFFECT */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="absolute inset-0 z-40 bg-orange-500/20 mix-blend-overlay"
          />

        </div>
      )}
    </AnimatePresence>
  );
};

export default ElementalTransition;
