import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroBanner from "@/components/home/HeroBanner";
import CategoryQuickAccess from "@/components/home/CategoryQuickAccess";
import TrendingProducts from "@/components/home/TrendingProducts";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import BestDeals from "@/components/home/BestDeals";
import Testimonials from "@/components/home/Testimonials";
import Newsletter from "@/components/home/Newsletter";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <HeroBanner />

      {/* Categories */}
      <CategoryQuickAccess />

      {/* Flash Deals */}
      <BestDeals />

      {/* Trending Products */}
      <TrendingProducts />

      {/* Why Shop With Us */}
      <WhyChooseUs />

      {/* Testimonials */}
      <Testimonials />

      {/* Newsletter */}
      <Newsletter />

      <Footer />
    </main>
  );
}


