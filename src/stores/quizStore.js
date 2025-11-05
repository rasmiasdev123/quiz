// Quiz state management store using Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useQuizStore = create(
  persist(
    (set, get) => ({
      // Current quiz taking state
      currentQuiz: null,
      currentAttempt: null,
      questions: [],
      answers: {},
      currentQuestionIndex: 0,
      timeRemaining: 0,
      timerInterval: null,
      isQuizActive: false,
      markedForReview: new Set(),

      // Quiz history
      quizHistory: [],

      // Actions - Quiz Setup
      startQuiz: (quiz, attempt, questions) => {
        const duration = quiz.duration_minutes * 60; // Convert to seconds
        
        set({
          currentQuiz: quiz,
          currentAttempt: attempt,
          questions: questions,
          answers: {},
          currentQuestionIndex: 0,
          timeRemaining: duration,
          isQuizActive: true,
          markedForReview: new Set(),
        });

        // Start timer
        const interval = setInterval(() => {
          const { timeRemaining, isQuizActive } = get();
          
          if (!isQuizActive || timeRemaining <= 0) {
            clearInterval(interval);
            if (timeRemaining <= 0) {
              // Auto-submit when time runs out
              get().autoSubmitQuiz();
            }
            return;
          }

          set({ timeRemaining: timeRemaining - 1 });
        }, 1000);

        set({ timerInterval: interval });
      },

      // Actions - Answer Management
      setAnswer: (questionId, selectedOptions) => {
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: selectedOptions,
          },
        }));
      },

      getAnswer: (questionId) => {
        const { answers } = get();
        return answers[questionId] || [];
      },

      clearAnswer: (questionId) => {
        set((state) => {
          const newAnswers = { ...state.answers };
          delete newAnswers[questionId];
          return { answers: newAnswers };
        });
      },

      // Actions - Navigation
      goToQuestion: (index) => {
        const { questions } = get();
        if (index >= 0 && index < questions.length) {
          set({ currentQuestionIndex: index });
        }
      },

      nextQuestion: () => {
        const { currentQuestionIndex, questions } = get();
        if (currentQuestionIndex < questions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      // Actions - Review
      toggleMarkForReview: (questionId) => {
        set((state) => {
          const newMarked = new Set(state.markedForReview);
          if (newMarked.has(questionId)) {
            newMarked.delete(questionId);
          } else {
            newMarked.add(questionId);
          }
          return { markedForReview: newMarked };
        });
      },

      isMarkedForReview: (questionId) => {
        const { markedForReview } = get();
        return markedForReview.has(questionId);
      },

      // Actions - Progress
      getProgress: () => {
        const { questions, answers } = get();
        const answered = questions.filter((q) => {
          const answer = answers[q.$id];
          // Handle both single choice (string/number) and multiple choice (array)
          return answer !== null && answer !== undefined && 
                 (Array.isArray(answer) ? answer.length > 0 : true);
        }).length;
        return {
          total: questions.length,
          answered,
          unanswered: questions.length - answered,
          percentage: questions.length > 0 
            ? Math.round((answered / questions.length) * 100) 
            : 0,
        };
      },

      // Actions - Quiz Completion
      submitQuiz: async () => {
        const { timerInterval } = get();
        if (timerInterval) {
          clearInterval(timerInterval);
        }

        set({
          isQuizActive: false,
          timerInterval: null,
        });

        // Return answers for submission
        return get().answers;
      },

      autoSubmitQuiz: async () => {
        // Called when time runs out
        return get().submitQuiz();
      },

      // Actions - Quiz Reset
      resetQuiz: () => {
        const { timerInterval } = get();
        if (timerInterval) {
          clearInterval(timerInterval);
        }

        set({
          currentQuiz: null,
          currentAttempt: null,
          questions: [],
          answers: {},
          currentQuestionIndex: 0,
          timeRemaining: 0,
          timerInterval: null,
          isQuizActive: false,
          markedForReview: new Set(),
        });
      },

      // Actions - History
      addToHistory: (attempt) => {
        set((state) => ({
          quizHistory: [attempt, ...state.quizHistory].slice(0, 50), // Keep last 50
        }));
      },

      clearHistory: () => {
        set({ quizHistory: [] });
      },

      // Getters
      getCurrentQuestion: () => {
        const { questions, currentQuestionIndex } = get();
        return questions[currentQuestionIndex] || null;
      },

      getTimeRemainingFormatted: () => {
        const { timeRemaining } = get();
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;

        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      },

      hasAnsweredAll: () => {
        const { questions, answers } = get();
        return questions.every((q) => {
          const answer = answers[q.$id];
          // Handle both single choice (string/number) and multiple choice (array)
          return answer !== null && answer !== undefined && 
                 (Array.isArray(answer) ? answer.length > 0 : true);
        });
      },
    }),
    {
      name: 'quiz-storage',
      partialize: (state) => ({
        quizHistory: state.quizHistory,
      }), // Only persist history
    }
  )
);

export default useQuizStore;

