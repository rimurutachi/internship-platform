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
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image 
              src="/logo.png" 
              alt="Intern-Galing Logo" 
              width={40} 
              height={40}
              className="object-contain"
            />
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                CAVITE STATE UNIVERSITY - BACOOR CITY CAMPUS
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Image 
              src="/cvsu-logo.png" 
              alt="CvSU Logo" 
              width={32} 
              height={32}
              className="object-contain"
            />
            <Image 
              src="/bagong-pilipinas-logo.png" 
              alt="Bagong Pilipinas Logo" 
              width={32} 
              height={32}
              className="object-contain"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-background py-16 px-6">
        <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Content */}
          <div className="flex-1 max-w-2xl">
            <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              INTERN-GALING<br />
              DIGITAL PLATFORM
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Streamline internship management with intelligent evaluation and seamless 
              collaboration between students, advisors, and companies.
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-md shadow-lg"
              asChild
            >
              <Link href="/login">
                Login
              </Link>
            </Button>
          </div>

          {/* Right Illustration */}
          <div className="flex-1 flex justify-center">
            <Image 
              src="/landingpic.png" 
              alt="Team Collaboration" 
              width={500} 
              height={400}
              className="object-contain"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-muted py-16 px-6">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            About the Platform
          </h2>
          <p className="text-lg mb-12 max-w-4xl text-primary font-semibold">
            Intern-Galing is designed to help CvSU Bacoor students, coordinators, and industry partners manage internship processes 
            efficiently—from submission to evaluation.
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Digital Records */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-accent rounded-lg flex items-center justify-center">
                <FileText className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Digital Records</h3>
              <p className="text-muted-foreground">Track and upload documents easily.</p>
            </div>

            {/* Real-time Monitoring */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-accent rounded-lg flex items-center justify-center">
                <BarChart3 className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Real-time Monitoring</h3>
              <p className="text-muted-foreground">Coordinators can oversee intern progress anytime.</p>
            </div>

            {/* Seamless Communication */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-accent rounded-lg flex items-center justify-center">
                <MessageSquare className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Seamless Communication</h3>
              <p className="text-muted-foreground">Coordinators can message intern progress anytime.</p>
            </div>

            {/* Company Directory */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-accent rounded-lg flex items-center justify-center">
                <Building2 className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Company Directory</h3>
              <p className="text-muted-foreground">View registered companies and opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-background py-16 px-6">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-foreground text-center mb-16" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            How It Works
          </h2>

          {/* Steps */}
          <div className="relative max-w-5xl mx-auto">
            {/* Connection Line */}
            <div className="absolute top-12 left-0 right-0 h-1 bg-border hidden lg:block" style={{ top: '3rem' }}></div>
            
            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Step 1 */}
              <div className="text-center">
                <div className="relative mx-auto mb-6">
                  <div className="w-24 h-24 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg relative z-10">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Create an Account</h3>
                <p className="text-muted-foreground">Register and set up your profile to get started with the platform.</p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="relative mx-auto mb-6">
                  <div className="w-24 h-24 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg relative z-10">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Upload Requirements & Communicate with Advisors</h3>
                <p className="text-muted-foreground">Submit your documents and stay connected with your advisors.</p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="relative mx-auto mb-6">
                  <div className="w-24 h-24 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg relative z-10">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Track Your Internship Journey</h3>
                <p className="text-muted-foreground">Monitor your progress and complete your internship successfully.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image 
              src="/logo.png" 
              alt="Intern-Galing Logo" 
              width={32} 
              height={32}
              className="object-contain"
            />
            <span className="text-lg font-semibold text-foreground">Intern-Galing</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2025 Intern-Galing. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}