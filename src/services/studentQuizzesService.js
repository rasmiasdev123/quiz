// Student quizzes service - Optimized queries
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { Query } from 'appwrite';

/**
 * Get quizzes and books data for student quizzes page
 * Fetches both in parallel with optimized queries
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Quizzes and books data
 */
export async function getStudentQuizzesData(options = {}) {
  try {
    const { bookId, limit = 50, offset = 0 } = options;
    
    const queries = [
      Query.equal('is_published', true),
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];
    
    // If bookId is provided, filter by book_ids array (contains)
    if (bookId) {
      queries.push(Query.contains('book_ids', bookId));
    }

    // Fetch quizzes and books in parallel
    const [quizzesRes, booksRes] = await Promise.all([
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUIZZES,
        queries
      ),
      // Get books for dropdown (only id and title)
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.BOOKS,
        [
          Query.limit(100), // Reasonable limit for dropdown
          Query.orderAsc('title'),
        ]
      ),
    ]);

    return {
      quizzes: quizzesRes?.documents || [],
      total: quizzesRes?.total || 0,
      books: booksRes?.documents || [],
    };
  } catch (error) {
    console.error('Error fetching student quizzes data:', error);
    throw error;
  }
}

