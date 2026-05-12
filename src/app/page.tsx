import React from 'react';
import LandingNavbar from '@/components/LandingNavbar';
import LandingFooter from '@/components/LandingFooter';
import HeroSection from '@/app/components/HeroSection';
import IndustriesSection from '@/app/components/IndustriesSection';
import FeaturesSection from '@/app/components/FeaturesSection';
import PricingPreviewSection from '@/app/components/PricingPreviewSection';
import WhyUsSection from '@/app/components/WhyUsSection';
import FaqSection from '@/app/components/FaqSection';
import ContactSection from '@/app/components/ContactSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />
      <main>
        <HeroSection />
        <IndustriesSection />
        <FeaturesSection />
        <PricingPreviewSection />
        <WhyUsSection />
        <FaqSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  );
}