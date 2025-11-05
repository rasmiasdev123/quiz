// Topic service - CRUD operations for topics
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { ID, Query } from 'appwrite';

/**
 * Get all topics
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - List of topics
 */
export async function getTopics(options = {}) {
  try {
    const { bookId, limit = 25, offset = 0 } = options;
    
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderAsc('order'),
    ];
    
    if (bookId) {
      queries.push(Query.equal('book_id', bookId));
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TOPICS,
      queries
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching topics:', error);
    throw error;
  }
}

/**
 * Get a single topic by ID
 * @param {string} topicId - Topic ID
 * @returns {Promise<Object>} - Topic document
 */
export async function getTopic(topicId) {
  try {
    const topic = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.TOPICS,
      topicId
    );
    return topic;
  } catch (error) {
    console.error('Error fetching topic:', error);
    throw error;
  }
}

/**
 * Get topics by book ID
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} - List of topics
 */
export async function getTopicsByBook(bookId) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TOPICS,
      [
        Query.equal('book_id', bookId),
        Query.orderAsc('order'),
      ]
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching topics by book:', error);
    throw error;
  }
}

/**
 * Create a new topic
 * @param {Object} topicData - Topic data
 * @param {string} topicData.book_id - Book ID
 * @param {string} topicData.title - Topic title
 * @param {string} topicData.description - Topic description (optional)
 * @param {number} topicData.order - Topic order (optional)
 * @param {string} userId - User ID of creator
 * @returns {Promise<Object>} - Created topic
 */
export async function createTopic(topicData, userId) {
  try {
    const { book_id, title, description = '', order = 0 } = topicData;
    
    const topic = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.TOPICS,
      ID.unique(),
      {
        book_id,
        title,
        description,
        order,
        created_by: userId,
      }
    );
    
    return topic;
  } catch (error) {
    console.error('Error creating topic:', error);
    throw error;
  }
}

/**
 * Update a topic
 * @param {string} topicId - Topic ID
 * @param {Object} topicData - Updated topic data
 * @returns {Promise<Object>} - Updated topic
 */
export async function updateTopic(topicId, topicData) {
  try {
    const { title, description, order } = topicData;
    
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    
    const topic = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.TOPICS,
      topicId,
      updateData
    );
    
    return topic;
  } catch (error) {
    console.error('Error updating topic:', error);
    throw error;
  }
}

/**
 * Delete a topic
 * @param {string} topicId - Topic ID
 * @returns {Promise<void>}
 */
export async function deleteTopic(topicId) {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.TOPICS,
      topicId
    );
  } catch (error) {
    console.error('Error deleting topic:', error);
    throw error;
  }
}

