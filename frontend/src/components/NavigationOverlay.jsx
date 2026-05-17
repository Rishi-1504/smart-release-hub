import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutDashboard, FileText, ShieldCheck, Settings, Menu } from 'lucide-react';

const NavigationOverlay = ({ isOpen, setIsOpen, activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: <LayoutDashboard size={48} /> },
    { id: 'notes', label: 'RELEASE NOTES', icon: <FileText size={48} /> },
    { id: 'readiness', label: 'READINESS', icon: <ShieldCheck size={48} /> },
    { id: 'settings', label: 'SETTINGS', icon: <Settings size={48} /> },
  ];

  const variants = {
    hidden: { y: '-100%', transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
    visible: { y: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
  };

  const itemVariants = {
    hidden: { x: -100, opacity: 0 },
    visible: (i) => ({
      x: 0,
      opacity: 1,
      transition: { delay: 0.3 + i * 0.1, duration: 0.5, ease: 'easeOut' },
    }),
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed top-8 right-8 z-[9995] bg-black dark:bg-white text-white dark:text-black p-6 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex items-center gap-4 font-black uppercase tracking-[0.2em] text-sm"
      >
        <Menu size={24} strokeWidth={3} />
        COMMAND
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants}
            className="fixed inset-0 z-[9998] bg-[#f2f2f2] dark:bg-black p-20 flex flex-col justify-center"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-12 right-12 text-black dark:text-white hover:rotate-90 transition-transform p-4"
            >
              <X size={64} strokeWidth={3} />
            </button>

            {/* Huge Menu Links */}
            <nav className="flex flex-col gap-8">
              {menuItems.map((item, i) => (
                <motion.button
                  key={item.id}
                  custom={i}
                  variants={itemVariants}
                  onClick={() => {
                    setActiveView(item.id);
                    setIsOpen(false);
                  }}
                  className={`group flex items-baseline gap-8 text-left transition-colors ${
                    activeView === item.id 
                      ? 'text-indigo-600 dark:text-white' 
                      : 'text-black/20 dark:text-white/20 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span className="text-xl font-black font-mono opacity-40">0{i+1}</span>
                  <span className="text-massive group-hover:italic transition-all inline-block hover:translate-x-12 duration-500">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </nav>

            {/* Background Kinetic Text */}
            <div className="absolute bottom-20 left-20 pointer-events-none opacity-5 dark:opacity-10">
              <span className="text-[20vw] font-black text-black dark:text-white leading-none tracking-tighter uppercase select-none">
                NEURAL HUB
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavigationOverlay;
