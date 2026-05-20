import { z } from 'zod'

export const surveyTypeSchema = z.enum(['public', 'b2b'])

export const respondentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  age: z.number().int().min(1).max(120),
  gender: z.string().trim().min(1).max(50),
  location: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(50).optional(),
  survey_type: z.enum(['public', 'b2b', 'helper']),
  session_id: z.string().uuid(),
  helper_id: z.string().uuid().optional(),
})

export const responseSchema = z.object({
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  answer_value: z.string().max(2000),
  survey_type: surveyTypeSchema,
})

export const responsesSchema = z.object({
  responses: z.array(responseSchema).max(100),
})
