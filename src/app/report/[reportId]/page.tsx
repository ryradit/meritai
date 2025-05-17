import ReportView from "@/components/ReportView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck2 } from "lucide-react";

export default function ReportPage({ params }: { params: { reportId: string } }) {
  // reportId is the userId for whom the report is being viewed

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <FileCheck2 className="mr-3 h-8 w-8 text-primary" />
            AI Interview Report
          </CardTitle>
          <CardDescription>
            This is a detailed summary of the AI-powered interview. 
            {params.reportId !== "sample-recruiter-report-xyz" && `Report for User ID: ${params.reportId}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportView reportId={params.reportId} />
        </CardContent>
      </Card>
    </div>
  );
}
