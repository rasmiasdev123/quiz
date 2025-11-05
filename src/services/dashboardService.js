// Dashboard service - Optimized queries for dashboard statistics
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { Query } from 'appwrite';

/**
 * Get dashboard statistics (counts only)
 * Uses optimized queries with limit(1) to get totals without fetching all documents
 * @returns {Promise<Object>} - Dashboard statistics
 */
export async function getDashboardStats() {
  try {
    // Use Promise.all to fetch all counts in parallel
    // Each query uses limit(1) to minimize data transfer - we only need the 'total' field
    const [booksRes, topicsRes, questionsRes, quizzesRes, attemptsRes, usersRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.BOOKS, [Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.TOPICS, [Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.QUESTIONS, [Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.QUIZZES, [Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.QUIZ_ATTEMPTS, [Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [Query.limit(1)]),
    ]);

    return {
      books: booksRes.total || 0,
      topics: topicsRes.total || 0,
      questions: questionsRes.total || 0,
      quizzes: quizzesRes.total || 0,
      attempts: attemptsRes.total || 0,
      users: usersRes.total || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

/**
 * Get recent activity (latest 5 attempts only)
 * Only fetches minimal required fields
 * @returns {Promise<Array>} - Recent activity items
 */
export async function getRecentActivity() {
  try {
    // Only fetch the latest 5 attempts
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.QUIZ_ATTEMPTS,
      [
        Query.limit(5),
        Query.orderDesc('$createdAt'),
      ]
    );

    return (response?.documents || []).map((attempt) => ({
      id: attempt.$id,
      type: 'attempt',
      message: `New quiz attempt completed`,
      time: attempt.$createdAt,
      score: attempt.score,
      status: attempt.status,
    }));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    // Return empty array on error to not break the UI
    return [];
  }
}

