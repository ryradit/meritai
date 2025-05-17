
'use server';

/**
 * @fileOverview Summarizes an interview conversation to produce structured JSON feedback,
 * including individual category scores, overall weighted score, strengths,
 * areas for improvement, and a final assessment based on defined criteria.
 *
 * - interviewSummaryGenerator - A function that summarizes the interview and generates JSON feedback.
 * - InterviewSummaryGeneratorInput - The input type for the interviewSummaryGenerator function.
 * - InterviewSummaryGeneratorOutput - The return type for the interviewSummaryGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterviewSummaryGeneratorInputSchema = z.object({
  candidateName: z.string().describe('The name of the candidate interviewed.'),
  jobTitle: z.string().describe('The job title for which the candidate is interviewed.'),
  interviewerName: z.string().describe('The name of the interviewer (e.g., "AI Conductor").'),
  interviewDate: z.string().describe('The date of the interview.'),
  interviewTranscript: z.string().describe('The full transcript of the interview conversation between the AI assistant and the user/candidate, including initial question context.'),
});

export type InterviewSummaryGeneratorInput = z.infer<typeof InterviewSummaryGeneratorInputSchema>;

const CategoryScoreSchema = z.object({
  name: z.enum([
    "Communication & English Proficiency",
    "Technical Knowledge & Role Fit",
    "Problem Solving & Thinking",
    "Culture & Work Ethic Alignment"
  ]).describe("Name of the category assessed."),
  score: z.number().min(0).max(100).describe("Independent score for this category (0-100), before any weighting is applied by the application."),
  comment: z.string().describe("Detailed qualitative comment for this category (2-3 sentences).")
});

const InterviewSummaryGeneratorOutputSchema = z.object({
  // totalScore will be calculated by the application based on weights. AI provides raw category scores.
  categoryScores: z.array(CategoryScoreSchema)
    .length(4)
    .describe("Array of scores and comments for four predefined categories: Communication & English Proficiency, Technical Knowledge & Role Fit, Problem Solving & Thinking, Culture & Work Ethic Alignment. Each category score should be an independent assessment from 0-100."),
  strengths: z.array(z.string()).min(2).max(4).describe("List of 2-4 identified candidate strengths."),
  areasForImprovement: z.array(z.string()).min(2).max(4).describe("List of 2-4 areas where the candidate can improve, with constructive suggestions if possible."),
  finalAssessment: z.string().describe("A comprehensive final assessment or summary of the candidate's performance (3-5 sentences).")
});

export type InterviewSummaryGeneratorOutput = z.infer<typeof InterviewSummaryGeneratorOutputSchema>;

export async function interviewSummaryGenerator(
  input: InterviewSummaryGeneratorInput
): Promise<InterviewSummaryGeneratorOutput> {
  return interviewSummaryGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interviewSummaryGeneratorPrompt',
  input: {schema: InterviewSummaryGeneratorInputSchema},
  output: {schema: InterviewSummaryGeneratorOutputSchema},
  prompt: `You are an expert AI Interview Assessor generating a report for recruiters.
Based on the following interview conversation between an AI assistant and a user (candidate), provide a structured feedback report.
Candidate Name: {{{candidateName}}}
Job Title: {{{jobTitle}}}
Interviewer Name: {{{interviewerName}}}
Interview Date: {{{interviewDate}}}

Interview Conversation (including initial question context and full transcript):
{{{interviewTranscript}}}

Instructions for Report Generation:
1.  Analyze the entire conversation thoroughly.
2.  Evaluate the candidate in the following FOUR categories. For each category, provide an INDEPENDENT score from 0 to 100 and a detailed qualitative comment (2-3 sentences). The application will calculate a final weighted score later; your task is to provide these raw, unweighted scores.
    *   **Communication & English Proficiency**: Measures clarity, fluency, comprehension, and articulation during the voice-based interview. Assess how well they understood questions and conveyed their thoughts. Minimum expected score for talent: 75.
    *   **Technical Knowledge & Role Fit**: Measures relevance and depth of technical knowledge discussed, especially concerning the role of '{{{jobTitle}}}'. Consider how their answers align with the skills implied by their CV and the job. Minimum expected score for talent: 75.
    *   **Problem Solving & Thinking**: Measures analytical thinking, logical reasoning, and structured approach to challenges or hypothetical scenarios presented during the interview. Minimum expected score for talent: 65.
    *   **Culture & Work Ethic Alignment**: Measures attitude, potential startup mindset, ownership mentality, and general cultural fit based on responses and engagement during the AI interview. Minimum expected score for talent: 60.
3.  List exactly 2-4 key strengths demonstrated by the candidate.
4.  List exactly 2-4 key areas for improvement for the candidate, with constructive suggestions if possible.
5.  Write a comprehensive final assessment (3-5 sentences) summarizing the candidate's performance, overall suitability for the role of '{{{jobTitle}}}', and potential.
6.  Be objective, thorough, and detailed in your analysis. Don't be overly lenient. If there are mistakes or areas for improvement, point them out constructively.

Return your response in the exact JSON format specified by the output schema. Ensure all fields are populated according to these instructions.
Ensure the 'categoryScores' array contains exactly four objects, one for each specified category in the order listed above.
Example for a category score: { "name": "Communication & English Proficiency", "score": 85, "comment": "The candidate communicated clearly and fluently, demonstrating good comprehension and articulation." }
Do NOT calculate a 'totalScore' in your output; the application will handle this.
`,
});

const interviewSummaryGeneratorFlow = ai.defineFlow(
  {
    name: 'interviewSummaryGeneratorFlow',
    inputSchema: InterviewSummaryGeneratorInputSchema,
    outputSchema: InterviewSummaryGeneratorOutputSchema,
  },
  async (input): Promise<InterviewSummaryGeneratorOutput> => {
    const {output} = await prompt(input);

    // Log the raw output from AI for debugging, before validation
    console.log('[InterviewSummaryGenFlow] Raw AI output:', JSON.stringify(output, null, 2));

    if (!output) {
      const inputForLogging = { ...input, interviewTranscript: input.interviewTranscript.substring(0, 200) + "..." };
      console.error('[InterviewSummaryGenFlow] AI output was null or did not match schema. Input (truncated):', JSON.stringify(inputForLogging));
      throw new Error('AI failed to generate a summary report or the output did not match the schema.');
    }
     if (!output.categoryScores || output.categoryScores.length !== 4) {
      console.error('[InterviewSummaryGenFlow] AI output did not provide exactly 4 category scores. Received:', JSON.stringify(output.categoryScores, null, 2));
      throw new Error('AI output did not contain exactly 4 category scores as required by the schema.');
    }

    const expectedCategories = [
        "Communication & English Proficiency",
        "Technical Knowledge & Role Fit",
        "Problem Solving & Thinking",
        "Culture & Work Ethic Alignment"
    ];
    // Ensure categories match expected names and order
    output.categoryScores.forEach((cs, index) => {
        if (cs.name !== expectedCategories[index]) {
            console.warn(`[InterviewSummaryGenFlow] Mismatch in category name. Expected: "${expectedCategories[index]}", Got: "${cs.name}". Forcing expected name.`);
            cs.name = expectedCategories[index] as "Communication & English Proficiency" | "Technical Knowledge & Role Fit" | "Problem Solving & Thinking" | "Culture & Work Ethic Alignment";
        }
    });
    
    return output;
  }
);

