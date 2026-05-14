import { motion } from "motion/react";
import { Sparkles, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate } from "react-router";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 blur-[120px] rounded-full -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full -z-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center max-w-4xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm mb-8 backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>iOS 26 Engine: Now in Preview</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight mb-8 leading-[1.1]">
          Design at the speed <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-white/80 to-white/40">
            of thought.
          </span>
        </h1>
        
        <p className="text-xl text-white/50 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
          The world's first AI design system built for the next generation of mobile experiences. 
          Craft pixel-perfect interfaces with natural language.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button 
            onClick={() => navigate('/chat')}
            className="bg-white text-black px-10 py-5 rounded-2xl text-lg font-semibold hover:bg-white/90 transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Open Aether Chat
          </button>
          <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
            Watch the Keynote
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      {/* Floating UI Elements / Abstract Visual */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 1.2, ease: "circOut" }}
        className="mt-24 relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
      >
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1694365899936-850bc6c2b0f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXR1cmlzdGljJTIwbWluaW1hbCUyMGlvcyUyMGludGVyZmFjZSUyMGdsYXNzbW9ycGhpc218ZW58MXx8fHwxNzc4Njk4NjExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="AI Interface Preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-60" />
        
        {/* Floating "AI Particles" Overlay effect could be here */}
        <div className="absolute bottom-10 left-10 p-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl max-w-xs">
          <div className="flex gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Live Generation</span>
          </div>
          <p className="text-white/80 text-sm italic font-light">
            "Create a minimalist music player with frosted glass and neon accents..."
          </p>
        </div>
      </motion.div>
    </section>
  );
};
