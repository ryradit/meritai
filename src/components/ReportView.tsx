
"use client";

import { useEffect, useState } from "react";
import {
    Star, CalendarDays, Loader2, AlertTriangle, CheckCircle, XCircle,
    MessageSquare, Briefcase, Lightbulb, Users, BarChart3
} from "lucide-react";
import type { InterviewSummaryGeneratorOutput } from "@/ai/flows/interview-summary-generator";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { UserProfileData, TalentTier } from "@/services/userService";
import { Progress } from "@/components/ui/progress"; // For category score visualization

// Define thresholds for score display
const PRIORITY_THRESHOLD = 90;
const VERIFIED_THRESHOLD = 85;
const MANUAL_REVIEW_THRESHOLD = 80;


interface ReportViewProps {
  reportId: string;
}

// Category details including minimum scores
const categoryDetails = {
  "Communication & English Proficiency": { icon: MessageSquare, minScore: 75, weight: 0.30 },
  "Technical Knowledge & Role Fit": { icon: Briefcase, minScore: 75, weight: 0.40 },
  "Problem Solving & Thinking": { icon: Lightbulb, minScore: 65, weight: 0.20 },
  "Culture & Work Ethic Alignment": { icon: Users, minScore: 60, weight: 0.10 },
};
type CategoryName = keyof typeof categoryDetails;


const getCategoryStyling = (score: number, minScore: number) => {
  if (score >= minScore && score >= 80) return { barColor: "bg-green-500", textColor: "text-green-600", iconColor: "text-green-500" };
  if (score >= minScore && score >=70) return { barColor: "bg-yellow-500", textColor: "text-yellow-600", iconColor: "text-yellow-500" };
  if (score >= minScore) return { barColor: "bg-blue-500", textColor: "text-blue-600", iconColor: "text-blue-500" };
  return { barColor: "bg-red-500", textColor: "text-red-600", iconColor: "text-red-500" }; // Below minimum
};


export default function ReportView({ reportId }: ReportViewProps) {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<InterviewSummaryGeneratorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnReport, setIsOwnReport] = useState(false);
  const [candidateProfileData, setCandidateProfileData] = useState<Partial<UserProfileData> | null>(null);
  const [calculatedWeightedScore, setCalculatedWeightedScore] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setIsLoading(true);

    const isViewingOwn = user.uid === reportId;
    setIsOwnReport(isViewingOwn);

    let targetProfile: Partial<UserProfileData> | null = null;
    let reportSummaryJson: string | undefined = undefined;
    let weightedScoreFromDb: number | undefined = undefined;
    let talentStatusFromDb: UserProfileData['talentStatus'] | undefined = undefined;

    if (isViewingOwn) {
        targetProfile = userData;
        reportSummaryJson = userData?.interviewReportSummary;
        weightedScoreFromDb = userData?.weightedTotalScore;
        talentStatusFromDb = userData?.talentStatus;
    } else if (userData?.role === 'recruiter') {
        if (reportId === "sample-recruiter-report-xyz") {
            targetProfile = {
                fullName: "Jane Talent (Sample)",
                headline: "Cloud Solutions Architect",
                updatedAt: new Date().toISOString(),
                talentStatus: "report_ready",
            };
             const sampleReport: InterviewSummaryGeneratorOutput = {
                categoryScores: [
                    { name: "Communication & English Proficiency", score: 90, comment: "Candidate communicated ideas with exceptional clarity and fluency. Articulation was precise, and comprehension of nuanced questions was evident." },
                    { name: "Technical Knowledge & Role Fit", score: 82, comment: "Demonstrated strong understanding of cloud platforms (AWS, Azure) and microservices architecture. Aligned well with the senior architect role requirements discussed." },
                    { name: "Problem Solving & Thinking", score: 80, comment: "Approached the system design question logically, breaking it down into manageable components. Showed good analytical skills in evaluating trade-offs." },
                    { name: "Culture & Work Ethic Alignment", score: 88, comment: "Expressed a proactive, ownership-driven attitude. Responses suggested a good fit for a fast-paced, collaborative startup environment." }
                ],
                strengths: [
                    "Excellent communication and articulation.",
                    "Deep technical expertise in cloud architecture.",
                    "Strong problem-solving abilities and logical thinking.",
                    "Positive and proactive attitude, aligning well with startup culture."
                ],
                areasForImprovement: [
                    "Could explore more cutting-edge/emerging cloud technologies during discussions.",
                    "Provide more specific, quantifiable examples of past project impacts when possible.",
                ],
                finalAssessment: "Jane Talent is a highly promising candidate for the Cloud Solutions Architect role. She possesses strong technical acumen, outstanding communication skills, and a mindset well-suited for our team. Minor areas for development are typical for continuous growth. Highly recommended."
            };
            reportSummaryJson = JSON.stringify(sampleReport);
            let sampleWeightedScore = 0;
            sampleReport.categoryScores.forEach(cs => {
                const categoryMeta = categoryDetails[cs.name as CategoryName];
                if (categoryMeta) {
                    sampleWeightedScore += cs.score * categoryMeta.weight;
                }
            });
            weightedScoreFromDb = Math.round(sampleWeightedScore);
            talentStatusFromDb = "report_ready";

        } else {
          // In a real scenario, a recruiter would fetch the specific talent's data
          // For now, we'll assume it's not fully implemented if not the sample
          console.warn("Recruiter view for specific candidate report not fully implemented. Needs data fetch for reportId:", reportId);
          toast({variant: "default", title:"Placeholder Report", description: "Displaying limited info for candidate report. Full data fetch pending."});
          targetProfile = { fullName: `Candidate ${reportId.substring(0,8)}...`, headline: "Awaiting Full Profile...", talentStatus: "report_ready"};
          // Ideally fetch 'interviewReportSummary' and 'weightedTotalScore' for reportId from 'talents' collection
        }
    } else if (!isViewingOwn && userData?.role !== 'recruiter') {
      toast({ variant: "destructive", title: "Access Denied", description: "You can only view your own report." });
      router.push("/dashboard");
      return;
    }

    setCandidateProfileData(targetProfile);
    setCalculatedWeightedScore(weightedScoreFromDb ?? null);

    if (reportSummaryJson && (talentStatusFromDb === 'report_ready' || reportId === "sample-recruiter-report-xyz")) {
      try {
        const parsedReport = JSON.parse(reportSummaryJson) as InterviewSummaryGeneratorOutput;
        setReportData(parsedReport);
      } catch (e) {
        console.error("Failed to parse interview report summary:", e);
        toast({ variant: "destructive", title: "Report Error", description: "Could not load report data."})
        setReportData(null); // Ensure reportData is null if parsing fails
      }
    } else if (isViewingOwn && talentStatusFromDb !== 'report_ready') {
        toast({ variant: "default", title: "Report Not Ready", description: "Your interview report is not yet available or the interview is not complete." });
        setReportData(null);
    } else {
        setReportData(null); // Default to null if no conditions met
    }
    setIsLoading(false);
  }, [reportId, user, userData, authLoading, router, toast]);

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="py-10 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Report Not Available</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          The interview report could not be loaded. This might be because the interview isn't completed,
          the report is still being generated, or you don't have permission to view it.
        </p>
        {isOwnReport && candidateProfileData?.talentStatus !== 'report_ready' && <p className="text-muted-foreground mt-1">If you recently completed your interview, please check back shortly.</p>}
      </div>
    );
  }
  
  // Check if the reportData itself is an error object (e.g. {"error": "some message"})
  if (reportData && (reportData as any).error) {
    return (
      <div className="py-10 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error in Report Data</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          The interview report could not be displayed due to an error: {(reportData as any).error}
        </p>
      </div>
    );
  }


  const candidateName = candidateProfileData?.fullName || "Candidate";
  const jobTitle = candidateProfileData?.headline || "Role";
  let interviewDateStr = "N/A";

   if (candidateProfileData?.updatedAt) {
     try {
      interviewDateStr = new Date(candidateProfileData.updatedAt as string).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { /* use N/A */ }
  }

  const {
    categoryScores = [], // Default to empty array if undefined
    strengths = [],
    areasForImprovement = [],
    finalAssessment = "No final assessment available."
  } = reportData;
  
  const displayScore = calculatedWeightedScore ?? 0; 

  let overallScoreColorClass = "text-primary";
    if (displayScore >= PRIORITY_THRESHOLD) overallScoreColorClass = "text-green-500";
    else if (displayScore >= VERIFIED_THRESHOLD) overallScoreColorClass = "text-yellow-500";
    else if (displayScore >= MANUAL_REVIEW_THRESHOLD) overallScoreColorClass = "text-orange-500";
    else overallScoreColorClass = "text-red-500";

  return (
    <div className="space-y-8 py-4 text-foreground">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Feedback on the Interview - <span className="capitalize">{jobTitle}</span>
        </h1>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-x-6 gap-y-1 text-md text-muted-foreground mb-6">
          <div className="flex items-center">
            <Star className={`mr-1.5 h-5 w-5 ${overallScoreColorClass}`} />
            Overall Score: <span className={`font-semibold ml-1 ${overallScoreColorClass}`}>{displayScore}</span>/100
          </div>
          <div className="flex items-center">
            <CalendarDays className="mr-1.5 h-5 w-5" />
            {interviewDateStr}
          </div>
        </div>
      </div>

      <hr className="border-border/30"/>

      <p className="text-base md:text-lg leading-relaxed text-muted-foreground/90 px-2">
        {finalAssessment}
      </p>

      <div>
        <h2 className="text-2xl font-semibold mb-6 text-center sm:text-left">Breakdown of the Interview:</h2>
        <div className="space-y-6">
          {categoryScores.map((item, index) => {
            const categoryMeta = categoryDetails[item.name as CategoryName] || { icon: BarChart3, minScore: 0, weight: 0 };
            const CategoryIcon = categoryMeta.icon;
            const styling = getCategoryStyling(item.score, categoryMeta.minScore);
            const scoreBelowMin = item.score < categoryMeta.minScore;

            return (
              <div key={item.name} className="border-b border-border/30 pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-lg font-semibold flex items-center">
                    <CategoryIcon className={`mr-2.5 h-5 w-5 ${styling.iconColor}`} />
                    {index + 1}. {item.name}
                    </h3>
                    <span className={`font-bold text-lg ${styling.textColor}`}>{item.score}/100</span>
                </div>
                <Progress value={item.score} className="h-2 mb-1.5" indicatorColor={styling.barColor} />
                {scoreBelowMin && <p className="text-xs text-red-500 ml-8 mb-1">Score is below the recommended minimum of {categoryMeta.minScore} for this category.</p>}
                <p className="text-sm text-muted-foreground/90 ml-8 leading-relaxed">{item.comment}</p>
              </div>
            );
          })}
        </div>
      </div>

      <hr className="border-border/30"/>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
        <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
                <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
                Strengths
            </h3>
            <ul className="list-disc list-inside space-y-1.5 pl-3 text-sm text-muted-foreground/90">
                {strengths.map((strength, idx) => (
                    <li key={`strength-${idx}`}>{strength}</li>
                ))}
            </ul>
        </div>
        <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
                <XCircle className="mr-2 h-6 w-6 text-red-500" />
                Areas for Improvement
            </h3>
            <ul className="list-disc list-inside space-y-1.5 pl-3 text-sm text-muted-foreground/90">
                {areasForImprovement.map((area, idx) => (
                    <li key={`area-${idx}`}>{area}</li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
}
