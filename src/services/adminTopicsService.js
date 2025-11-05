// Admin topics service - Optimized queries
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { Query } from 'appwrite';

/**
 * Get topics and books data for admin topics page
 * Fetches both in parallel for better performance
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Topics and books data
 */
export async function getAdminTopicsData(options = {}) {
  try {
    const { bookId, limit = 100, offset = 0 } = options;
    
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];
    
    if (bookId) {
      queries.push(Query.equal('book_id', bookId));
    }

    // Fetch topics and books in parallel
    const [topicsRes, booksRes] = await Promise.all([
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TOPICS,
        queries
      ),
      // Get books for dropdown (only id and title)
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.BOOKS,
        [
          Query.limit(1000), // Reasonable limit for dropdown
          Query.orderAsc('title'),
        ]
      ),
    ]);

    return {
      topics: topicsRes?.documents || [],
      total: topicsRes?.total || 0,
      books: booksRes?.documents || [],
    };
  } catch (error) {
    console.error('Error fetching admin topics data:', error);
    throw error;
  }
}

