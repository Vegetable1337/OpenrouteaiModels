import { motion } from "motion/react";
import { Layers, MousePointer2, Zap, Shield, Cpu, Smartphone } from "lucide-react";

const features = [
  {
    title: "Neural Engine 2.0",
    desc: "Optimized for the latest generation of mobile processors.",
    icon: <Cpu className="w-6 h-6 text-blue-400" />,
    className: "md:col-span-2 md:row-span-2 bg-linear-to-br from-blue-600/10 to-transparent",
  },
  {
    title: "Precision Control",
    desc: "Every pixel, guided by AI.",
    icon: <MousePointer2 className="w-6 h-6 text-purple-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Instant Export",
    desc: "SwiftUI, React, and Figma ready.",
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Secure by Design",
    desc: "Enterprise-grade encryption for your intellectual property.",
    icon: <Shield className="w-6 h-6 text-green-400" />,
    className: "md:col-span-1 md:row-span-2 flex flex-col justify-end",
  },
  {
    title: "Multi-device Sync",
    desc: "Design on Mac, preview on iOS 26 instantly.",
    icon: <Smartphone className="w-6 h-6 text-pink-400" />,
    className: "md:col-span-2",
  },
];

export const BentoGrid = () => {
  return (
    <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Built for the future.</h2>
        <p className="text-white/40 text-lg">Powerful tools that feel like magic.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px]">
        {features.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 0.98 }}
            className={`group p-8 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden relative flex flex-col justify-between ${f.className}`}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="mb-4 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
            
            {/* Abstract Decorative Element for the big cards */}
            {f.className.includes("md:col-span-2") && (
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
};
