
"use client";

import Link from "next/link";
import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Briefcase, Users, FileText, PlayCircle, AlertTriangle, Loader2, Settings, Sparkles,
  Bot, Edit3, FileEdit, MessageSquare, CheckCircle2, Repeat, ShieldCheck, UserCheck, HelpCircle, ExternalLink, Home, ChevronRight, Filter,SlidersHorizontal, ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { UserProfileData, TalentTier, UserRole } from "@/services/userService";
import { updateUserDocument } from "@/services/userService";
import { interviewQuestionGenerator, type InterviewQuestionGeneratorInput } from "@/ai/flows/interview-question-generator";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, parseISO, differenceInMilliseconds } from 'date-fns';
import TalentListing from "@/components/TalentListing";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const itSkillCategories = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Cloud Computing",
  "Cybersecurity",
  "AI & ML",
  "DevOps",
  "UI/UX Design",
  "Game Development",
  "QA & Testing",
  "Database Management",
];

const availabilityOptions = [
  "Immediately",
  "2 Weeks Notice Period",
  "1 Month Notice Period",
  "2 Months Notice Period",
];


interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  style?: React.CSSProperties;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, style }) => (
  <Card style={style} className="shadow-lg hover:shadow-primary/30 transition-shadow duration-300 bg-card border border-primary/20 rounded-xl transform hover:-translate-y-1 hover:scale-[1.02] animate-fade-in-up">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="text-primary">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{value}</div>
      {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
    </CardContent>
  </Card>
);

interface JourneyStep {
  icon: React.ElementType;
  text: string;
  completed: boolean;
  inProgress?: boolean;
  isCurrent?: boolean;
}

const JourneyItem: React.FC<{ step: JourneyStep; isLast: boolean }> = ({ step, isLast }) => (
  <li className="flex items-start space-x-3">
    <div className="flex flex-col items-center">
      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center
        ${step.completed ? 'bg-green-500/20 text-green-400'
        : step.isCurrent || step.inProgress ? 'bg-yellow-500/20 text-yellow-400 animate-pulse'
        : 'bg-primary/20 text-primary'}`}>
        {step.isCurrent || step.inProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <step.icon className="h-4 w-4" />}
      </div>
      {!isLast && <div className={`w-px h-6 mt-1 ${step.completed ? 'bg-green-500/50' : (step.isCurrent || step.inProgress) ? 'bg-yellow-500/40' : 'bg-primary/30'}`}></div>}
    </div>
    <span className={`text-sm ${step.completed ? 'text-green-400 line-through' : (step.isCurrent || step.inProgress) ? 'text-yellow-400' : 'text-foreground'}`}>{step.text}</span>
  </li>
);

function DashboardPageContent() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPreparingInterview, setIsPreparingInterview] = useState(false);
  const [countdownDisplay, setCountdownDisplay] = useState<string>("N/A");
  
  const searchParams = useSearchParams();

  // State for filters driven by Navbar URL params
  const [navSearchTerm, setNavSearchTerm] = useState('');
  const [navLocationFilter, setNavLocationFilter] = useState('');
  const [navMinExpFilter, setNavMinExpFilter] = useState('');
  const [navMaxRateFilter, setNavMaxRateFilter] = useState('');

  // State for dashboard-specific filters
  const [dashboardSkillFilter, setDashboardSkillFilter] = useState(''); // This will update navSearchTerm
  const [dashboardAvailabilityFilter, setDashboardAvailabilityFilter] = useState('');

  useEffect(() => {
    setNavSearchTerm(searchParams.get('search') || '');
    setNavLocationFilter(searchParams.get('location') || '');
    setNavMinExpFilter(searchParams.get('minExp') || '');
    setNavMaxRateFilter(searchParams.get('maxRate') || '');
    // Reset dashboard specific filters when URL params change
    setDashboardSkillFilter(''); 
    setDashboardAvailabilityFilter('');
  }, [searchParams]);

  // When dashboard skill filter changes, update the main search term
  // This allows the TalentListing to react to the skill dropdown
  const handleSkillChange = (skill: string) => {
    setDashboardSkillFilter(skill);
    setNavSearchTerm(skill); // Update the main search term
  };
  
  const handleAvailabilityChange = (availability: string) => {
    setDashboardAvailabilityFilter(availability);
  };


  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (userData?.talentTier === "re_interview_eligible" && userData.nextInterviewEligibleDate) {
      const eligibleDate = parseISO(userData.nextInterviewEligibleDate);

      const updateCountdown = () => {
        const now = new Date();
        const diffMs = differenceInMilliseconds(eligibleDate, now);

        if (diffMs <= 0) {
          setCountdownDisplay("Eligible Now");
          if (intervalId) clearInterval(intervalId);
        } else {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
          setCountdownDisplay(
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          );
        }
      };
      updateCountdown(); // Initial call
      intervalId = setInterval(updateCountdown, 1000);
    } else {
      setCountdownDisplay("N/A");
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userData?.talentTier, userData?.nextInterviewEligibleDate]);


  const handlePrepareInterview = async (isRetake = false) => {
    if (!user || !userData || !userData.headline || !userData.professionalSummary || userData.role !== 'talent') {
      toast({ variant: "destructive", title: "Profile Incomplete", description: "Please ensure your headline and professional summary are complete before preparing for an AI interview." });
      return;
    }
    setIsPreparingInterview(true);
    try {
      const questionInput: InterviewQuestionGeneratorInput = {
        professionalHeadline: userData.headline,
        professionalSummary: userData.professionalSummary,
        cvSkills: userData.cvSkills || [],
        cvExperienceSummary: userData.cvExperience?.map(e => `${e.title} at ${e.company}: ${e.description}`).join('\n') || userData.cvAnalysisSummary || "",
        candidateRole: userData.headline || "Candidate",
      };
      console.log("[Dashboard] Preparing interview with input:", JSON.stringify(questionInput, null, 2));

      const questions = await interviewQuestionGenerator(questionInput);
      
      if (!questions || !questions.behaviouralQuestions?.length || !questions.situationalQuestions?.length || !questions.technicalQuestions?.length) {
        console.error("[Dashboard] AI question generator returned invalid data:", questions);
        throw new Error("AI question generator returned invalid or incomplete data. Please check your profile and try again, or contact support if the issue persists.");
      }

      await updateUserDocument(user.uid, 'talent', {
        interviewQuestions: questions,
        talentStatus: "interview_invited",
        weightedTotalScore: null, 
        talentTier: null, 
        nextInterviewEligibleDate: null, 
        interviewReportSummary: null, 
      });
      await refreshUserData(); 
      toast({ title: isRetake ? "Re-Interview Ready!" : "Interview Ready!", description: "Your AI interview questions have been generated." });
    } catch (error: any) {
      console.error("[Dashboard] Error preparing interview:", error);
      const errorMessage = error.message || "Could not generate tailored interview questions. Please check your profile details or try again.";
      toast({ variant: "destructive", title: "AI Preparation Failed", description: errorMessage });
    } finally {
      setIsPreparingInterview(false);
    }
  };


  if (loading || (!user && !userData)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  if (!user) { 
    return (
         <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <p className="text-lg text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }
  
  if (!userData) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3 text-foreground">Error Loading Profile Data</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl">
           We couldn't load your profile information. This might be due to a network issue or a problem with accessing your data. Please ensure your Firestore security rules allow you to read your own profile document from the 'talents' or 'recruiters' collection (e.g., `allow read: if request.auth.uid == userId;`).
        </p>
        <div className="flex gap-4">
            <Button onClick={() => refreshUserData()} variant="outline">
                <Repeat className="mr-2 h-4 w-4"/> Try Again
            </Button>
            <Button onClick={() => router.push('/')}>Go to Homepage</Button>
        </div>
      </div>
    );
  }


  if (userData.role === "talent") {
    const talentStatus = userData.talentStatus || "new";
    const talentTier = userData.talentTier;
    
    const cardBaseClass = "shadow-xl transition-all duration-300 ease-in-out bg-card border border-primary/20 hover:border-primary/40 text-foreground rounded-2xl transform hover:-translate-y-1 hover:scale-[1.01] animate-fade-in-up overflow-hidden";
    const primaryButtonClass = "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-primary/40 transition-all duration-300 transform hover:scale-105";
    const outlineButtonClass = "border-primary text-primary hover:bg-primary/10 font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-primary/20 transition-all duration-300 transform hover:scale-105";

    let journeySteps: JourneyStep[] = [];
    let profileCompletionPercentage = 0;
    let currentStageText = "New Talent";

    switch (talentStatus) {
      case "new":
        profileCompletionPercentage = 20;
        currentStageText = "Complete Profile";
        journeySteps = [
          { icon: Edit3, text: "Complete Your Profile & CV", completed: false, isCurrent: true },
          { icon: Bot, text: "Prepare for AI Interview", completed: false },
          { icon: PlayCircle, text: "Take AI Interview", completed: false },
          { icon: FileText, text: "Receive Interview Report", completed: false },
          { icon: UserCheck, text: "Finalize Full Profile", completed: false },
        ];
        break;
      case "profile_submitted":
        profileCompletionPercentage = 40;
        currentStageText = "Prepare for Interview";
        journeySteps = [
          { icon: Edit3, text: "Profile & CV Submitted", completed: true },
          { icon: Bot, text: "Prepare for AI Interview", completed: false, isCurrent: true },
          { icon: PlayCircle, text: "Take AI Interview", completed: false },
          { icon: FileText, text: "Receive Interview Report", completed: false },
          { icon: UserCheck, text: "Finalize Full Profile", completed: false },
        ];
        break;
      case "interview_invited":
        profileCompletionPercentage = 60;
        currentStageText = "Take AI Interview";
        journeySteps = [
          { icon: Edit3, text: "Profile & CV Submitted", completed: true },
          { icon: Bot, text: "AI Interview Prepared", completed: true },
          { icon: PlayCircle, text: "Take AI Interview", completed: false, isCurrent: true },
          { icon: FileText, text: "Receive Interview Report", completed: false },
          { icon: UserCheck, text: "Finalize Full Profile", completed: false },
        ];
        break;
      case "interview_completed_processing_summary":
         profileCompletionPercentage = 80;
         currentStageText = "Report Processing";
        journeySteps = [
          { icon: Edit3, text: "Profile & CV Submitted", completed: true },
          { icon: Bot, text: "AI Interview Prepared", completed: true },
          { icon: PlayCircle, text: "AI Interview Taken", completed: true },
          { icon: FileText, text: "Report Generation in Progress", completed: false, inProgress: true, isCurrent: true },
          { icon: UserCheck, text: "Finalize Full Profile", completed: false },
        ];
        break;
      case "report_ready":
        profileCompletionPercentage = 90;
        currentStageText = talentTier ? `Tier: ${talentTier.replace(/_/g, ' ')}` : "Report Ready";
         journeySteps = [
          { icon: Edit3, text: "Profile & CV Submitted", completed: true },
          { icon: Bot, text: "AI Interview Prepared", completed: true },
          { icon: PlayCircle, text: "AI Interview Taken", completed: true },
          { icon: FileText, text: "Interview Report Ready", completed: true },
          { icon: UserCheck, text: "Finalize Full Profile", completed: false, isCurrent: true },
        ];
        if (talentTier === 're_interview_eligible') {
             journeySteps[4].text = "Re-interview or Improve Profile";
        } else if (talentTier === 'priority' || talentTier === 'verified' || talentTier === 'manual_review') {
            journeySteps[4].text = "Complete Full Profile & Get Matched";
        }
        break;
      case "profile_fully_completed":
        profileCompletionPercentage = 100;
        currentStageText = talentTier ? `Tier: ${talentTier.replace(/_/g, ' ')} - Ready for Matching` : "Profile Complete";
        journeySteps = [
          { icon: Edit3, text: "Profile & CV Submitted", completed: true },
          { icon: Bot, text: "AI Interview Prepared", completed: true },
          { icon: PlayCircle, text: "AI Interview Taken", completed: true },
          { icon: FileText, text: "Interview Report Ready", completed: true },
          { icon: UserCheck, text: "Full Profile Completed", completed: true },
          { icon: Briefcase, text: "Explore Job Opportunities", completed: false, isCurrent: true },
        ];
        break;
      default: 
        profileCompletionPercentage = 10;
        currentStageText = "Getting Started";
        journeySteps = [ { icon: HelpCircle, text: "Define Your Path", completed: false, isCurrent: true }];
    }

    const isRetakeEligible = countdownDisplay === "Eligible Now";


    return (
      <div className="space-y-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2 sm:mb-0">
            Welcome, {userData.fullName || user?.displayName || "Talent"}!
          </h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Journey Progress:</span>
            <Progress value={profileCompletionPercentage} className="w-32 h-2.5" />
             <span className="text-sm font-semibold text-primary">{profileCompletionPercentage}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Current Status" value={currentStageText.toUpperCase()} icon={<Users className="h-6 w-6" />} description="Your current stage in Merit" style={{ animationDelay: '0.2s' }} />
          <StatCard title="Weighted Score" value={userData.weightedTotalScore ?? "N/A"} icon={<Sparkles className="h-6 w-6" />} description={userData.talentTier ? `Tier: ${userData.talentTier.replace(/_/g, ' ')}` : "After Interview"} style={{ animationDelay: '0.3s' }} />
          <StatCard title="Next Interview" value={countdownDisplay} icon={<Repeat className="h-6 w-6" />} description="Eligibility for re-interview" style={{ animationDelay: '0.4s' }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {talentStatus === "new" && (
              <Card className={`${cardBaseClass} bg-gradient-to-br from-card to-background/80`} style={{ animationDelay: '0.5s' }}>
                <CardHeader className="text-center">
                  <FileEdit className="h-12 w-12 text-primary mx-auto mb-3 animate-bounce" />
                  <CardTitle className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Complete Your Talent Profile</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">Submit your CV and profile information to get discovered and prepare for AI interviews.</CardDescription>
                </CardHeader>
                <CardContent className="text-center p-6">
                  <Button size="lg" className={primaryButtonClass} asChild>
                    <Link href="/profile/create">Create Profile <Edit3 className="ml-2 h-5 w-5"/></Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {talentStatus === "profile_submitted" && (
              <Card className={`${cardBaseClass} bg-gradient-to-br from-card to-background/80`} style={{ animationDelay: '0.5s' }}>
                <CardHeader className="text-center">
                  <Bot className="h-12 w-12 text-primary mx-auto mb-3 animate-pulse" />
                  <CardTitle className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Profile Submitted & Analyzed!</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">Your profile and CV are ready. Next, let our AI generate tailored interview questions for you.</CardDescription>
                </CardHeader>
                <CardContent className="text-center p-6">
                  <Button size="lg" className={primaryButtonClass} onClick={() => handlePrepareInterview(false)} disabled={isPreparingInterview}>
                    {isPreparingInterview ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Sparkles className="mr-2 h-5 w-5"/>}
                    {isPreparingInterview ? "Preparing..." : "Prepare for AI Interview"}
                  </Button>
                  <Button size="lg" variant="outline" className={`${outlineButtonClass} ml-4`} asChild>
                    <Link href="/profile/create">Edit Profile <Edit3 className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {talentStatus === "interview_invited" && (
              <Card className={`${cardBaseClass} bg-gradient-to-br from-card to-background/80`} style={{ animationDelay: '0.5s' }}>
                <CardHeader className="text-center">
                   <div className="mx-auto mb-3">
                    <PlayCircle className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                  <CardTitle className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">You're Invited for an AI Interview!</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">Your personalized questions are ready. Showcase your skills and experience.</CardDescription>
                </CardHeader>
                <CardContent className="text-center p-6">
                  <Button size="lg" className={primaryButtonClass} asChild>
                    <Link href={`/interview/${user?.uid}`}>Start AI Interview <Sparkles className="ml-2 h-5 w-5"/></Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {talentStatus === "interview_completed_processing_summary" && (
               <Card className={`${cardBaseClass} bg-gradient-to-br from-card to-background/80`} style={{ animationDelay: '0.5s' }}>
                <CardHeader className="text-center">
                    <Loader2 className="h-12 w-12 text-primary mx-auto mb-3 animate-spin"/>
                  <CardTitle className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Processing Your Report</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Your interview is complete! We're generating your detailed feedback report. This may take a few moments. Check back soon.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center p-6">
                    <p className="text-muted-foreground flex items-center justify-center"><Loader2 className="mr-2 h-5 w-5 animate-spin"/>Generating your report, please check back soon.</p>
                </CardContent>
              </Card>
            )}
            
            {talentStatus === "report_ready" && (
               <Card className={`${cardBaseClass} bg-gradient-to-br from-card to-background/80`} style={{ animationDelay: '0.5s' }}>
                <CardHeader className="text-center">
                  {talentTier === "priority" && <ShieldCheck className="h-12 w-12 text-green-400 mx-auto mb-3" /> }
                  {talentTier === "verified" && <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" /> }
                  {talentTier === "manual_review" && <Users className="h-12 w-12 text-yellow-500 mx-auto mb-3" /> }
                  {talentTier === "re_interview_eligible" && <Repeat className="h-12 w-12 text-orange-500 mx-auto mb-3" /> }
                  {!talentTier && <FileText className="h-12 w-12 text-primary mx-auto mb-3" />}

                  <CardTitle className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Interview Report Ready!</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Your weighted score is: <span className="font-bold text-lg">{userData.weightedTotalScore ?? "N/A"}</span>. Your talent tier is: <span className="font-semibold capitalize">{talentTier?.replace(/_/g, ' ') ?? "Pending"}</span>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center p-6 space-y-4">
                  <Button size="lg" className={primaryButtonClass} asChild>
                      <Link href={`/report/${user?.uid}`}>View Full Report <FileText className="ml-2 h-5 w-5"/></Link>
                  </Button>
                  {talentTier === "re_interview_eligible" && isRetakeEligible && (
                     <Button size="lg" variant="outline" className={`${outlineButtonClass} ml-0 sm:ml-4 mt-2 sm:mt-0`} onClick={() => handlePrepareInterview(true)} disabled={isPreparingInterview}>
                        {isPreparingInterview ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Repeat className="mr-2 h-5 w-5"/>}
                        Retake Interview
                     </Button>
                  )}
                  {talentTier === "re_interview_eligible" && !isRetakeEligible && userData.nextInterviewEligibleDate && (
                     <p className="text-sm text-muted-foreground">You can retake the interview after {format(parseISO(userData.nextInterviewEligibleDate), "PPpp")} (Countdown: {countdownDisplay}).</p>
                  )}
                  {(talentTier === "priority" || talentTier === "verified" || talentTier === "manual_review") && (
                    <Button size="lg" variant="outline" className={`${outlineButtonClass} ml-0 sm:ml-4 mt-2 sm:mt-0`} asChild>
                        <Link href="/profile/complete">Complete Full Profile <UserCheck className="ml-2 h-5 w-5"/></Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

             {talentStatus === "profile_fully_completed" && (
              <Card className={`${cardBaseClass} bg-gradient-to-br from-card to-background/80`} style={{ animationDelay: '0.5s' }}>
                <CardHeader className="text-center">
                  <Briefcase className="h-12 w-12 text-primary mx-auto mb-3" />
                  <CardTitle className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Ready for Opportunities!</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">Your full profile is complete. Explore job openings and manage your applications.</CardDescription>
                </CardHeader>
                <CardContent className="text-center p-6">
                    <Button size="lg" className={primaryButtonClass} disabled>
                      Explore Jobs (Coming Soon) <ExternalLink className="ml-2 h-5 w-5"/>
                    </Button>
                 </CardContent>
              </Card>
            )}

            {!["new", "profile_submitted", "interview_invited", "interview_completed_processing_summary", "report_ready", "profile_fully_completed"].includes(talentStatus || "") && (
              <Card className={`${cardBaseClass} bg-gradient-to-br from-card to-background/80`} style={{ animationDelay: '0.5s' }}>
                 <CardHeader className="text-center">
                   <HelpCircle className="h-12 w-12 text-primary mx-auto mb-3" />
                   <CardTitle className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Your Dashboard</CardTitle>
                   <CardDescription className="text-muted-foreground mt-1">Status: {(talentStatus || "unknown").replace(/_/g, ' ')}. Check your journey progress.</CardDescription>
                 </CardHeader>
                 <CardContent className="text-center p-6">
                    <p className="text-muted-foreground mb-4">Further actions will appear here based on your progress.</p>
                    <Button size="lg" variant="outline" className={outlineButtonClass} asChild>
                      <Link href="/profile/create">View/Edit Initial Profile <Edit3 className="ml-2 h-5 w-5" /></Link>
                    </Button>
                 </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg bg-card border border-primary/10 rounded-xl animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <CardHeader>
                <CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Your Journey</CardTitle>
                <CardDescription>Follow your progress on Merit.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {journeySteps.map((step, index) => (
                    <JourneyItem key={index} step={step} isLast={index === journeySteps.length - 1} />
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-card border border-primary/10 rounded-xl animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              <CardHeader>
                <CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Profile Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4 border-4 border-primary/50 shadow-md">
                  <AvatarImage src={user?.photoURL || ""} alt={userData.fullName || "User"} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {(userData.fullName || user?.email || "U").substring(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold">{userData.fullName}</h3>
                <p className="text-sm text-muted-foreground">{userData.headline || "Aspiring Professional"}</p>
                 <Button variant="link" asChild className="mt-3 text-primary">
                    <Link href="/profile/create">View/Edit Initial Profile</Link>
                 </Button>
                 {(talentTier === "priority" || talentTier === "verified" || talentTier === "manual_review") && talentStatus === "report_ready" && (
                     <Button variant="link" asChild className="mt-1 text-accent">
                        <Link href="/profile/complete">Complete Full Profile</Link>
                     </Button>
                 )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (userData.role === "recruiter") {
    return (
      <div className="py-4 space-y-6">
        <div className="mb-8 p-6 bg-card border border-border/20 rounded-xl shadow-lg">
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <Link href="/" className="hover:text-primary"><Home className="h-4 w-4" /></Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-primary font-medium">Talent Search</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Explore Top Tech Talent
          </h1>
          <p className="text-muted-foreground mb-6 max-w-2xl">
            Discover and filter our curated list of pre-vetted software engineers, data scientists, and other tech professionals.
            Use the global search in the navbar to search by keywords, location, experience, and rate.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
             <Select
              value={dashboardSkillFilter}
              onValueChange={(value) => handleSkillChange(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-auto min-w-[150px] text-sm text-muted-foreground hover:border-primary hover:text-primary h-9">
                <SelectValue placeholder="All Skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {itSkillCategories.map((skill) => (
                  <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={dashboardAvailabilityFilter}
              onValueChange={(value) => handleAvailabilityChange(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-auto min-w-[180px] text-sm text-muted-foreground hover:border-primary hover:text-primary h-9">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Availabilities</SelectItem>
                {availabilityOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="text-sm flex items-center gap-1.5 text-muted-foreground hover:border-primary hover:text-primary h-9">
              <SlidersHorizontal className="h-4 w-4 mr-1" /> More Filters <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TalentListing
          externalSearchTerm={navSearchTerm}
          locationFilter={navLocationFilter}
          minExperienceFilter={navMinExpFilter}
          maxRateFilter={navMaxRateFilter}
          availabilityFilter={dashboardAvailabilityFilter} 
        />
      </div>
    );
  }

  // Fallback for undefined role
  return (
     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
      <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
      <h2 className="text-3xl font-semibold mb-3 text-foreground">Role Undefined</h2>
      <p className="text-lg text-muted-foreground mb-8 max-w-xl">
        Your user role is not set correctly. This might be due to an issue during signup or data retrieval. Please try logging out and signing up again, ensuring you select a role. If the problem persists, contact support.
      </p>
      <Button asChild>
        <Link href="/">Go to Homepage</Link>
      </Button>
    </div>
  );
}


// Wrap the page content with Suspense to use useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-4 text-lg text-muted-foreground">Loading Dashboard...</p></div>}>
      <DashboardPageContent />
    </Suspense>
  );
}

    