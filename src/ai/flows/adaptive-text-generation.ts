'use server';

/**
 * @fileOverview Generates adaptive typing text based on user skill and mode.
 *
 * - generateAdaptiveText - A function that generates typing text.
 * - AdaptiveTextGenerationInput - The input type for the generateAdaptiveText function.
 * - AdaptiveTextGenerationOutput - The return type for the generateAdaptiveText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptiveTextGenerationInputSchema = z.object({
  mode: z.enum(['general', 'code']).describe('The typing mode: general text or code.'),
  language: z.string().optional().describe('The programming language for code mode.'),
  skillLevel: z
    .number()
    .min(1)
    .max(10)
    .describe('The user skill level (1-10, 1 is beginner).'),
  previousMistakes: z
    .string()
    .optional()
    .describe('User mistakes from the previous text generation.'),
});
export type AdaptiveTextGenerationInput = z.infer<
  typeof AdaptiveTextGenerationInputSchema
>;

const AdaptiveTextGenerationOutputSchema = z.object({
  text: z.string().describe('The generated text for typing practice.'),
});
export type AdaptiveTextGenerationOutput = z.infer<
  typeof AdaptiveTextGenerationOutputSchema
>;

export async function generateAdaptiveText(
  input: AdaptiveTextGenerationInput
): Promise<AdaptiveTextGenerationOutput> {
  return adaptiveTextGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptiveTextPrompt',
  input: {schema: AdaptiveTextGenerationInputSchema},
  output: {schema: AdaptiveTextGenerationOutputSchema},
  prompt: `You are a typing practice text generator. Generate text based on the user's skill level and chosen mode.

Mode: {{{mode}}}
{{#if language}}Language: {{{language}}}{{/if}}
Skill Level: {{{skillLevel}}}
{{#if previousMistakes}}Previous Mistakes: {{{previousMistakes}}}{{/if}}

Instructions:
- For general mode, generate realistic text snippets.
- For code mode, generate code snippets in the specified language that follow standard syntax.
- Adapt the complexity of the text to the user's skill level. A higher skill level should result in more complex and challenging text.
- If the user provided mistakes from the previous text generation, generate new text based on them.

Output:
Text:`, // No need for JSON output, straight text is preferred
});

const adaptiveTextGenerationFlow = ai.defineFlow(
  {
    name: 'adaptiveTextGenerationFlow',
    inputSchema: AdaptiveTextGenerationInputSchema,
    outputSchema: AdaptiveTextGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {text: output!};
  }
);
