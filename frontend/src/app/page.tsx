"use client";

import Link from "next/link";
import Image from "next/image";
import { FileText, BarChart3, MessageSquare, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Image 
              src="/logo.png" 
              alt="Intern-Galing Logo" 
              width={40} 
              height={40}
              className="object-contain w-8 h-8 sm:w-10 sm:h-10"
            />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm md:text-base font-bold text-foreground leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                CAVITE STATE UNIVERSITY
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Bacoor City Campus
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            <Image 
              src="/cvsu-logo.png" 
              alt="CvSU Logo" 
              width={32} 
              height={32}
              className="object-contain w-6 h-6 sm:w-8 sm:h-8"
            />
            <Image 
              src="/bagong-pilipinas-logo.png" 
              alt="Bagong Pilipinas Logo" 
              width={32} 
              height={32}
              className="object-contain w-6 h-6 sm:w-8 sm:h-8 hidden sm:block"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-background py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10 lg:gap-16">
          {/* Left Content */}
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-4 sm:mb-6 lg:mb-8 leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              INTERNSHIP MANAGEMENT<br />
              <span className="text-primary">DIGITAL PLATFORM</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 lg:mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Streamline internship management with intelligent evaluation and seamless 
              collaboration between students, advisors, and companies.
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 lg:px-10 py-5 sm:py-6 text-base sm:text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link href="/login">
                Get Started
              </Link>
            </Button>
          </div>

          {/* Right Illustration - Using transparent image for dark mode support */}
          <div className="flex-1 flex justify-center mt-8 lg:mt-0">
            <Image 
              src="/landingpic-transparent.png" 
              alt="Team Collaboration" 
              width={550} 
              height={450}
              className="object-contain w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[550px] drop-shadow-lg"
              priority
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-muted py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center lg:text-left mb-8 sm:mb-10 lg:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 lg:mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              About the Platform
            </h2>
            <p className="text-base sm:text-lg md:text-xl max-w-4xl text-primary font-semibold mx-auto lg:mx-0">
              Intern-Galing is designed to help CvSU Bacoor students, coordinators, and industry partners manage internship processes 
              efficiently—from submission to evaluation.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
            {/* Digital Records */}
            <div className="text-center p-6 sm:p-8 bg-background rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 bg-accent rounded-xl flex items-center justify-center">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">Digital Records</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Track and upload documents easily with secure storage.</p>
            </div>

            {/* Real-time Monitoring */}
            <div className="text-center p-6 sm:p-8 bg-background rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 bg-accent rounded-xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">Real-time Monitoring</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Coordinators can oversee intern progress anytime, anywhere.</p>
            </div>

            {/* Seamless Communication */}
            <div className="text-center p-6 sm:p-8 bg-background rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 bg-accent rounded-xl flex items-center justify-center">
                <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">Seamless Communication</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Stay connected with advisors and supervisors in real-time.</p>
            </div>

            {/* Company Directory */}
            <div className="text-center p-6 sm:p-8 bg-background rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 bg-accent rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">Company Directory</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">View registered companies and available opportunities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-background py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center mb-10 sm:mb-12 lg:mb-16" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            How It Works
          </h2>

          {/* Steps */}
          <div className="relative max-w-5xl mx-auto">
            {/* Connection Line */}
            <div className="absolute top-12 left-0 right-0 h-1 bg-border hidden lg:block" style={{ top: '3rem' }}></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 relative">
              {/* Step 1 */}
              <div className="text-center">
                <div className="relative mx-auto mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl sm:text-2xl lg:text-3xl font-bold shadow-lg relative z-10 hover:scale-110 transition-transform duration-300">
                    1
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">Create an Account</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">Register and set up your profile to get started with the platform.</p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="relative mx-auto mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl sm:text-2xl lg:text-3xl font-bold shadow-lg relative z-10 hover:scale-110 transition-transform duration-300">
                    2
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">Upload & Communicate</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">Submit your documents and stay connected with your advisors.</p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="relative mx-auto mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl sm:text-2xl lg:text-3xl font-bold shadow-lg relative z-10 hover:scale-110 transition-transform duration-300">
                    3
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">Track Your Journey</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">Monitor your progress and complete your internship successfully.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <Image 
              src="/logo.png" 
              alt="Intern-Galing Logo" 
              width={32} 
              height={32}
              className="object-contain w-6 h-6 sm:w-8 sm:h-8"
            />
            <span className="text-base sm:text-lg font-semibold text-foreground">Intern-Galing</span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            © 2025 Intern-Galing. All Rights Reserved. Cavite State University - Bacoor City Campus
          </p>
        </div>
      </footer>
    </div>
  );
}