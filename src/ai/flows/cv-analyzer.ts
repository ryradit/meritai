'use server';

/**
 * @fileOverview A CV analyzer AI agent.
 *
 * - analyzeCv - A function that handles the CV analysis process.
 * - AnalyzeCvInput - The input type for the analyzeCv function.
 * - AnalyzeCvOutput - The return type for the analyzeCv function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCvInputSchema = z.object({
  cvDataUri: z
    .string()
    .describe(
      "A CV document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeCvInput = z.infer<typeof AnalyzeCvInputSchema>;

const AnalyzeCvOutputSchema = z.object({
  skills: z.array(z.string()).describe('A list of skills extracted from the CV.'),
  experience: z
    .array(
      z.object({
        title: z.string().describe('The job title.'),
        company: z.string().describe('The company name.'),
        dates: z.string().describe('The start and end dates of the job.'),
        description: z.string().describe('A description of the job.'),
      })
    )
    .describe('A list of work experiences extracted from the CV.'),
  education: z
    .array(
      z.object({
        degree: z.string().describe('The degree name.'),
        institution: z.string().describe('The institution name.'),
        dates: z.string().describe('The start and end dates of the education.'),
        description: z.string().describe('A description of the education.'),
      })
    )
    .describe('A list of education entries extracted from the CV.'),
  summary: z.string().describe('A summary of the candidate qualifications.'),
});
export type AnalyzeCvOutput = z.infer<typeof AnalyzeCvOutputSchema>;

export async function analyzeCv(input: AnalyzeCvInput): Promise<AnalyzeCvOutput> {
  return analyzeCvFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCvPrompt',
  input: {schema: AnalyzeCvInputSchema},
  output: {schema: AnalyzeCvOutputSchema},
  prompt: `You are an expert resume parser. Extract the following information from the CV document.

Skills: A list of skills extracted from the CV.
Experience: A list of work experiences extracted from the CV. Include the job title, company name, dates, and a description of the job.
Education: A list of education entries extracted from the CV. Include the degree name, institution name, dates, and a description of the education.
Summary: A summary of the candidate qualifications.

CV Document: {{media url=cvDataUri}}

Return the output in JSON format.`,
});

const analyzeCvFlow = ai.defineFlow(
  {
    name: 'analyzeCvFlow',
    inputSchema: AnalyzeCvInputSchema,
    outputSchema: AnalyzeCvOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
