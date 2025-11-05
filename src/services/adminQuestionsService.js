// Admin questions service - Optimized queries
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { Query } from 'appwrite';

/**
 * Get questions, books, and topics data for admin questions page
 * Fetches books and topics in parallel when possible
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Questions, books, and topics data
 */
export async function getAdminQuestionsData(options = {}) {
  try {
    const { bookId, topicId, limit = 15, offset = 0, searchTerm } = options;
    
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];
    
    if (bookId) {
      queries.push(Query.equal('book_id', bookId));
    }
    
    if (topicId) {
      queries.push(Query.equal('topic_id', topicId));
    }

    // Note: Fulltext search requires a fulltext index in Appwrite
    // For now, we'll filter on client-side after fetching
    // If you want backend search, add a fulltext index on 'question_text' in Appwrite

    // Fetch questions
    const questionsRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.QUESTIONS,
      queries
    );

    return {
      questions: questionsRes?.documents || [],
      total: questionsRes?.total || 0,
    };
  } catch (error) {
    console.error('Error fetching admin questions data:', error);
    throw error;
  }
}

/**
 * Get books and topics for filters (parallel fetch)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Books and topics data
 */
export async function getAdminQuestionsFilters(bookId) {
  try {
    // Fetch books and topics in parallel
    const [booksRes, topicsRes] = await Promise.all([
      // Get books for dropdown
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.BOOKS,
        [
          Query.limit(1000), // Reasonable limit for dropdown
          Query.orderAsc('title'),
        ]
      ),
      // Get topics (filtered by book if provided)
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TOPICS,
        bookId
          ? [
              Query.equal('book_id', bookId),
              Query.limit(1000),
              Query.orderAsc('title'),
            ]
          : [
              Query.limit(1000),
              Query.orderAsc('title'),
            ]
      ),
    ]);

    return {
      books: booksRes?.documents || [],
      topics: topicsRes?.documents || [],
    };
  } catch (error) {
    console.error('Error fetching admin questions filters:', error);
    throw error;
  }
}

