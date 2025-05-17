import InterviewFlow from "@/components/InterviewFlow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

export default function InterviewPage({ params }: { params: { sessionId: string } }) {
  // sessionId is the userId for whom the interview is being conducted

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <Bot className="mr-3 h-8 w-8 text-primary animate-pulse" />
            AI-Powered Interview
          </CardTitle>
          <CardDescription>
            Welcome to your personalized AI interview. Please answer the questions thoughtfully.
            This process will help us understand your skills and experience better.
            Session ID: {params.sessionId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InterviewFlow sessionId={params.sessionId} />
        </CardContent>
      </Card>
    </div>
  );
}
