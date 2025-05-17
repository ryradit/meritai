
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mic, MicOff, AlertTriangle as AlertTriangleIcon, PhoneOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";

import { interviewSummaryGenerator, type InterviewSummaryGeneratorInput, type InterviewSummaryGeneratorOutput } from "@/ai/flows/interview-summary-generator";
import { useAuth } from "@/hooks/useAuth";
import { updateUserDocument, type TalentTier, type TalentStatus, type UserProfileData, type InterviewQuestions as InterviewQuestionsType, UserRole } from "@/services/userService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "./ui/scroll-area";

type VapiCallStatus = "idle" | "connecting" | "active" | "stopping" | "stopped" | "error";
type InterviewStage = "intro" | "interviewing" | "finalizing" | "error";

interface StageConfigItem {
  id: InterviewStage;
  title: string;
  icon: React.ElementType;
  description: string;
}

// Scoring constants
const COMMUNICATION_WEIGHT = 0.30;
const TECHNICAL_WEIGHT = 0.40;
const PROBLEM_SOLVING_WEIGHT = 0.20;
const CULTURE_FIT_WEIGHT = 0.10;

const PRIORITY_THRESHOLD = 90;
const VERIFIED_THRESHOLD = 85;
const MANUAL_REVIEW_THRESHOLD = 80;

const stageConfig: StageConfigItem[] = [
  { id: "intro", title: "Interview Introduction", icon: Mic, description: "Welcome! Prepare for your AI voice-powered interview." },
  { id: "interviewing", title: "AI Interview in Progress", icon: Mic, description: "The AI is conducting the interview. Speak clearly." },
  { id: "finalizing", title: "Finalizing Interview", icon: Loader2, description: "Processing your interview. You will be redirected shortly." },
  { id: "error", title: "Interview Error", icon: AlertTriangleIcon, description: "An error occurred during the interview process." },
];

interface InterviewFlowProps {
  sessionId: string; // This is the talent's UID
}

interface UserSnapshot {
    uid: string;
    displayName: string | null;
    email: string | null;
    role: UserRole | undefined;
}
interface UserDataSnapshot {
    fullName?: string;
    headline?: string;
    interviewQuestions?: InterviewQuestionsType;
}
interface BackgroundProcessingDataType {
    transcript: string;
    userForProcessing: UserSnapshot | null;
    userDataForProcessing: UserDataSnapshot | null;
}

const getErrorMessage = (error: any, defaultMessage: string): string => {
  if (!error) return defaultMessage;
  if (typeof error === 'string' && error.trim() !== '') return error;
  if (typeof error === 'object') {
    if (error.message && typeof error.message === 'string' && error.message.trim() !== '') return error.message;
    if (error.errorMsg && typeof error.errorMsg === 'string' && error.errorMsg.trim() !== '') return error.errorMsg;
    if (error.error && typeof error.error === 'object') {
      if (error.error.message && typeof error.error.message === 'string' && error.error.message.trim() !== '') return error.error.message;
      if (error.error.message && Array.isArray(error.error.message) && error.error.message.length > 0) return error.error.message.join(', ');
      if (error.error.msg && typeof error.error.msg === 'string' && error.error.msg.trim() !== '') return error.error.msg;
      if (error.error.error && typeof error.error.error === 'string' && error.error.error.trim() !== '') return error.error.error;
    }
    try {
      const errStr = JSON.stringify(error);
      if (errStr !== '{}' && errStr.length > 2 && errStr.length < 300) return errStr;
    } catch (e) { /* Ignore stringify error */ }
  }
  return defaultMessage;
};


export default function InterviewFlow({ sessionId }: InterviewFlowProps) {
  const [currentStageId, setCurrentStageId] = useState<InterviewStage>("intro");
  const { toast } = useToast();
  const router = useRouter();
  const { user, userData, loading: authLoading, refreshUserData } = useAuth();

  const vapi = useRef<Vapi | null>(null);
  const [vapiCallStatus, setVapiCallStatus] = useState<VapiCallStatus>("idle");
  const [fullTranscript, setFullTranscript] = useState<string>("");
  const [transcriptLog, setTranscriptLog] = useState<string[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<string>("");

  const vapiApiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;

  const backgroundProcessingData = useRef<BackgroundProcessingDataType | null>(null);

  const handleInterviewFinalizationAndSummary = async () => {
    console.log("[InterviewFlow] Background Summary: Initiating.");
    
    if (!backgroundProcessingData.current || !backgroundProcessingData.current.userForProcessing?.uid || !backgroundProcessingData.current.userDataForProcessing) {
        console.error("[InterviewFlow] Background Summary: Essential user or userData snapshot missing from backgroundProcessingData. Aborting. Data:", backgroundProcessingData.current);
        const userUidToUpdate = backgroundProcessingData.current?.userForProcessing?.uid;
        if (userUidToUpdate && backgroundProcessingData.current?.userForProcessing?.role === 'talent') {
             try {
                await updateUserDocument(userUidToUpdate, 'talent', { talentStatus: "report_ready", interviewReportSummary: `{"error": "Failed to generate summary due to missing user context at processing time."}`, weightedTotalScore: 0, talentTier: "re_interview_eligible" });
            } catch (updateError) {
                console.error("[InterviewFlow] Background Summary: Failed to update user status to error after context issue:", updateError);
            }
        }
        return;
    }
    
    const { transcript, userForProcessing, userDataForProcessing } = backgroundProcessingData.current;
    const userUid = userForProcessing.uid;

    if (userForProcessing.role !== 'talent') {
        console.error("[InterviewFlow] Background Summary: User role is not talent. Aborting. User:", userForProcessing);
        return;
    }

    if (!transcript.trim()) {
        console.warn(`[InterviewFlow] Background Summary: Empty transcript for user ${userUid}. Aborting summary.`);
        try {
            await updateUserDocument(userUid, 'talent', { talentStatus: "report_ready", interviewReportSummary: `{"error": "Failed to generate summary due to empty interview transcript."}`, weightedTotalScore: 0, talentTier: "re_interview_eligible" });
        } catch (updateError) {
            console.error("[InterviewFlow] Background Summary: Failed to update user status for empty transcript:", updateError);
        }
        return;
    }

    console.log(`[InterviewFlow] Background Summary: Starting for User: ${userUid}. Transcript length: ${transcript.length}`);
    
    try {
      let questionContext = "The interview was intended to cover the following areas and questions:\n";
      if (userDataForProcessing.interviewQuestions) {
        questionContext += "Behavioural:\n" + (userDataForProcessing.interviewQuestions.behaviouralQuestions || []).map((q,i) => `${i+1}. ${q}`).join("\n") + "\n\n";
        questionContext += "Situational:\n" + (userDataForProcessing.interviewQuestions.situationalQuestions || []).map((q,i) => `${i+1}. ${q}`).join("\n") + "\n\n";
        questionContext += "Technical:\n" + (userDataForProcessing.interviewQuestions.technicalQuestions || []).map((q,i) => `${i+1}. ${q}`).join("\n") + "\n";
      } else {
        questionContext += "General interview questions based on profile were asked.\n";
      }
      const transcriptForSummary = `${questionContext}\nInterview Transcript:\n${transcript}`;

      const summaryInput: InterviewSummaryGeneratorInput = {
        candidateName: userDataForProcessing.fullName || userForProcessing.displayName || "Candidate",
        jobTitle: userDataForProcessing.headline || "Role",
        interviewerName: "AI Interview Conductor (VAPI)",
        interviewDate: new Date().toISOString().split('T')[0],
        interviewTranscript: transcriptForSummary,
      };

      const summaryInputForLogging = { ...summaryInput, interviewTranscript: summaryInput.interviewTranscript.substring(0, 200) + (summaryInput.interviewTranscript.length > 200 ? "..." : "") };
      console.log("[InterviewFlow] Background Summary: Calling interviewSummaryGenerator with input (transcript truncated):", JSON.stringify(summaryInputForLogging, null, 2));
      
      let summaryResult: InterviewSummaryGeneratorOutput | null = null;
      try {
        summaryResult = await interviewSummaryGenerator(summaryInput);
      } catch (aiError: any) {
        console.error("[InterviewFlow] Background Summary: interviewSummaryGenerator threw an error for user", userUid, ":", aiError);
        const errorMsg = getErrorMessage(aiError, "AI failed to generate a valid summary report.");
        await updateUserDocument(userUid, 'talent', { talentStatus: "report_ready", interviewReportSummary: `{"error": "AI summary generation failed: ${errorMsg}"}`, weightedTotalScore: 0, talentTier: "re_interview_eligible" });
        return; 
      }
      
      console.log('[InterviewFlow] Background Summary: Raw AI output from interviewSummaryGenerator for user', userUid, ':', JSON.stringify(summaryResult, null, 2));

      if (!summaryResult || !summaryResult.categoryScores || summaryResult.categoryScores.length !== 4) {
        console.error("[InterviewFlow] Background Summary: AI output was null or did not match schema after call for user", userUid, ". Received:", JSON.stringify(summaryResult, null, 2));
        await updateUserDocument(userUid, 'talent', { talentStatus: "report_ready", interviewReportSummary: `{"error": "AI failed to generate a valid summary report or it did not match the expected schema (4 categories)."}`, weightedTotalScore: 0, talentTier: "re_interview_eligible" });
        return; 
      }
      console.log("[InterviewFlow] Background Summary: Received valid summaryResult for user:", userUid);
      
      const scoresByName: { [key: string]: number } = {};
      (summaryResult.categoryScores || []).forEach(cs => {
          const score = Number(cs.score);
          scoresByName[cs.name] = isNaN(score) ? 0 : score; 
      });

      const getScore = (name: string): number => {
        const score = scoresByName[name];
        return (typeof score === 'number' && !isNaN(score)) ? score : 0;
      };

      const communicationScoreVal = getScore("Communication & English Proficiency");
      const technicalScoreVal = getScore("Technical Knowledge & Role Fit");
      const problemSolvingScoreVal = getScore("Problem Solving & Thinking");
      const cultureFitScoreVal = getScore("Culture & Work Ethic Alignment");

      console.log(`[InterviewFlow] Background Summary: Parsed category scores for user ${userUid} - Comm: ${communicationScoreVal}, Tech: ${technicalScoreVal}, Prob: ${problemSolvingScoreVal}, Cult: ${cultureFitScoreVal}`);

      const calculatedScore = (communicationScoreVal * COMMUNICATION_WEIGHT) +
                              (technicalScoreVal * TECHNICAL_WEIGHT) +
                              (problemSolvingScoreVal * PROBLEM_SOLVING_WEIGHT) +
                              (cultureFitScoreVal * CULTURE_FIT_WEIGHT);
      
      let finalWeightedScore: number;
      if (isNaN(calculatedScore)) {
        console.warn(`[InterviewFlow] Background Summary: calculatedScore was NaN for user ${userUid}. Defaulting finalWeightedScore to 0. Raw AI scores:`, JSON.stringify(summaryResult.categoryScores, null, 2));
        finalWeightedScore = 0;
      } else {
        finalWeightedScore = Math.round(calculatedScore);
        if (isNaN(finalWeightedScore)) { 
          console.warn(`[InterviewFlow] Background Summary: finalWeightedScore became NaN after rounding for user ${userUid}. Defaulting to 0. Calculated score was: ${calculatedScore}`);
          finalWeightedScore = 0;
        }
      }
      console.log(`[InterviewFlow] Background Summary: User ${userUid} - Final Weighted Score: ${finalWeightedScore}`);

      let talentTier: TalentTier;
      let nextInterviewEligibleDate: string | null = null;

      if (finalWeightedScore >= PRIORITY_THRESHOLD) talentTier = "priority";
      else if (finalWeightedScore >= VERIFIED_THRESHOLD) talentTier = "verified";
      else if (finalWeightedScore >= MANUAL_REVIEW_THRESHOLD) talentTier = "manual_review";
      else {
        talentTier = "re_interview_eligible";
        const oneHourFromNow = new Date();
        oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
        nextInterviewEligibleDate = oneHourFromNow.toISOString();
      }
      console.log(`[InterviewFlow] Background Summary: User ${userUid} - Tier: ${talentTier}, NextEligible: ${nextInterviewEligibleDate}`);

      const updatePayload: Partial<UserProfileData> = {
          interviewReportSummary: JSON.stringify(summaryResult),
          weightedTotalScore: finalWeightedScore,
          talentTier: talentTier,
          talentStatus: "report_ready" as TalentStatus
      };
      if (nextInterviewEligibleDate) {
        updatePayload.nextInterviewEligibleDate = nextInterviewEligibleDate;
      } else {
        updatePayload.nextInterviewEligibleDate = null; 
      }
      console.log("[InterviewFlow] Background Summary: Final updatePayload for Firestore:", JSON.stringify(updatePayload));


      try {
        await updateUserDocument(userUid, 'talent', updatePayload);
        console.log("[InterviewFlow] Background Summary: Successfully updated Firestore for user", userUid);
      } catch (firestoreError: any) {
        console.error("[InterviewFlow] Background Summary: Failed to update Firestore for user", userUid, "after successful summary generation:", firestoreError);
      }

    } catch (error) { 
      console.error("[InterviewFlow] Background Summary: Uncaught error during processing for user", userUid, ":", error);
      const errorMsg = getErrorMessage(error, "Failed to finalize interview report in background due to an unexpected error.");
      try {
         await updateUserDocument(userUid, 'talent', { talentStatus: "report_ready", interviewReportSummary: `{"error": "${errorMsg}"}`, weightedTotalScore: 0, talentTier: "re_interview_eligible" });
      } catch (updateError) {
        console.error("[InterviewFlow] Background Summary: Failed to update user status to error state after an uncaught summary gen failure for user", userUid, ":", updateError);
      }
    }
  };

const onCallEnded = async () => {
    console.log(`[InterviewFlow] onCallEnded triggered. Current VAPI callStatus: ${vapi.current?.callStatus}. CurrentStageId: ${currentStageId}`);
    await new Promise(resolve => setTimeout(resolve, 300)); 

    if (currentStageId === "finalizing" || currentStageId === "error") {
        console.warn(`[InterviewFlow] onCallEnded: Already in terminal state '${currentStageId}'. Aborting.`);
        return;
    }
    
    const transcriptSnapshot = fullTranscript;
    console.log(`[InterviewFlow] onCallEnded: Transcript snapshot taken (length: ${transcriptSnapshot.length}): "${transcriptSnapshot.substring(0,100)}..."`);


    const userSnapshot: UserSnapshot | null = user ? { uid: user.uid, displayName: user.displayName, email: user.email, role: userData?.role } : null;
    const userDataSnapshot: UserDataSnapshot | null = userData ? { 
        fullName: userData.fullName, 
        headline: userData.headline,
        interviewQuestions: userData.interviewQuestions 
    } : null;

    if (!userSnapshot?.uid || userSnapshot.role !== 'talent') {
        console.error("[InterviewFlow] onCallEnded: User UID missing or role not talent. Cannot proceed. User:", JSON.stringify(userSnapshot));
        setCurrentStageId("error");
        toast({ variant: "destructive", title: "User Error", description: "Could not process interview due to user data issue." });
        if (router) router.push("/dashboard");
        return;
    }
    
    setVapiCallStatus("stopped");
    setCurrentStageId("finalizing"); 
    toast({ title: "Interview Call Ended", description: "Processing your interview and preparing your report..." });

    queueMicrotask(async () => {
        try {
            if (transcriptSnapshot.trim() === "") {
                console.warn("[InterviewFlow] CallEnded Microtask: Empty transcript. Updating status and redirecting. User:", userSnapshot.uid);
                await updateUserDocument(userSnapshot.uid, 'talent', { 
                    talentStatus: "report_ready", 
                    interviewReportSummary: `{"error": "Interview ended prematurely with no interaction recorded."}`,
                    weightedTotalScore: 0,
                    talentTier: "re_interview_eligible"
                });
                await refreshUserData();
                if (router) router.push("/dashboard");
                return;
            }
            
            console.log("[InterviewFlow] CallEnded Microtask: Updating Firestore status to 'interview_completed_processing_summary' for talent:", userSnapshot.uid);
            await updateUserDocument(userSnapshot.uid, 'talent', {
                talentStatus: "interview_completed_processing_summary"
            });
            await refreshUserData(); 

            backgroundProcessingData.current = {
                transcript: transcriptSnapshot,
                userForProcessing: userSnapshot,
                userDataForProcessing: userDataSnapshot,
            };
            console.log("[InterviewFlow] CallEnded Microtask: backgroundProcessingData snapshotted for user:", userSnapshot.uid);
            
            console.log("[InterviewFlow] CallEnded Microtask: Redirecting to dashboard for user:", userSnapshot.uid);
            if (router) router.push("/dashboard");

            setTimeout(() => {
                console.log('[InterviewFlow] Initiating handleInterviewFinalizationAndSummary from onCallEnded final timeout for user:', userSnapshot.uid);
                handleInterviewFinalizationAndSummary();
            }, 200);

        } catch (error) {
            console.error("[InterviewFlow] CallEnded Microtask: Error during Firestore update or redirect preparation for user:", userSnapshot?.uid, error);
            if (router) router.push("/dashboard"); 
            setTimeout(() => {
                console.warn('[InterviewFlow] Attempting summary generation despite error in onCallEnded microtask for user:', userSnapshot?.uid);
                handleInterviewFinalizationAndSummary(); 
            }, 200);
        }
    });
};


  useEffect(() => {
    if (!vapiApiKey) {
      toast({ variant: "destructive", title: "Configuration Error", description: "VAPI API Key is missing."});
      setCurrentStageId("error");
      return;
    }
    vapi.current = new Vapi(vapiApiKey);

    vapi.current.on("call-start", () => {
      console.log("[InterviewFlow] VAPI call-start event received.");
      setVapiCallStatus("active");
    });

    vapi.current.on("call-end", () => {
        console.log("[InterviewFlow] VAPI call-end event received.");
        onCallEnded();
    });

    vapi.current.on('speech-update', (data: any) => {
      if (data.status === 'speech_start' && data.speechType === 'user') {
        setLiveTranscript('');
      }
    });

    vapi.current.on("message", (message: any) => {
      console.log("[InterviewFlow] VAPI message received:", JSON.stringify(message).substring(0, 200) + "...");
      if (message.type === "transcript" && message.transcriptType === "partial" && message.role === "user") {
        setLiveTranscript(message.transcript);
      }
      if (message.type === "transcript" && message.transcriptType === "final") {
        console.log(`[InterviewFlow] VAPI final transcript - Role: ${message.role}, Transcript: "${message.transcript}"`);
        setLiveTranscript("");
        const formattedUtterance = `${message.role === "assistant" ? "AI" : "You"}: ${message.transcript}`;
        setFullTranscript((prev) => {
            const newTranscript = prev + formattedUtterance + "\n";
            console.log(`[InterviewFlow] Appending to fullTranscript. New length: ${newTranscript.length}. Content: "${newTranscript.substring(0, 100)}..."`);
            return newTranscript;
        });
        setTranscriptLog(prev => [...prev, formattedUtterance]);
      }
      if (message.type === "error") {
        const vapiMessageError = message.error;
        const errorMessage = getErrorMessage(vapiMessageError, "An unspecified VAPI message error occurred.");
        if (!errorMessage.toLowerCase().includes("meeting has ended")) {
            console.warn("[InterviewFlow] VAPI message event error details:", JSON.stringify(vapiMessageError));
            toast({ variant: "destructive", title: "VAPI Message Error", description: errorMessage });
        }
      }
    });

    vapi.current.on("error", (error: any) => {
      const extractedErrorMessage = getErrorMessage(error, "");
      
      if (extractedErrorMessage.toLowerCase().includes("meeting has ended") || (typeof error === 'object' && error?.errorMsg?.toLowerCase().includes("meeting has ended"))) {
        console.info("[InterviewFlow] VAPI call ended (reported via error event).");
        onCallEnded();
      } else {
        console.error("[InterviewFlow] VAPI general error event details:", JSON.stringify(error));
        const displayErrorMessage = extractedErrorMessage || "An unspecified VAPI connection error occurred.";
        setVapiCallStatus("error");
        toast({ variant: "destructive", title: "VAPI Connection Error", description: displayErrorMessage });
        setCurrentStageId("error");
      }
    });

    return () => {
      if (vapi.current && (vapi.current.callStatus === "connected" || vapi.current.callStatus === "connecting")) {
        console.log("[InterviewFlow] Cleanup: Stopping VAPI call.");
        vapi.current.stop();
      }
      vapi.current?.removeAllListeners();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vapiApiKey, toast]); 

useEffect(() => {
    if (authLoading || currentStageId === "finalizing" || currentStageId === "error") {
      return;
    }

    if (!user) {
        toast({ title: "Authentication Required", description: "Please log in to access the interview."});
        if(router) router.push("/auth/login");
        return;
    }
    
    if (userData) {
        if (userData.role !== 'talent') {
          toast({ variant: "destructive", title: "Access Denied", description: "Only talents can take interviews." });
          if(router) router.push("/dashboard");
          return;
        }
        if (user.uid !== sessionId) {
          toast({ variant: "destructive", title: "Access Denied", description: "You can only access your own interview session." });
          if(router) router.push("/dashboard");
          return;
        }

        const { talentStatus, interviewQuestions } = userData;
        
        if (talentStatus === 'report_ready' || talentStatus === 'interview_completed_processing_summary') {
            toast({ title: "Interview Processed", description: "This interview has already been processed or is currently processing. Check your dashboard."});
            if(router) router.push("/dashboard");
            return;
        }


        if (talentStatus === 'interview_invited') {
            if (!interviewQuestions) {
                toast({ variant: "destructive", title: "Interview Data Issue", description: "Questions are not available in your profile. Please return to the dashboard and try preparing again." });
                if(router) router.push("/dashboard");
                return;
            }
        } else if (talentStatus === 'profile_submitted') {
            toast({ variant: "default", title: "Interview Not Prepared", description: "Please prepare for your AI interview from the dashboard first." });
            if(router) router.push("/dashboard");
            return;
        } else if (talentStatus === 'new') {
            toast({ variant: "destructive", title: "Profile Incomplete", description: "Please complete your profile before starting an interview." });
            if(router) router.push("/profile/create");
            return;
        }
    } else if (!authLoading && currentStageId === "intro") { 
         toast({ variant: "destructive", title: "Profile Error", description: "Could not load your profile data. Please try returning to the dashboard." });
         if(router) router.push("/dashboard");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userData, authLoading, sessionId, router, toast]);


  const currentStageConfig = useMemo(() => stageConfig.find(s => s.id === currentStageId) || stageConfig[0], [currentStageId]);

  const startVapiCall = () => {
    if (!vapi.current || !vapiApiKey) {
        toast({ variant: "destructive", title: "VAPI Error", description: "VAPI is not initialized or API key is missing." });
        setCurrentStageId("error");
        return;
    }
    if (vapi.current && (vapi.current.callStatus === "connected" || vapi.current.callStatus === "connecting")) {
        console.warn("[InterviewFlow] startVapiCall: Call already active or connecting.");
        return;
    }

    setVapiCallStatus("connecting");
    setFullTranscript("");
    setTranscriptLog([]);
    setLiveTranscript("");
    setCurrentStageId("interviewing"); 

    toast({ title: "Starting Interview...", description: "Connecting to the AI Interviewer. Please wait." });

    let allQuestionsString = "";
    if (userData?.interviewQuestions) {
      const { behaviouralQuestions, situationalQuestions, technicalQuestions } = userData.interviewQuestions;
      if (behaviouralQuestions?.length) allQuestionsString += "Behavioural Questions:\n" + behaviouralQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") + "\n\n";
      if (situationalQuestions?.length) allQuestionsString += "Situational Questions:\n" + situationalQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") + "\n\n";
      if (technicalQuestions?.length) allQuestionsString += "Technical Questions:\n" + technicalQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
      allQuestionsString = allQuestionsString.trim();
    } else {
        allQuestionsString = "No specific questions pre-loaded. Please conduct a general interview based on the candidate's profile."
    }

    const candidateUserName = userData?.fullName || user?.displayName || "Candidate";
    const candidateJobPosition = userData?.headline || "Applicant";

    const systemPromptContent = `You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.
Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
"Hey ${candidateUserName}! Welcome to your ${candidateJobPosition} interview. Let's get started with a few questions!"
Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below Are the questions ask one by one:
Questions for ${candidateUserName}:
${allQuestionsString}
If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about how React tracks component updates!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversation natural and engaging-use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"
After all questions from the list have been asked or a reasonable number (e.g. 5-7 if the list is very long), wrap up the interview smoothly. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note:
"Thanks for chatting, ${candidateUserName}! Hope to see you crushing projects soon!"
Key Guidelines:
- Be friendly, engaging, and witty
- Keep responses short and natural, like a real conversation
- Adapt based on the candidate's confidence level
- Ensure the interview remains focused on the candidate's stated role or primary skills mentioned in ${candidateJobPosition} or suggested by ${allQuestionsString}
- Make sure to ask all provided questions from the ${allQuestionsString} if possible, or at least a good selection from each category if the list is extensive to determine ${candidateUserName}'s fit for the role of ${candidateJobPosition}.
- Do not add any commentary or text after saying your final goodbye like "Thanks for chatting...". End the call immediately after your final sentence.`.trim();

    const vapiCallConfiguration = {
        name: "AI Interviewer",
        firstMessage: `Hi ${candidateUserName}, how are you? Ready for your interview for the ${candidateJobPosition} role?`,
        transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en-US",
        },
        voice: {
            provider: "playht",
            voiceId: "jennifer",
        },
        model: {
            provider: "openai",
            model: "gpt-3.5-turbo",
            messages: [ { role: "system", content: systemPromptContent, } ],
        },
        maxDurationSeconds: 20 * 60
    };

    console.log("[InterviewFlow] Starting VAPI call with configuration (system prompt truncated for log):",
        JSON.stringify({...vapiCallConfiguration, model: {...vapiCallConfiguration.model, messages: [{role: "system", content: systemPromptContent.substring(0,200) + "..."}] }}, null, 2));

    if (vapi.current) {
        try {
            vapi.current.start(vapiCallConfiguration);
        } catch (e: any) {
            console.error("[InterviewFlow] Error calling vapi.start with payload:", e);
            const errorMsg = getErrorMessage(e, "Failed to start VAPI call.")
            toast({ variant: "destructive", title: "VAPI Start Error", description: errorMsg});
            setVapiCallStatus("error");
            setCurrentStageId("error");
        }
    }
  };

  const stopVapiCall = () => {
    if (vapi.current && (vapi.current.callStatus === "connected" || vapi.current.callStatus === "connecting")) {
      console.log("[InterviewFlow] stopVapiCall: Attempting to stop VAPI call.");
      setVapiCallStatus("stopping"); 
      vapi.current.stop(); 
    } else {
      console.warn("[InterviewFlow] stopVapiCall: Call not active or connecting. Current status:", vapi.current?.callStatus);
    }
  };

  const progressPercentage = useMemo(() => {
    const currentIndex = stageConfig.findIndex(s => s.id === currentStageId);
    const totalStagesForProgress = stageConfig.filter(s => s.id !== "error").length;
    if (currentStageId === "finalizing") return 100;
    if (currentStageId === "interviewing") return 66; 
    return ((currentIndex + 1) / totalStagesForProgress) * 100;
  }, [currentStageId]);

  if (authLoading || (currentStageId !== "finalizing" && currentStageId !== "error" && !user && !userData)) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading interview data...</p>
      </div>
    );
  }
  if (!userData && !authLoading && currentStageId === "intro" && currentStageId !== "finalizing" && currentStageId !== "error") {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <AlertTriangleIcon className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3 text-foreground">Error Loading Your Profile Data</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl">
          We couldn't load your profile information needed for the interview. This might be due to a network issue or incomplete profile setup.
        </p>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-primary">{currentStageConfig.title}</span>
            <span className="text-sm text-muted-foreground">
              {currentStageId !== "finalizing" && currentStageId !== "error" && `Stage ${stageConfig.findIndex(s=>s.id === currentStageId) + 1} of ${stageConfig.filter(s => s.id !== 'error' && s.id !== 'finalizing').length }`}
            </span>
        </div>
        <Progress value={progressPercentage} className="w-full h-2" />
      </div>

      <Card className="min-h-[450px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <currentStageConfig.icon className={`mr-2 h-6 w-6 text-primary ${currentStageId === 'finalizing' || (currentStageId === 'interviewing' && vapiCallStatus === 'connecting') ? 'animate-spin' : (currentStageId === 'interviewing' && vapiCallStatus === 'active' ? 'animate-pulse' : '') }`} />
            {currentStageConfig.title}
          </CardTitle>
          <CardDescription>{currentStageConfig.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-center">

          {currentStageId === "intro" && (
             <div className="space-y-4 text-center flex-grow flex flex-col justify-center items-center">
                <Mic size={64} className="text-primary opacity-70"/>
                <p className="text-lg">This is an AI voice-conducted interview. Please allow microphone access and speak clearly.</p>
                <p className="text-sm text-muted-foreground">The interview is designed to take approximately 10-15 minutes. Ensure you are in a quiet environment.</p>
                 <Alert>
                    <Mic className="h-4 w-4" />
                    <AlertTitle>Voice Interview Call</AlertTitle>
                    <AlertDescription>
                        This interview will be conducted via a voice call with VAPI AI. Click "Start Voice Interview" when ready.
                    </AlertDescription>
                </Alert>
            </div>
          )}

          {currentStageId === "interviewing" && (
            <div className="space-y-4 flex-grow flex flex-col text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                {vapiCallStatus === "connecting" && <><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="text-muted-foreground">Connecting to AI Interviewer...</span></>}
                {vapiCallStatus === "active" && <><Mic className="h-6 w-6 text-green-500 animate-pulse" /> <span className="text-green-500 font-semibold">Interview Call Active</span></>}
                {vapiCallStatus === "stopping" && <><Loader2 className="h-6 w-6 animate-spin text-orange-500" /> <span className="text-orange-500">Ending Interview Call...</span></>}
                {(vapiCallStatus === "stopped" && fullTranscript.trim() !== "") && <><MicOff className="h-6 w-6 text-muted-foreground" /> <span className="text-muted-foreground">Interview Call Ended. Processing...</span></>}
              </div>
              <ScrollArea className="h-64 w-full rounded-md border p-4 text-left bg-muted/20">
                {transcriptLog.map((logEntry, index) => (
                  <p key={index} className={`mb-2 text-sm ${logEntry.startsWith("AI:") ? "text-primary" : "text-foreground"}`}>{logEntry}</p>
                ))}
                {liveTranscript && <p className="text-sm text-blue-400 italic">You (speaking): {liveTranscript}</p>}
                {transcriptLog.length === 0 && vapiCallStatus === "active" && <p className="text-sm text-muted-foreground">Waiting for AI to speak...</p>}
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-2">Your responses are being recorded for analysis.</p>
              {userData?.interviewQuestions && (
                <details className="text-left mt-4 p-3 bg-muted/30 rounded-md text-xs">
                  <summary className="cursor-pointer text-primary font-medium">View Potential Question Areas (for AI reference)</summary>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    {(userData.interviewQuestions.behaviouralQuestions || []).map((q,i) => <li key={`b-${i}`}>{q}</li>)}
                    {(userData.interviewQuestions.situationalQuestions || []).map((q,i) => <li key={`s-${i}`}>{q}</li>)}
                    {(userData.interviewQuestions.technicalQuestions || []).map((q,i) => <li key={`t-${i}`}>{q}</li>)}
                  </ul>
                </details>
              )}
            </div>
          )}

          {currentStageId === "finalizing" && (
            <div className="text-center py-10 flex-grow flex flex-col justify-center items-center">
                <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
                <h2 className="text-2xl font-semibold">Finalizing Your Interview</h2>
                <p className="text-muted-foreground mt-2">Please wait, redirecting to your dashboard. Your report will be generated shortly.</p>
            </div>
          )}

          {currentStageId === "error" && (
             <div className="text-center py-10 flex-grow flex flex-col justify-center items-center">
              <AlertTriangleIcon className="mx-auto h-16 w-16 text-destructive mb-4" />
              <h2 className="text-2xl font-semibold">Interview Error</h2>
              <p className="text-muted-foreground mt-2">We encountered an issue. Please try again later or contact support.</p>
              <Button onClick={() => router.push('/dashboard')} className="mt-6" variant="outline">Back to Dashboard</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end mt-8">
        {currentStageId === "intro" && (
          <Button
              onClick={startVapiCall}
              disabled={
                vapiCallStatus === "connecting" ||
                vapiCallStatus === "active" ||
                !vapiApiKey ||
                authLoading ||
                !userData 
              }
          >
            {(vapiCallStatus === "connecting") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
            Start Voice Interview
          </Button>
        )}
         {currentStageId === "interviewing" && (vapiCallStatus === "active" || vapiCallStatus === "connecting") && (
          <Button
              variant="destructive"
              onClick={stopVapiCall}
              disabled={vapiCallStatus === "stopping" || vapiCallStatus === "stopped" || currentStageId === "finalizing"}
          >
            {vapiCallStatus === "stopping" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PhoneOff className="mr-2 h-4 w-4" />}
            End Interview Call
          </Button>
        )}
         {currentStageId === "finalizing" && (
             <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing & Redirecting...
            </Button>
        )}
         {currentStageId === "error" && (
             <Button onClick={() => {
                setCurrentStageId("intro");
                setVapiCallStatus("idle");
                setFullTranscript("");
                setTranscriptLog([]);
                setLiveTranscript("");
             }} variant="outline">
                Try Again
            </Button>
        )}
      </div>
    </div>
  );
}

