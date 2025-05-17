
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Headphones, FileText, MessageCircle, Brain, ArrowRight, PlayCircle, Briefcase, UserCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface FeatureListItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureListItem: React.FC<FeatureListItemProps> = ({ icon: Icon, title, description }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 p-2.5 bg-primary/10 rounded-lg">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const SolutionsPage = () => {
  const primaryButtonClass = "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-primary/40 transition-all duration-300 transform hover:scale-105 py-3 px-6 text-base";
  const outlineButtonClass = "border-primary text-primary hover:bg-primary/10 hover:text-accent-foreground shadow-sm hover:shadow-primary/20 transition-all duration-300 transform hover:scale-105 py-3 px-6 text-base";

  return (
    <div className="min-h-screen bg-background text-foreground py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4">
        
        {/* Main Title */}
        <section className="text-center mb-16 md:mb-24">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            AI Recruiter <span className="text-primary">Co-Pilot</span>
          </h1>
        </section>

        {/* AI Recruiter Co-Pilot Intro Section */}
        <section className="mb-16 md:mb-24 max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="bg-primary/10 text-primary py-1 px-3 text-sm font-semibold mb-4">
            Advanced AI Recruitment
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-foreground">
            AI Recruiter Co-Pilot
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl leading-relaxed">
            Our AI-powered platform conducts intelligent screening interviews at scale, handling thousands
            of candidates while providing personalized feedback and creating a fairer hiring process.
          </p>
        </section>

        {/* AI Co-Pilot Demo Section */}
        <section className="mb-16 md:mb-24">
          <Card className="bg-card/50 border-border/30 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-card via-card/80 to-secondary/10 p-6">
              <CardTitle className="text-2xl font-semibold text-foreground flex items-center">
                <Headphones className="mr-3 h-7 w-7 text-primary animate-pulse" />
                AI Co-Pilot Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 lg:p-12">
              <div className="flex flex-col items-center text-center bg-muted/20 p-8 md:p-12 rounded-xl shadow-inner border border-border/20">
                <Headphones className="h-20 w-20 text-primary mb-6 opacity-80" />
                <h3 className="text-2xl font-bold text-foreground mb-3">AI Interview Demo</h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Watch how our AI Co-Pilot conducts intelligent screening
                  interviews with voice synthesis and real-time analysis.
                </p>
                <Button className={primaryButtonClass} size="lg" disabled>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Play Demo (Coming Soon)
                </Button>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                {[
                  { icon: Brain, title: "AI-Powered", description: "Uses GPT-4o for intelligent, natural conversations." },
                  { icon: MessageCircle, title: "Voice Enabled", description: "Natural voice synthesis for interactive interviews." },
                  { icon: FileText, title: "Detailed Analysis", description: "Comprehensive feedback for every candidate." },
                ].map(item => (
                  <div key={item.title} className="p-6 bg-muted/10 rounded-lg border border-border/20 shadow-md hover:shadow-primary/10 transition-shadow">
                    <item.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How Merit AI Co-Pilot Works Section */}
        <section className="mb-16 md:mb-24">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12 text-foreground">
            How Merit AI Co-Pilot <span className="text-primary">Works</span>
          </h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <FeatureListItem
              icon={FileText}
              title="CV and Job Analysis"
              description="Our AI system analyzes CVs and job descriptions to identify key skills, qualifications, and experience requirements, ensuring tailored interview questions."
            />
            <FeatureListItem
              icon={MessageCircle}
              title="Voice-Based Interviews"
              description="Using advanced voice synthesis and recognition, candidates engage in natural conversations with our AI interviewer, creating a more human-like experience."
            />
            <FeatureListItem
              icon={Brain}
              title="Intelligent Assessment"
              description="Responses are analyzed in real-time for technical accuracy, communication skills, problem-solving ability, and job fit, providing comprehensive candidate profiles."
            />
          </div>
        </section>

        {/* For Companies & For Candidates Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gradient-to-br from-primary/5 via-card/70 to-secondary/20 border-border/30 shadow-xl p-8 text-center md:text-left transform hover:scale-[1.02] transition-transform duration-300">
             <div className="flex flex-col items-center md:items-start">
                <Briefcase className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-3">For Companies</h3>
                <p className="text-muted-foreground mb-6">
                  Screen thousands of candidates efficiently, reduce hiring bias, and identify top talent with our AI-powered interview technology.
                </p>
                <Button className={primaryButtonClass} disabled>
                  Explore Plans <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
             </div>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 via-card/70 to-secondary/20 border-border/30 shadow-xl p-8 text-center md:text-left transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex flex-col items-center md:items-start">
                <UserCheck className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-3">For Candidates</h3>
                <p className="text-muted-foreground mb-6">
                  Get interview practice, personalized feedback, and improve your skills while being considered for opportunities at top companies.
                </p>
                <Button className={outlineButtonClass.replace("border-primary text-primary hover:bg-primary/10", "border-accent text-accent hover:bg-accent/10")} asChild>
                  <Link href="/auth/signup?role=talent">
                    Join Talent Pool <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default SolutionsPage;
