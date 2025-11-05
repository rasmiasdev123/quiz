// Application constants

export const APP_NAME = 'Quiz App';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
};

// Question types
export const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
};

// Question difficulty levels
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

// Quiz attempt status
export const QUIZ_ATTEMPT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    BOOKS: '/admin/books',
    TOPICS: '/admin/topics',
    QUESTIONS: '/admin/questions',
    QUIZZES: '/admin/quizzes',
    ATTEMPTS: '/admin/attempts',
    BULK_IMPORT: '/admin/bulk-import',
    CHANGE_PASSWORD: '/admin/change-password',
  },
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    QUIZZES: '/student/quizzes',
    QUIZ_TAKING: '/student/quizzes/:quizId/take',
    QUIZ_RESULTS: '/student/quizzes/:quizId/results',
    HISTORY: '/student/history',
    CHANGE_PASSWORD: '/student/change-password',
  },
};

