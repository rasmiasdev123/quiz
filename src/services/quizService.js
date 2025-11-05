// Quiz service - CRUD operations for quizzes
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { ID, Query } from 'appwrite';

/**
 * Get all quizzes
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - List of quizzes
 */
export async function getQuizzes(options = {}) {
  try {
    const { bookId, isPublished, limit = 25, offset = 0 } = options;
    
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];
    
    // If bookId is provided, filter by book_ids array (contains)
    if (bookId) {
      queries.push(Query.contains('book_ids', bookId));
    }
    
    if (isPublished !== undefined) {
      queries.push(Query.equal('is_published', isPublished));
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.QUIZZES,
      queries
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
}

/**
 * Get published quizzes only
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - List of published quizzes
 */
export async function getPublishedQuizzes(options = {}) {
  return getQuizzes({ ...options, isPublished: true });
}

/**
 * Get a single quiz by ID
 * @param {string} quizId - Quiz ID
 * @returns {Promise<Object>} - Quiz document
 */
export async function getQuiz(quizId) {
  try {
    const quiz = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.QUIZZES,
      quizId
    );
    return quiz;
  } catch (error) {
    console.error('Error fetching quiz:', error);
    throw error;
  }
}

/**
 * Create a new quiz
 * @param {Object} quizData - Quiz data
 * @param {string} quizData.title - Quiz title
 * @param {string} quizData.description - Quiz description (optional)
 * @param {Array<Object>} quizData.topic_configs - Array of topic configurations: [{topic_id, selection_type, random_count?}]
 * @param {Array<string>} quizData.book_ids - Array of book IDs
 * @param {number} quizData.duration_minutes - Duration in minutes
 * @param {number} quizData.total_points - Total points
 * @param {number} quizData.total_questions - Total number of questions (calculated)
 * @param {boolean} quizData.is_published - Published status (default: false)
 * @param {string} userId - User ID of creator
 * @returns {Promise<Object>} - Created quiz
 */
export async function createQuiz(quizData, userId) {
  try {
    const {
      title,
      description = '',
      topic_configs,
      book_ids,
      duration_minutes,
      total_points,
      total_questions = 0,
      is_published = false,
    } = quizData;
    
    // Validate topic_configs
    if (!Array.isArray(topic_configs) || topic_configs.length === 0) {
      throw new Error('At least one topic configuration is required');
    }
    
    // Validate book_ids
    if (!Array.isArray(book_ids) || book_ids.length === 0) {
      throw new Error('At least one book is required');
    }
    
    // Convert topic_configs array of objects to array of JSON strings for Appwrite
    const topicConfigsAsStrings = topic_configs.map(config => JSON.stringify(config));
    
    const quiz = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.QUIZZES,
      ID.unique(),
      {
        title,
        description,
        topic_configs: topicConfigsAsStrings,
        book_ids: book_ids,
        duration_minutes,
        total_points,
        total_questions,
        is_published,
        created_by: userId,
      }
    );
    
    return quiz;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
}

/**
 * Update a quiz
 * @param {string} quizId - Quiz ID
 * @param {Object} quizData - Updated quiz data
 * @returns {Promise<Object>} - Updated quiz
 */
export async function updateQuiz(quizId, quizData) {
  try {
    const updateData = {};
    
    if (quizData.title !== undefined) updateData.title = quizData.title;
    if (quizData.description !== undefined) updateData.description = quizData.description;
    
    if (quizData.topic_configs !== undefined) {
      // Convert topic_configs array of objects to array of JSON strings
      const topicConfigsAsStrings = quizData.topic_configs.map(config => JSON.stringify(config));
      updateData.topic_configs = topicConfigsAsStrings;
    }
    
    if (quizData.book_ids !== undefined) updateData.book_ids = quizData.book_ids;
    if (quizData.duration_minutes !== undefined) updateData.duration_minutes = quizData.duration_minutes;
    if (quizData.total_points !== undefined) updateData.total_points = quizData.total_points;
    if (quizData.total_questions !== undefined) updateData.total_questions = quizData.total_questions;
    if (quizData.is_published !== undefined) updateData.is_published = quizData.is_published;
    
    const quiz = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.QUIZZES,
      quizId,
      updateData
    );
    
    return quiz;
  } catch (error) {
    console.error('Error updating quiz:', error);
    throw error;
  }
}

/**
 * Delete a quiz
 * @param {string} quizId - Quiz ID
 * @returns {Promise<void>}
 */
export async function deleteQuiz(quizId) {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.QUIZZES,
      quizId
    );
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
}

/**
 * Publish a quiz
 * @param {string} quizId - Quiz ID
 * @returns {Promise<Object>} - Updated quiz
 */
export async function publishQuiz(quizId) {
  return updateQuiz(quizId, { is_published: true });
}

/**
 * Unpublish a quiz
 * @param {string} quizId - Quiz ID
 * @returns {Promise<Object>} - Updated quiz
 */
export async function unpublishQuiz(quizId) {
  return updateQuiz(quizId, { is_published: false });
}

/**
 * Parse topic configs from array of JSON strings to array of objects
 * @param {Array<string>} topicConfigsStrings - Array of JSON strings
 * @returns {Array<Object>} - Parsed topic configurations array
 */
export function parseTopicConfigs(topicConfigsStrings) {
  try {
    if (!Array.isArray(topicConfigsStrings)) {
      return [];
    }
    return topicConfigsStrings.map(configString => {
      try {
        return JSON.parse(configString);
      } catch (error) {
        console.error('Error parsing topic config:', error);
        return null;
      }
    }).filter(config => config !== null);
  } catch (error) {
    console.error('Error parsing topic configs:', error);
    return [];
  }
}

/**
 * Get questions for a quiz based on topic configurations
 * This function dynamically fetches questions when a quiz is started
 * @param {Array<Object>} topicConfigs - Array of topic configurations
 * @returns {Promise<Array<Object>>} - Array of question documents
 */
export async function getQuizQuestions(topicConfigs) {
  try {
    const { getQuestions } = await import('./questionService.js');
    const allQuestions = [];
    
    for (const config of topicConfigs) {
      const { topic_id, selection_type, random_count } = config;
      
      // Fetch all questions for this topic
      const response = await getQuestions({ topicId: topic_id });
      const topicQuestions = response?.documents || [];
      
      if (selection_type === 'all') {
        // Add all questions from this topic
        allQuestions.push(...topicQuestions);
      } else if (selection_type === 'random' && random_count) {
        // Randomly select questions (shuffle and take first N)
        if (topicQuestions.length <= random_count) {
          // If we have fewer questions than requested, use all
          allQuestions.push(...topicQuestions);
        } else {
          // Shuffle array and take first random_count
          const shuffled = [...topicQuestions].sort(() => Math.random() - 0.5);
          allQuestions.push(...shuffled.slice(0, random_count));
        }
      }
    }
    
    // Shuffle all questions together to mix topics
    return allQuestions.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    throw error;
  }
}

