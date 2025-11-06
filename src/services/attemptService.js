// Quiz attempt service - CRUD operations for quiz attempts
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { ID, Query } from 'appwrite';

/**
 * Get all quiz attempts
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - List of quiz attempts
 */
export async function getAttempts(options = {}) {
  try {
    const { quizId, studentId, limit = 25, offset = 0 } = options;
    
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];
    
    if (quizId) {
      queries.push(Query.equal('quiz_id', quizId));
    }
    
    if (studentId) {
      queries.push(Query.equal('student_id', studentId));
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.QUIZ_ATTEMPTS,
      queries
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching attempts:', error);
    throw error;
  }
}

/**
 * Get a single attempt by ID
 * @param {string} attemptId - Attempt ID
 * @returns {Promise<Object>} - Attempt document
 */
export async function getAttempt(attemptId) {
  try {
    const attempt = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.QUIZ_ATTEMPTS,
      attemptId
    );
    return attempt;
  } catch (error) {
    console.error('Error fetching attempt:', error);
    throw error;
  }
}

/**
 * Get attempts by quiz ID
 * @param {string} quizId - Quiz ID
 * @returns {Promise<Object>} - List of attempts
 */
export async function getAttemptsByQuiz(quizId) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.QUIZ_ATTEMPTS,
      [
        Query.equal('quiz_id', quizId),
        Query.orderDesc('$createdAt'),
      ]
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching attempts by quiz:', error);
    throw error;
  }
}

/**
 * Get attempts by student ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} - List of attempts
 */
export async function getAttemptsByStudent(studentId) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.QUIZ_ATTEMPTS,
      [
        Query.equal('student_id', studentId),
        Query.orderDesc('$createdAt'),
      ]
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching attempts by student:', error);
    throw error;
  }
}

/**
 * Create a new quiz attempt
 * @param {Object} attemptData - Attempt data
 * @param {string} attemptData.quiz_id - Quiz ID
 * @param {Array<string>} attemptData.question_ids - Array of question IDs used in this attempt (optional)
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} - Created attempt
 */
export async function createAttempt(attemptData, studentId) {
  try {
    const { quiz_id, question_ids } = attemptData;
    const now = new Date().toISOString();
    
    const attemptDataToStore = {
      quiz_id,
      student_id: studentId,
      answers: [], // Appwrite expects an array, not a string
      total_score: 0,
      points_earned: 0, // Required attribute - will be updated on completion
      total_points: 0, // Required attribute - will be updated on completion
      percentage: '0', // Appwrite expects a string, not a number
      started_at: now,
      completed_at: now, // Set to current time initially, will be updated when completed
      status: 'in_progress',
    };
    
    // Store question IDs if provided (for random question mode to track exact questions used)
    if (question_ids && Array.isArray(question_ids) && question_ids.length > 0) {
      attemptDataToStore.question_ids = question_ids;
    }
    
    const attempt = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.QUIZ_ATTEMPTS,
      ID.unique(),
      attemptDataToStore
    );
    
    return attempt;
  } catch (error) {
    console.error('Error creating attempt:', error);
    throw error;
  }
}

/**
 * Update quiz attempt with answers
 * @param {string} attemptId - Attempt ID
 * @param {Object} attemptData - Updated attempt data
 * @param {Array} attemptData.answers - Array of answers
 * @param {number} attemptData.total_score - Total score
 * @param {number} attemptData.percentage - Percentage score
 * @param {string} attemptData.status - Status (optional)
 * @returns {Promise<Object>} - Updated attempt
 */
export async function updateAttempt(attemptId, attemptData) {
  try {
    const { answers, total_score, points_earned, total_points, percentage, status, question_ids } = attemptData;
    
    const updateData = {};
    
    if (answers !== undefined) {
      // Convert answers array to JSON string for Appwrite
      // Appwrite array attribute expects string elements
      updateData.answers = answers.map(ans => JSON.stringify(ans));
    }
    if (total_score !== undefined) {
      updateData.total_score = total_score;
    }
    if (points_earned !== undefined) {
      updateData.points_earned = points_earned;
    }
    if (total_points !== undefined) {
      updateData.total_points = total_points;
    }
    if (percentage !== undefined) {
      updateData.percentage = String(percentage); // Convert to string as Appwrite expects
    }
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    // Store question IDs if provided (for random question mode to track exact questions used)
    if (question_ids !== undefined && Array.isArray(question_ids) && question_ids.length > 0) {
      updateData.question_ids = question_ids;
    }
    
    const attempt = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.QUIZ_ATTEMPTS,
      attemptId,
      updateData
    );
    
    return attempt;
  } catch (error) {
    console.error('Error updating attempt:', error);
    throw error;
  }
}

/**
 * Complete a quiz attempt
 * @param {string} attemptId - Attempt ID
 * @param {Array} answers - Array of answers
 * @param {number} pointsEarned - Points earned (scored points)
 * @param {number} totalPoints - Total points available
 * @param {number} percentage - Percentage score
 * @returns {Promise<Object>} - Updated attempt
 */
export async function completeAttempt(attemptId, answers, pointsEarned, totalPoints, percentage) {
  return updateAttempt(attemptId, {
    answers,
    points_earned: pointsEarned,
    total_points: totalPoints,
    total_score: pointsEarned, // Also store in total_score for backward compatibility
    percentage,
    status: 'completed',
  });
}

/**
 * Delete an attempt
 * @param {string} attemptId - Attempt ID
 * @returns {Promise<void>}
 */
export async function deleteAttempt(attemptId) {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.QUIZ_ATTEMPTS,
      attemptId
    );
  } catch (error) {
    console.error('Error deleting attempt:', error);
    throw error;
  }
}

/**
 * Parse answers from string to array or return array as-is
 * @param {string|Array} answersData - JSON string of answers or array of JSON strings
 * @returns {Array} - Parsed answers array
 */
export function parseAnswers(answersData) {
  // If it's already an array
  if (Array.isArray(answersData)) {
    // Check if it's an array of JSON strings (from Appwrite)
    if (answersData.length > 0 && typeof answersData[0] === 'string') {
      // Parse each JSON string
      return answersData.map(ans => {
        try {
          return JSON.parse(ans);
        } catch (error) {
          console.error('Error parsing answer:', error);
          return null;
        }
      }).filter(ans => ans !== null);
    }
    // Already an array of objects
    return answersData;
  }
  
  // If it's a single JSON string, try to parse it
  if (typeof answersData === 'string') {
    try {
      const parsed = JSON.parse(answersData);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('Error parsing answers:', error);
      return [];
    }
  }
  
  // Default to empty array
  return [];
}

