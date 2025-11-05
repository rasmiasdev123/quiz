// Admin attempt detail service - Optimized queries
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { getUser } from './userService.js';

/**
 * Get attempt detail data with user email
 * @param {string} attemptId - Attempt ID
 * @returns {Promise<Object>} - Attempt, quiz, and user data
 */
export async function getAdminAttemptDetailData(attemptId) {
  try {
    // Fetch attempt
    const attempt = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.QUIZ_ATTEMPTS,
      attemptId
    );

    // Fetch quiz and user in parallel
    const [quiz, user] = await Promise.all([
      attempt.quiz_id
        ? databases.getDocument(DATABASE_ID, COLLECTIONS.QUIZZES, attempt.quiz_id)
            .catch(() => null) // Return null if quiz not found
        : Promise.resolve(null),
      attempt.student_id
        ? getUser(attempt.student_id)
            .catch(() => null) // Return null if user not found
        : Promise.resolve(null),
    ]);

    return {
      attempt,
      quiz,
      user,
    };
  } catch (error) {
    console.error('Error fetching admin attempt detail data:', error);
    throw error;
  }
}

