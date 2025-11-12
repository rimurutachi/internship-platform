"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Brain, Users, BarChart3, Shield, BookOpen, Building2, GraduationCap, Sparkles, Eye, Clock, UserCheck, Zap, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const features = [
    {
      icon: Zap,
      title: "Revolutionary AI Technology",
      description: "Linear Law-based Feature Transformation (LLT) with Sentiment Analysis provides unparalleled accuracy in intern evaluation and performance prediction",
      badge: "AI Core",
      gradient: "bg-gradient-ai"
    },
    {
      icon: Users,
      title: "Multi-Stakeholder Platform",
      description: "Seamless coordination between students, university advisors, and company supervisors with role-specific dashboards and workflows",
      badge: "Collaboration",
      gradient: "bg-gradient-primary"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Comprehensive dashboards with live progress tracking, performance insights, and predictive analytics for informed decision-making",
      badge: "Analytics",
      gradient: "bg-gradient-primary"
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with academic standards compliance, FERPA compliance, and robust role-based access control",
      badge: "Security",
      gradient: "bg-gradient-ai"
    }
  ];

  const roles = [
    {
      id: "student",
      title: "Student",
      icon: GraduationCap,
      description: "Track your internship progress, submit reports, and receive AI-powered feedback",
      color: "bg-primary"
    },
    {
      id: "advisor",
      title: "University Advisor",
      icon: BookOpen,
      description: "Monitor student progress, review evaluations, and coordinate with companies",
      color: "bg-ai"
    },
    {
      id: "supervisor",
      title: "Company Supervisor",
      icon: Building2,
      description: "Evaluate interns, provide feedback, and access AI-powered insights",
      color: "bg-success"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Intern-Galing</span>
          </div>
          
          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a>
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" className="bg-gradient-primary hover:opacity-90" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-background via-primary/5 to-ai/10 relative overflow-hidden">
        {/* Background geometric pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 border border-primary/20 rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-ai/10 rounded-lg rotate-45"></div>
          <div className="absolute bottom-32 left-1/4 w-16 h-16 border-2 border-ai/20 rotate-12"></div>
        </div>
        
        <div className="container mx-auto text-center max-w-4xl relative">
          <Badge className="mb-6 bg-gradient-ai text-white border-0 px-4 py-2 text-sm font-medium animate-pulse">
            <Sparkles className="w-4 h-4 mr-2" />
            LINEAR LAW-BASED TRANSFORMATION + SENTIMENT ANALYSIS
          </Badge>
          <h1 className="text-6xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-ai bg-clip-text text-transparent leading-tight">
            AI-Powered University-Industry Bridge
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            Streamline internship management with intelligent evaluation and seamless collaboration 
            between students, advisors, and companies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-elegant group" asChild>
              <Link href="/login">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary/20 hover:bg-primary/5 group">
              <Eye className="mr-2 w-4 h-4" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 -mt-10 relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-gradient-primary text-white border-0 hover:scale-105 transition-transform duration-300">
              <CardContent className="text-center p-8">
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-lg opacity-90">Evaluation Accuracy</div>
                <p className="text-sm opacity-80 mt-2">AI-powered precision in intern assessment</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-ai text-white border-0 hover:scale-105 transition-transform duration-300">
              <CardContent className="text-center p-8">
                <div className="text-4xl font-bold mb-2">80%</div>
                <div className="text-lg opacity-90">Time Savings for Advisors</div>
                <p className="text-sm opacity-80 mt-2">Automated workflows and evaluations</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-success to-success/80 text-white border-0 hover:scale-105 transition-transform duration-300">
              <CardContent className="text-center p-8">
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-lg opacity-90">Students Successfully Placed</div>
                <p className="text-sm opacity-80 mt-2">Connecting talent with opportunities</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Intelligent Internship Management
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Experience the future of internship coordination with our revolutionary AI-powered platform 
              that transforms how universities and industry collaborate.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-elegant transition-all duration-300 border-border/50 group hover:scale-105">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${feature.gradient} mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="outline" className="w-fit mx-auto mb-3 border-primary/20">
                    {feature.badge}
                  </Badge>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center leading-relaxed text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Choose Your Role
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Access tailored dashboards designed for your specific needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {roles.map((role) => (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-elegant ${
                  selectedRole === role.id ? 'ring-2 ring-primary shadow-elegant' : ''
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-2xl ${role.color} flex items-center justify-center mb-4`}>
                    <role.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center leading-relaxed mb-6">
                    {role.description}
                  </CardDescription>
                  <Button 
                    className="w-full" 
                    variant={selectedRole === role.id ? "default" : "outline"}
                    onClick={() => setSelectedRole(role.id)}
                    asChild
                  >
                    <Link href="/login">Access Dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-background to-ai/10">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to Transform Your Internship Program?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of students, advisors, and companies already using Intern-Galing
          </p>
          <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-elegant" asChild>
            <Link href="/login">
              Get Started Today
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-hero rounded-md flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">Intern-Galing</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 Intern-Galing. Bridging Universities & Industry with AI.
          </p>
        </div>
      </footer>
    </div>
  );
}