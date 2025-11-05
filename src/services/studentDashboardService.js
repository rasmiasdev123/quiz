// Student dashboard service - Optimized queries
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { Query } from 'appwrite';

/**
 * Get student dashboard data in a single optimized call
 * Fetches published quizzes count and student attempts in parallel
 * Only fetches completed attempts with minimal fields needed
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} - Dashboard data
 */
export async function getStudentDashboardData(studentId) {
  try {
    // Fetch both in parallel with optimized queries
    const [quizzesRes, attemptsRes] = await Promise.all([
      // Get published quizzes count only (limit 1 to get total)
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUIZZES,
        [
          Query.equal('is_published', true),
          Query.limit(1), // Only need total count
        ]
      ),
      // Get student's completed attempts with minimal data
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUIZ_ATTEMPTS,
        [
          Query.equal('student_id', studentId),
          Query.equal('status', 'completed'), // Only completed attempts
          Query.orderDesc('$createdAt'),
          Query.limit(5), // Limit to recent 5 for dashboard
        ]
      ),
    ]);

    const attempts = attemptsRes?.documents || [];
    const availableQuizzes = quizzesRes?.total || 0;

    // Calculate statistics from attempts
    const completedQuizzes = attempts.length;
    const totalPoints = attempts.reduce((sum, a) => sum + (Number(a.points_earned) || 0), 0);
    
    // Calculate average score from percentage
    const totalPercentage = attempts.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0);
    const averageScore = completedQuizzes > 0 
      ? Math.round(totalPercentage / completedQuizzes) 
      : 0;

    // Get all attempts (already limited to 5 from query)
    const recentAttempts = attempts.map(attempt => ({
      $id: attempt.$id,
      quiz_id: attempt.quiz_id,
      quiz_title: attempt.quiz_title || 'Quiz',
      percentage: Number(attempt.percentage) || 0,
      points_earned: Number(attempt.points_earned) || 0,
      total_points: Number(attempt.total_points) || 0,
      $createdAt: attempt.$createdAt,
      $updatedAt: attempt.$updatedAt,
      completed_at: attempt.completed_at,
    }));

    return {
      stats: {
        availableQuizzes,
        completedQuizzes,
        averageScore,
        totalPoints,
      },
      recentAttempts,
    };
  } catch (error) {
    console.error('Error fetching student dashboard data:', error);
    throw error;
  }
}

