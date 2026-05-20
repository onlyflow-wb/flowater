import { z } from 'zod'

export const questionTypeSchema = z.enum([
  'multiple_choice',
  'single_choice',
  'slider',
  'rating_scale',
  'emoji_reactions',
  'yes_no',
  'dropdown',
  'card_selection',
  'percentage_slider',
  'short_text',
])

export const questionSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(600).nullable().optional(),
  type: questionTypeSchema,
  choices: z.array(z.string().trim().min(1).max(160)).nullable().optional(),
  required: z.boolean(),
  is_active: z.boolean(),
  survey_type: z.enum(['public', 'b2b']),
  order_index: z.number().int().min(0),
  min_value: z.number().nullable().optional(),
  max_value: z.number().nullable().optional(),
})

export const questionUpdateSchema = questionSchema.partial().extend({
  id: z.string().uuid(),
})
