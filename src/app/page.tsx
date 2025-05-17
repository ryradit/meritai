
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Briefcase, Users, Sparkles, FileText, Brain, UsersRound, Star, MessageCircle, TrendingUp, ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import talentFindingImage from '@/components/ui/images/talentfinding.png';
import aiRecruitmentImage from '@/components/ui/images/airecruitment.png';
import reduceEngineeringImage from '@/components/ui/images/reduceengineering.png';

interface BenefitListItemProps {
  icon: React.ElementType;
  text: string;
}

const BenefitListItem: React.FC<BenefitListItemProps> = ({ icon: Icon, text }) => (
  <li className="flex items-center space-x-3">
    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <span className="text-sm text-muted-foreground">{text}</span>
  </li>
);

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  linkLabel?: string;
  linkHref?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, linkLabel, linkHref }) => (
  <Card className="bg-card/50 hover:bg-card/80 border-border/50 transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-primary/20">
    <CardHeader className="pb-3">
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      {linkLabel && linkHref && (
        <Button variant="link" asChild className="p-0 h-auto mt-3 text-primary hover:text-accent">
          <Link href={linkHref}>{linkLabel} &rarr;</Link>
        </Button>
      )}
    </CardContent>
  </Card>
);

interface TalentCardProps {
  avatarUrl: string;
  name: string;
  role: string;
  skills: string[];
  dataAiHint?: string;
}

const TalentCard: React.FC<TalentCardProps> = ({ avatarUrl, name, role, skills, dataAiHint }) => (
  <Card className="bg-card/60 border-border/50 p-5 text-center shadow-lg hover:shadow-accent/20 transition-shadow duration-300 transform hover:-translate-y-1">
    <Image src={avatarUrl} alt={name} width={96} height={96} className="rounded-full mx-auto mb-4 border-2 border-primary/50" data-ai-hint={dataAiHint || "person professional"} />
    <h3 className="text-lg font-semibold text-foreground mb-1">{name}</h3>
    <p className="text-sm text-primary mb-2">{role}</p>
    <div className="flex flex-wrap justify-center gap-1.5 mb-4">
      {skills.slice(0, 3).map(skill => (
        <span key={skill} className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-full">{skill}</span>
      ))}
    </div>
    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">View Profile</Button>
  </Card>
);


interface TestimonialCardProps {
  quote: string;
  name: string;
  company: string;
  avatarUrl: string;
  dataAiHint?: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, company, avatarUrl, dataAiHint }) => (
  <Card className="bg-card/60 border-border/50 p-6 shadow-lg h-full flex flex-col">
    <Star className="w-5 h-5 text-yellow-400 mb-3" />
    <blockquote className="text-muted-foreground mb-4 flex-grow">"{quote}"</blockquote>
    <div className="flex items-center space-x-3 mt-auto">
      <Image src={avatarUrl} alt={name} width={40} height={40} className="rounded-full" data-ai-hint={dataAiHint || "person professional"} />
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{company}</p>
      </div>
    </div>
  </Card>
);


export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) { // Keep loading screen if auth state is loading or user is logged in (and about to be redirected)
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  const primaryButtonClass = "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-primary/40 transition-all duration-300 transform hover:scale-105 py-3 px-8 text-base";
  const outlineButtonClass = "border-primary text-primary hover:bg-primary/10 hover:text-accent-foreground shadow-sm hover:shadow-primary/20 transition-all duration-300 transform hover:scale-105 py-3 px-8 text-base";


  return (
    <div className="flex flex-col items-center bg-background text-foreground min-h-screen selection:bg-primary/30 selection:text-primary-foreground">
      
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 lg:py-40 bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Find & Vet Elite Tech Talent with <span className="text-primary">Merit AI</span>
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
                A revolutionary platform leveraging AI to source, screen, and match top-tier technical professionals with innovative companies worldwide.
              </p>
              <ul className="space-y-3 text-sm">
                <BenefitListItem icon={Sparkles} text="Automated AI-Screening & Vetting" />
                <BenefitListItem icon={MessageCircle} text="AI-Powered Technical & Behavioural Interviews" />
                <BenefitListItem icon={TrendingUp} text="Talk to Pre-Vetted Candidates in Days, Not Weeks" />
                <BenefitListItem icon={ShieldCheck} text="Unbiased, Skill-Based Hiring Decisions" />
              </ul>
              <div className="flex flex-col gap-3 min-[400px]:flex-row pt-4">
                <Button size="lg" className={primaryButtonClass} asChild>
                  <Link href="/auth/signup?role=recruiter">Hire Talent</Link>
                </Button>
                <Button size="lg" variant="outline" className={outlineButtonClass} asChild>
                  <Link href="/auth/signup?role=talent">Apply as Dev</Link>
                </Button>
              </div>
            </div>
            <div className="relative p-6 bg-card/30 border border-border/40 rounded-xl shadow-2xl backdrop-blur-sm">
              <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center">
                 <Image src={talentFindingImage} alt="AI powered talent vetting and recruitment" width={600} height={400} className="rounded-lg shadow-xl object-contain" data-ai-hint="talent search recruitment" />
              </div>
               <div className="absolute -top-4 -right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg animate-pulse">
                <Sparkles className="h-6 w-6"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Our Advantage</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">Why Leading Companies Choose Merit AI</h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              We combine cutting-edge AI with deep recruitment expertise to deliver unparalleled results.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Brain}
              title="Rigorous Vetting Process"
              description="Multi-stage AI and human-led assessments ensure only the top 5% of talent make it through."
              linkLabel="Learn More"
              linkHref="#"
            />
            <FeatureCard
              icon={Zap}
              title="AI-Powered Matching"
              description="Our intelligent algorithms match candidates to roles with unparalleled precision, beyond just keywords."
              linkLabel="Explore Features"
              linkHref="#"
            />
            <FeatureCard
              icon={UsersRound}
              title="Faster Hiring Cycles"
              description="Reduce time-to-hire significantly by accessing a curated pool of interview-ready candidates."
              linkLabel="See Case Studies"
              linkHref="#"
            />
          </div>
        </div>
      </section>
      
      {/* End-to-End Solution Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-secondary/10">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Comprehensive Platform</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">An End-to-End Recruitment Solution</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: "Talent Sourcing", description: "Access a global pool of actively and passively seeking candidates." },
              { icon: FileText, title: "CV Parsing & Analysis", description: "AI extracts key skills and experience automatically." },
              { icon: MessageCircle, title: "AI Interviews", description: "Conduct consistent, unbiased initial interviews at scale." },
              { icon: CheckCircle, title: "Skills Assessment", description: "Validate technical abilities with tailored coding challenges." },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center text-center p-6 bg-card/40 rounded-lg shadow-md hover:shadow-primary/10 transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-md font-semibold text-foreground mb-1.5">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Elite Talent Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12 lg:mb-16">
             <span className="text-sm font-semibold text-primary uppercase tracking-wider">Top Professionals</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">Southeast Asia's Elite Engineering Talent</h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              Discover pre-vetted software engineers, data scientists, and product managers ready for their next challenge.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <TalentCard avatarUrl="https://placehold.co/96x96.png" name="Lila Chen" role="Senior Full Stack Developer" skills={["React", "Node.js", "AWS"]} dataAiHint="woman software developer" />
            <TalentCard avatarUrl="https://placehold.co/96x96.png" name="Raj Patel" role="Lead Data Scientist" skills={["Python", "TensorFlow", "MLOps"]} dataAiHint="man data scientist" />
            <TalentCard avatarUrl="https://placehold.co/96x96.png" name="Aisha Khan" role="Product Manager" skills={["Agile", "UX/UI", "Roadmapping"]} dataAiHint="woman product manager" />
            <TalentCard avatarUrl="https://placehold.co/96x96.png" name="Ben Lim" role="DevOps Engineer" skills={["Kubernetes", "CI/CD", "Terraform"]} dataAiHint="man devops engineer" />
          </div>
          <div className="text-center mt-12">
            <Button size="lg" className={primaryButtonClass} asChild>
              <Link href="/marketplace">View More Talent</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* AI-Powered Recruitment Partner Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-secondary/10 overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-all duration-500 hover:scale-105">
              <Image src={aiRecruitmentImage} alt="AI Recruitment Partner" width={600} height={450} className="object-cover w-full h-full" data-ai-hint="AI recruitment" />
            </div>
            <div className="space-y-6">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Your Strategic Partner</span>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">AI-Powered Recruitment Partner</h2>
              <p className="text-lg text-muted-foreground">
                Merit AI goes beyond simple automation. We provide deep insights and a partnership approach to help you build high-performing tech teams.
              </p>
              <ul className="space-y-3">
                <BenefitListItem icon={CheckCircle} text="Data-Driven Insights for Better Hiring" />
                <BenefitListItem icon={UsersRound} text="Reduced Bias in Screening and Interviews" />
                <BenefitListItem icon={TrendingUp} text="Improved Quality of Hire and Retention" />
                <BenefitListItem icon={ShieldCheck} text="Dedicated Support and Consultation" />
              </ul>
              <Button variant="outline" size="lg" className={outlineButtonClass}>Learn About Our Process</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Client Testimonials</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">Success Stories from Global Companies</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Merit AI transformed our tech hiring. We found exceptional talent faster than ever before. The AI vetting is incredibly accurate."
              name="Sarah L., CTO"
              company="Innovatech Solutions"
              avatarUrl="https://placehold.co/40x40.png"
              dataAiHint="woman executive"
            />
            <TestimonialCard
              quote="The quality of candidates presented by Merit AI was outstanding. Their platform saved us countless hours in screening."
              name="John B., Head of Engineering"
              company="NextGen Systems"
              avatarUrl="https://placehold.co/40x40.png"
              dataAiHint="man engineer"
            />
            <TestimonialCard
              quote="As a startup, finding the right technical fit is crucial. Merit AI understood our needs and delivered candidates who made an immediate impact."
              name="Priya K., Founder"
              company="ScaleUp Ventures"
              avatarUrl="https://placehold.co/40x40.png"
              dataAiHint="woman founder"
            />
          </div>
        </div>
      </section>

      {/* Reduce Costs Section / CTA */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-secondary/20 to-background">
        <div className="container px-4 md:px-6">
          <div className="bg-card/50 border border-border/30 rounded-xl shadow-2xl p-8 md:p-12 lg:p-16 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                  Reduce Engineering Costs by <span className="text-primary">50%</span> Without Compromising Quality
                </h2>
                <p className="text-lg text-muted-foreground">
                  Leverage our AI-vetted global talent pool to build your dream team efficiently and cost-effectively.
                </p>
                <ul className="space-y-2 text-sm">
                  <BenefitListItem icon={CheckCircle} text="Access Top-Tier Global Talent" />
                  <BenefitListItem icon={CheckCircle} text="Transparent, Competitive Pricing" />
                  <BenefitListItem icon={CheckCircle} text="Scale Your Team On-Demand" />
                </ul>
                <div className="flex flex-col gap-3 min-[400px]:flex-row pt-4">
                  <Button size="lg" className={primaryButtonClass} asChild>
                    <Link href="/auth/signup?role=recruiter">Get Started Now</Link>
                  </Button>
                  <Button size="lg" variant="outline" className={outlineButtonClass}>Request a Demo</Button>
                </div>
              </div>
              <div className="relative h-64 lg:h-full min-h-[300px] rounded-lg overflow-hidden">
                 <Image src={reduceEngineeringImage} alt="Team collaborating on cost reduction graph" layout="fill" objectFit="cover" className="rounded-lg" data-ai-hint="cost reduction graph" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
