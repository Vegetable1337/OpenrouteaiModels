import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const gallery = [
  {
    src: "https://images.unsplash.com/photo-1750969185331-e03829f72c7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG5ldXJhbCUyMG5ldHdvcmslMjBnbG93JTIwcGluayUyMGJsdWV8ZW58MXx8fHwxNzc4Njk4NjExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    label: "Generative Neural Flows",
    span: "md:col-span-2"
  },
  {
    src: "https://images.unsplash.com/photo-1771741922469-ecbec53fd65c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwbW9kZXJuJTIwYXJjaGl0ZWN0dXJlJTIwZ2xhc3MlMjB3aGl0ZXxlbnwxfHx8fDE3Nzg2OTg2MTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    label: "Space Optimization AI",
    span: "md:col-span-1"
  },
  {
    src: "https://images.unsplash.com/photo-1623431846499-5327c0fb86a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFpJ29ya3NwYWNlJTIwbGlxdWlkJTIwbWV0YWx8ZW58MXx8fHwxNzc4Njk4NjExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    label: "Liquid Metal Interfaces",
    span: "md:col-span-3"
  }
];

export const Showcase = () => {
  return (
    <section id="showcase" className="py-24 px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Elegance in every generation.</h2>
            <p className="text-white/40 text-lg">
              Aether AI understands the principles of design. It doesn't just copy; it invents. 
              Explore the boundaries of the new iOS 26 design language.
            </p>
          </div>
          <button className="text-white font-medium border-b border-white/20 pb-1 hover:border-white transition-colors">
            View full gallery
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gallery.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative overflow-hidden rounded-[2.5rem] aspect-square md:aspect-auto md:h-[500px] border border-white/10 ${item.span} group`}
            >
              <ImageWithFallback
                src={item.src}
                alt={item.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-10">
                <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold mb-2">Concept</p>
                <h3 className="text-2xl font-medium text-white">{item.label}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
