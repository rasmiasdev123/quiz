// Question service - CRUD operations for questions
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { ID, Query } from 'appwrite';

/**
 * Get all questions
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - List of questions
 */
export async function getQuestions(options = {}) {
  try {
    const { bookId, topicId, limit = 25, offset = 0 } = options;
    
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
    ];
    
    if (bookId) {
      queries.push(Query.equal('book_id', bookId));
    }
    
    if (topicId) {
      queries.push(Query.equal('topic_id', topicId));
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.QUESTIONS,
      queries
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
}

/**
 * Get a single question by ID
 * @param {string} questionId - Question ID
 * @returns {Promise<Object>} - Question document
 */
export async function getQuestion(questionId) {
  try {
    const question = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.QUESTIONS,
      questionId
    );
    return question;
  } catch (error) {
    console.error('Error fetching question:', error);
    throw error;
  }
}

/**
 * Get questions by their IDs
 * @param {Array<string>} questionIds - Array of question IDs
 * @returns {Promise<Array<Object>>} - Array of question documents
 */
export async function getQuestionsByIds(questionIds) {
  try {
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return [];
    }
    
    // Fetch questions in parallel for better performance
    const questionPromises = questionIds.map(questionId => 
      getQuestion(questionId).catch(error => {
        console.error(`Error fetching question ${questionId}:`, error);
        return null; // Return null for failed fetches
      })
    );
    
    const questions = await Promise.all(questionPromises);
    
    // Filter out null values and maintain the order of questionIds
    const questionMap = new Map(
      questions
        .filter(q => q !== null)
        .map(q => [q.$id, q])
    );
    
    return questionIds
      .map(id => questionMap.get(id))
      .filter(q => q !== undefined);
  } catch (error) {
    console.error('Error fetching questions by IDs:', error);
    throw error;
  }
}

/**
 * Get questions by topic ID (fetches ALL questions, no limit)
 * @param {string} topicId - Topic ID
 * @returns {Promise<Object>} - List of questions with all documents
 */
export async function getQuestionsByTopic(topicId) {
  try {
    const allQuestions = [];
    let offset = 0;
    const limit = 100; // Appwrite max per query
    let hasMore = true;
    
    // Fetch all questions in batches to handle Appwrite's default limit
    while (hasMore) {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUESTIONS,
        [
          Query.equal('topic_id', topicId),
          Query.limit(limit),
          Query.offset(offset),
        ]
      );
      
      allQuestions.push(...(response?.documents || []));
      
      // Check if there are more questions to fetch
      offset += limit;
      hasMore = response?.documents?.length === limit && offset < (response?.total || 0);
    }
    
    // Return in the same format as Appwrite's listDocuments response
    return {
      documents: allQuestions,
      total: allQuestions.length,
    };
  } catch (error) {
    console.error('Error fetching questions by topic:', error);
    throw error;
  }
}

/**
 * Get questions by book ID
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} - List of questions
 */
export async function getQuestionsByBook(bookId) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.QUESTIONS,
      [Query.equal('book_id', bookId)]
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching questions by book:', error);
    throw error;
  }
}

/**
 * Create a new question
 * @param {Object} questionData - Question data
 * @param {string} questionData.topic_id - Topic ID
 * @param {string} questionData.book_id - Book ID
 * @param {string} questionData.question_text - Question text
 * @param {string} questionData.question_type - Question type
 * @param {Array} questionData.options - Question options
 * @param {number} questionData.points - Points (default: 1)
 * @param {string} questionData.difficulty - Difficulty level
 * @param {string} questionData.explanation - Explanation (optional)
 * @param {string} userId - User ID of creator
 * @returns {Promise<Object>} - Created question
 */
export async function createQuestion(questionData, userId) {
  try {
    const {
      topic_id,
      book_id,
      question_text,
      question_type,
      options,
      points = 1,
      difficulty = 'medium',
      explanation = '',
    } = questionData;
    
    // Ensure options is an array and filter out empty options
    const validOptions = Array.isArray(options) 
      ? options.filter(opt => opt && opt.text && opt.text.trim() !== '')
      : [];
    
    if (validOptions.length === 0) {
      throw new Error('At least one valid option is required');
    }
    
    // Ensure at least one option is marked as correct
    const hasCorrectAnswer = validOptions.some(opt => opt.isCorrect === true);
    if (!hasCorrectAnswer) {
      throw new Error('At least one option must be marked as correct');
    }
    
    // Appwrite array attributes expect string elements, so stringify each option
    const optionsAsStrings = validOptions.map(opt => JSON.stringify(opt));
    
    const question = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.QUESTIONS,
      ID.unique(),
      {
        topic_id,
        book_id,
        question_text,
        question_type,
        options: optionsAsStrings, // Array of JSON strings
        points,
        difficulty,
        explanation,
        created_by: userId,
      }
    );
    
    return question;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
}

/**
 * Update a question
 * @param {string} questionId - Question ID
 * @param {Object} questionData - Updated question data
 * @returns {Promise<Object>} - Updated question
 */
export async function updateQuestion(questionId, questionData) {
  try {
    const updateData = {};
    
    if (questionData.question_text !== undefined) {
      updateData.question_text = questionData.question_text;
    }
    if (questionData.question_type !== undefined) {
      updateData.question_type = questionData.question_type;
    }
    if (questionData.options !== undefined) {
      // Ensure options is an array and filter out empty options
      const validOptions = Array.isArray(questionData.options) 
        ? questionData.options.filter(opt => opt && opt.text && opt.text.trim() !== '')
        : [];
      
      if (validOptions.length === 0) {
        throw new Error('At least one valid option is required');
      }
      
      // Ensure at least one option is marked as correct
      const hasCorrectAnswer = validOptions.some(opt => opt.isCorrect === true);
      if (!hasCorrectAnswer) {
        throw new Error('At least one option must be marked as correct');
      }
      
      // Appwrite array attributes expect string elements, so stringify each option
      updateData.options = validOptions.map(opt => JSON.stringify(opt));
    }
    if (questionData.points !== undefined) {
      updateData.points = questionData.points;
    }
    if (questionData.difficulty !== undefined) {
      updateData.difficulty = questionData.difficulty;
    }
    if (questionData.explanation !== undefined) {
      updateData.explanation = questionData.explanation;
    }
    
    const question = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.QUESTIONS,
      questionId,
      updateData
    );
    
    return question;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
}

/**
 * Delete a question
 * @param {string} questionId - Question ID
 * @returns {Promise<void>}
 */
export async function deleteQuestion(questionId) {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.QUESTIONS,
      questionId
    );
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
}

/**
 * Parse options from array of JSON strings to array of objects
 * @param {Array|string} optionsData - Array of JSON strings or a single JSON string
 * @returns {Array} - Parsed options array
 */
export function parseOptions(optionsData) {
  try {
    if (!optionsData) {
      return [];
    }
    
    // If it's already an array
    if (Array.isArray(optionsData)) {
      if (optionsData.length === 0) {
        return [];
      }
      
      // Check if first element is a string (JSON) or object
      if (typeof optionsData[0] === 'string') {
        // Array of JSON strings - parse each
        return optionsData.map(opt => {
          try {
            return JSON.parse(opt);
          } catch (e) {
            console.error('Error parsing option:', e);
            return null;
          }
        }).filter(opt => opt !== null);
      } else if (typeof optionsData[0] === 'object' && optionsData[0] !== null) {
        // Already array of objects
        return optionsData;
      }
    }
    
    // If it's a single JSON string, parse it
    if (typeof optionsData === 'string') {
      const parsed = JSON.parse(optionsData);
      // If parsed result is an array, return it
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // If it's a single object, wrap in array
      return [parsed];
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing options:', error);
    return [];
  }
}

