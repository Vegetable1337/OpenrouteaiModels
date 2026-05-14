import { motion } from "motion/react";
import { Cpu, Zap, Globe, Menu, X } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-linear-to-tr from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Cpu className="text-white w-5 h-5" />
          </div>
          <span className="font-semibold text-white tracking-tight">Aether AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Showcase", "Pricing", "About"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button className="text-sm text-white/80 hover:text-white transition-colors">Log In</button>
          <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-white/90 transition-all active:scale-95 shadow-lg shadow-white/5">
            Get Started
          </button>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </motion.div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-20 left-0 right-0 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 flex flex-col gap-4 md:hidden shadow-2xl"
        >
          {["Features", "Showcase", "Pricing", "About"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="text-lg text-white/80 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              {item}
            </a>
          ))}
          <div className="h-px bg-white/10 my-2" />
          <button className="bg-white text-black px-5 py-3 rounded-2xl text-base font-medium">
            Get Started
          </button>
        </motion.div>
      )}
    </nav>
  );
};
