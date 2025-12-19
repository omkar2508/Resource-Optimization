import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Workflow } from "@/components/Workflow";
import { Footer } from "@/components/Footer";
import ScrollToHash from "../components/ScrolltoHash";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <ScrollToHash />
      <Hero />
      <Features />
      <Workflow />
      <Footer />
    </div>
  );
};
export default Index;
