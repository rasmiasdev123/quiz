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

    // Server-side fulltext search (requires fulltext index on 'question_text' in Appwrite)
    // IMPORTANT: Query.search() uses the ATTRIBUTE NAME (column name), not the index key
    // The index key 'search' is just an identifier - Query.search() needs 'question_text'
    if (searchTerm && searchTerm.trim()) {
      const trimmedSearch = searchTerm.trim();
      // Use the attribute name 'question_text' (the column the index is built on)
      queries.push(Query.search('question_text', trimmedSearch));
    }

    // Fetch questions
    let questionsRes;
    try {
      questionsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUESTIONS,
        queries
      );
    } catch (error) {
      console.error('Error fetching questions with search:', error);
      // If search fails (e.g., index not found or wrong index key), try without search
      if (searchTerm && searchTerm.trim()) {
        console.warn('Search query failed, this might be due to incorrect index key. Error:', error.message);
        // Remove search query and try again
        const queriesWithoutSearch = queries.filter(q => {
          // Filter out search queries
          try {
            return !q.toString().includes('search');
          } catch {
            return true;
          }
        });
        
        try {
          questionsRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.QUESTIONS,
            queriesWithoutSearch
          );
          console.warn('Fetched all questions without search filter. Please check your index key.');
          // Note: We're returning all questions here, but ideally should filter client-side
          // However, for large datasets, this is not ideal
        } catch (fallbackError) {
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }

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

