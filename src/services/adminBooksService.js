// Admin books service - Optimized queries
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { Query } from 'appwrite';

/**
 * Get books data for admin books page
 * Optimized with proper limit to avoid loading all books at once
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Books data
 */
export async function getAdminBooksData(options = {}) {
  try {
    const { limit = 100, offset = 0 } = options;
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.BOOKS,
      [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt'),
      ]
    );

    return {
      books: response?.documents || [],
      total: response?.total || 0,
    };
  } catch (error) {
    console.error('Error fetching admin books data:', error);
    throw error;
  }
}

