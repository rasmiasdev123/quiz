// Book service - CRUD operations for books
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { ID, Query } from 'appwrite';

/**
 * Get all books
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of books to fetch (default: 25 for pagination)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @returns {Promise<Object>} - List of books
 */
export async function getBooks(options = {}) {
  try {
    const { limit = 25, offset = 0 } = options;
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.BOOKS,
      [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt'),
      ]
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
}

/**
 * Get books list for dropdowns (minimal data - only id and title)
 * Optimized for dropdown selects
 * @returns {Promise<Array>} - Array of books with only $id and title
 */
export async function getBooksForDropdown() {
  try {
    // Fetch all books but we'll only use id and title
    // Using limit 1000 for dropdowns (reasonable limit)
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.BOOKS,
      [
        Query.limit(1000),
        Query.orderDesc('$createdAt'),
      ]
    );
    
    // Return only required fields
    return (response?.documents || []).map(book => ({
      $id: book.$id,
      title: book.title,
    }));
  } catch (error) {
    console.error('Error fetching books for dropdown:', error);
    throw error;
  }
}

/**
 * Get a single book by ID
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} - Book document
 */
export async function getBook(bookId) {
  try {
    const book = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.BOOKS,
      bookId
    );
    return book;
  } catch (error) {
    console.error('Error fetching book:', error);
    throw error;
  }
}

/**
 * Create a new book
 * @param {Object} bookData - Book data
 * @param {string} bookData.title - Book title
 * @param {string} bookData.description - Book description (optional)
 * @param {string} userId - User ID of creator
 * @returns {Promise<Object>} - Created book
 */
export async function createBook(bookData, userId) {
  try {
    const { title, description = '' } = bookData;
    
    const book = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.BOOKS,
      ID.unique(),
      {
        title,
        description,
        created_by: userId,
      }
    );
    
    return book;
  } catch (error) {
    console.error('Error creating book:', error);
    throw error;
  }
}

/**
 * Update a book
 * @param {string} bookId - Book ID
 * @param {Object} bookData - Updated book data
 * @returns {Promise<Object>} - Updated book
 */
export async function updateBook(bookId, bookData) {
  try {
    const { title, description } = bookData;
    
    const book = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.BOOKS,
      bookId,
      {
        title,
        description,
      }
    );
    
    return book;
  } catch (error) {
    console.error('Error updating book:', error);
    throw error;
  }
}

/**
 * Delete a book
 * @param {string} bookId - Book ID
 * @returns {Promise<void>}
 */
export async function deleteBook(bookId) {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.BOOKS,
      bookId
    );
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
}

/**
 * Get books created by a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - List of books
 */
export async function getBooksByUser(userId) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.BOOKS,
      [Query.equal('created_by', userId)]
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching books by user:', error);
    throw error;
  }
}

