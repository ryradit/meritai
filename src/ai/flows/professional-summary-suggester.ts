
'use server';
/**
 * @fileOverview A professional summary suggestion AI agent.
 *
 * - professionalSummarySuggester - A function that generates professional summary suggestions.
 * - ProfessionalSummarySuggesterInput - The input type for the professionalSummarySuggester function.
 * - ProfessionalSummarySuggesterOutput - The return type for the professionalSummarySuggester function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProfessionalSummarySuggesterInputSchema = z.object({
  headline: z.string().describe('The professional headline provided by the user.'),
});
export type ProfessionalSummarySuggesterInput = z.infer<typeof ProfessionalSummarySuggesterInputSchema>;

const ProfessionalSummarySuggesterOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of 3-5 professional summary suggestions.'),
});
export type ProfessionalSummarySuggesterOutput = z.infer<typeof ProfessionalSummarySuggesterOutputSchema>;

export async function professionalSummarySuggester(input: ProfessionalSummarySuggesterInput): Promise<ProfessionalSummarySuggesterOutput> {
  return professionalSummarySuggesterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'professionalSummarySuggesterPrompt',
  input: {schema: ProfessionalSummarySuggesterInputSchema},
  output: {schema: ProfessionalSummarySuggesterOutputSchema},
  prompt: `You are an expert career advisor and resume writer.
Based on the following professional headline, please generate 3 concise and impactful professional summary suggestions.
Each suggestion should be a short paragraph, typically 2-4 sentences long, highlighting key aspects implied by the headline.
Focus on action verbs and quantifiable achievements if possible, or highlight key skills and aspirations.

Professional Headline:
"{{{headline}}}"

Return the suggestions as a JSON object with a "suggestions" key containing an array of strings.
For example:
{
  "suggestions": [
    "Suggestion 1...",
    "Suggestion 2...",
    "Suggestion 3..."
  ]
}
`,
});

const professionalSummarySuggesterFlow = ai.defineFlow(
  {
    name: 'professionalSummarySuggesterFlow',
    inputSchema: ProfessionalSummarySuggesterInputSchema,
    outputSchema: ProfessionalSummarySuggesterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
