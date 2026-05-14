import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { BentoGrid } from "../components/BentoGrid";
import { Showcase } from "../components/Showcase";
import { Footer } from "../components/Footer";

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <BentoGrid />
        <Showcase />
      </main>
      <Footer />
    </div>
  );
};
