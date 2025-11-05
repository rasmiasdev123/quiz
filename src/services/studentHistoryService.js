// Student history service - Optimized queries with pagination
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { Query } from 'appwrite';

/**
 * Get student attempt history with pagination
 * Fetches attempts and quizzes in parallel
 * @param {string} studentId - Student ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Attempts and quizzes data
 */
export async function getStudentHistoryData(studentId, options = {}) {
  try {
    const { 
      quizId, 
      limit = 15, 
      offset = 0,
      searchTerm = '',
    } = options;

    const queries = [
      Query.equal('student_id', studentId),
      Query.equal('status', 'completed'), // Only completed attempts
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
      Query.offset(offset),
    ];
    
    if (quizId) {
      queries.push(Query.equal('quiz_id', quizId));
    }

    // Fetch attempts and quizzes (for dropdown) in parallel
    const [attemptsRes, quizzesRes] = await Promise.all([
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUIZ_ATTEMPTS,
        queries
      ),
      // Get quizzes for dropdown (only published, minimal fields)
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUIZZES,
        [
          Query.equal('is_published', true),
          Query.limit(100), // Reasonable limit for dropdown
          Query.orderAsc('title'),
        ]
      ),
    ]);

    let attempts = attemptsRes?.documents || [];
    
    // Client-side search filter (if searchTerm provided)
    if (searchTerm) {
      attempts = attempts.filter(a => 
        a.quiz_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Calculate statistics from fetched attempts
    const totalAttempts = attemptsRes?.total || 0;
    const averageScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0) / attempts.length)
      : 0;
    const bestScore = attempts.length > 0
      ? Math.max(...attempts.map(a => Number(a.percentage) || 0))
      : 0;
    const totalPoints = attempts.reduce((sum, a) => sum + (Number(a.points_earned) || 0), 0);

    return {
      attempts: attempts.map(attempt => ({
        $id: attempt.$id,
        quiz_id: attempt.quiz_id,
        quiz_title: attempt.quiz_title || 'Quiz',
        percentage: Number(attempt.percentage) || 0,
        points_earned: Number(attempt.points_earned) || 0,
        total_points: Number(attempt.total_points) || 0,
        $createdAt: attempt.$createdAt,
        $updatedAt: attempt.$updatedAt,
        completed_at: attempt.completed_at,
        duration_minutes: attempt.duration_minutes,
      })),
      total: totalAttempts,
      hasMore: (offset + limit) < totalAttempts,
      quizzes: quizzesRes?.documents || [],
      stats: {
        totalAttempts,
        averageScore,
        bestScore,
        totalPoints,
      },
    };
  } catch (error) {
    console.error('Error fetching student history data:', error);
    throw error;
  }
}

