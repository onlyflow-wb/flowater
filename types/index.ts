export type QuestionType =
  | 'multiple_choice'
  | 'single_choice'
  | 'slider'
  | 'rating_scale'
  | 'emoji_reactions'
  | 'yes_no'
  | 'dropdown'
  | 'card_selection'
  | 'percentage_slider'
  | 'short_text'

export interface Question {
  id: string
  title: string
  description?: string
  type: QuestionType
  choices?: string[]
  required: boolean
  image_url?: string
  icon_name?: string
  order_index: number
  is_active: boolean
  survey_type: 'public' | 'b2b'
  min_value?: number
  max_value?: number
  created_at: string
  updated_at: string
}

export interface Answer {
  id: string
  session_id: string
  question_id: string
  answer_value: string
  survey_type: 'public' | 'b2b'
  created_at: string
}

export interface Helper {
  id: string
  username: string
  password: string
  display_name: string
  is_active: boolean
  created_at: string
}

export interface Respondent {
  id: string
  name: string
  age: number
  gender: string
  location?: string
  phone?: string
  survey_type: 'public' | 'b2b' | 'helper'
  helper_id?: string
  session_id: string
  created_at: string
}
