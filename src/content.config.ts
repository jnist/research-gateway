import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    englishTitle: z.string(),
    summary: z.string(),
    en: z.object({
      summary: z.string(),
      status: z.string(),
      tags: z.array(z.string()),
      image: z.string().optional(),
      imageAlt: z.string(),
      licenseNote: z.string(),
    }),
    year: z.number().int(),
    status: z.string(),
    version: z.string(),
    tags: z.array(z.string()),
    image: z.string(),
    imageAlt: z.string(),
    tool: z.string().optional(),
    authors: z.array(z.string()).default([]),
    paperUrl: z.url().optional(),
    codeUrl: z.url().optional(),
    datasetPath: z.string().optional(),
    datasetArchivePath: z.string().optional(),
    manifestPath: z.string().optional(),
    citation: z.string(),
    bibtex: z.string().optional(),
    licenseNote: z.string(),
  }).refine(data => data.tags.length === data.en.tags.length, {
    message: 'Chinese and English research tags must have matching lengths',
    path: ['en', 'tags'],
  }),
});
const researchEnglish = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research-en' }),
});
export const collections = { research, researchEnglish };
