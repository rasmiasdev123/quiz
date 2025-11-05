// Form validation schemas using Zod
import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['admin', 'student']).optional().default('student'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Book schemas
export const bookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
});

// Topic schemas
export const topicSchema = z.object({
  book_id: z.string().min(1, 'Book ID is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  order: z.number().int().min(0).default(0),
});

// Question schemas
export const questionOptionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
});

export const questionSchema = z.object({
  topic_id: z.string().min(1, 'Topic ID is required'),
  book_id: z.string().min(1, 'Book ID is required'),
  question_text: z.string().min(1, 'Question text is required').max(2000, 'Question is too long'),
  question_type: z.enum(['multiple_choice', 'true_false'], {
    errorMap: () => ({ message: 'Invalid question type' }),
  }),
  options: z.array(questionOptionSchema).min(2, 'At least 2 options are required'),
  points: z.number().int().min(1).max(100).default(1),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Invalid difficulty level' }),
  }).default('medium'),
  explanation: z.string().max(2000, 'Explanation is too long').optional(),
}).refine((data) => {
  // For multiple choice, ensure at least one correct answer
  if (data.question_type === 'multiple_choice') {
    return data.options.some(opt => opt.isCorrect);
  }
  // For true/false, ensure exactly one correct answer
  if (data.question_type === 'true_false') {
    return data.options.length === 2 && data.options.filter(opt => opt.isCorrect).length === 1;
  }
  return true;
}, {
  message: 'Invalid answer configuration',
  path: ['options'],
});

// Topic configuration schema for quizzes
const topicConfigSchema = z.object({
  topic_id: z.string().min(1, 'Topic ID is required'),
  selection_type: z.enum(['all', 'random'], {
    errorMap: () => ({ message: 'Selection type must be "all" or "random"' }),
  }),
  random_count: z.number().int().min(1).optional(),
}).refine((data) => {
  // If selection_type is 'random', random_count is required
  if (data.selection_type === 'random' && !data.random_count) {
    return false;
  }
  // If selection_type is 'all', random_count should not be provided
  if (data.selection_type === 'all' && data.random_count !== undefined) {
    return false;
  }
  return true;
}, {
  message: 'random_count is required when selection_type is "random" and must be omitted when "all"',
  path: ['random_count'],
});

// Quiz schemas
export const quizSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  topic_configs: z.array(topicConfigSchema).min(1, 'At least one topic configuration is required'),
  book_ids: z.array(z.string()).min(1, 'At least one book is required'),
  duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute').max(480, 'Duration cannot exceed 8 hours'),
  total_points: z.number().int().min(0, 'Total points must be 0 or greater').optional(),
  total_questions: z.number().int().min(0, 'Total questions must be 0 or greater').optional(),
  is_published: z.boolean().default(false),
});

// Quiz attempt schemas
export const quizAnswerSchema = z.object({
  question_id: z.string().min(1, 'Question ID is required'),
  selected_options: z.array(z.string()),
  points_earned: z.number().min(0).default(0),
});

export const quizAttemptSchema = z.object({
  quiz_id: z.string().min(1, 'Quiz ID is required'),
  answers: z.array(quizAnswerSchema),
});

// Bulk import schema
export const bulkImportSchema = z.object({
  book_id: z.string().min(1, 'Book ID is required'),
  topic_id: z.string().min(1, 'Topic ID is required'),
  questions: z.array(questionSchema),
});

// Note: Type exports are available if you convert this file to TypeScript (.ts)
// For JavaScript, the Zod schemas provide runtime validation

