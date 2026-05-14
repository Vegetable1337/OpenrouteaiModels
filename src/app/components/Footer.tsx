import { Cpu } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-20 px-6 border-t border-white/5 bg-black">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-linear-to-tr from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-2xl text-white tracking-tighter">Aether</span>
          </div>
          <p className="text-white/30 text-sm max-w-[240px] leading-relaxed">
            Revolutionizing the design industry with neural interfaces and the iOS 26 design language.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-medium">Product</h4>
            <ul className="flex flex-col gap-2 text-sm text-white/40">
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#" className="hover:text-white">Showcase</a></li>
              <li><a href="#" className="hover:text-white">Beta Program</a></li>
              <li><a href="#" className="hover:text-white">API</a></li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-medium">Company</h4>
            <ul className="flex flex-col gap-2 text-sm text-white/40">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-medium">Social</h4>
            <ul className="flex flex-col gap-2 text-sm text-white/40">
              <li><a href="#" className="hover:text-white">X / Twitter</a></li>
              <li><a href="#" className="hover:text-white">Instagram</a></li>
              <li><a href="#" className="hover:text-white">LinkedIn</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-white/20 uppercase tracking-widest font-bold">
        <span>© 2026 Aether Labs Inc. All rights reserved.</span>
        <span>Designed in California. Made with AI.</span>
      </div>
    </footer>
  );
};
