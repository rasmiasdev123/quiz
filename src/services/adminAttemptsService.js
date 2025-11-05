// Admin attempts service - Optimized queries with user data
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { Query } from 'appwrite';

/**
 * Get attempts and quizzes data for admin attempts page
 * Fetches both in parallel for better performance
 * Also fetches user emails for student display
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Attempts, quizzes, and users data
 */
export async function getAdminAttemptsData(options = {}) {
  try {
    const { quizId, studentId, limit = 100, offset = 0 } = options;
    
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

    // Fetch attempts and quizzes in parallel
    const [attemptsRes, quizzesRes] = await Promise.all([
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUIZ_ATTEMPTS,
        queries
      ),
      // Get quizzes for dropdown (only published, minimal fields)
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUIZZES,
        [
          Query.limit(1000), // Reasonable limit for dropdown
          Query.orderAsc('title'),
        ]
      ),
    ]);

    const attempts = attemptsRes?.documents || [];
    const quizzes = quizzesRes?.documents || [];

    // Get unique student IDs from attempts
    const studentIds = [...new Set(attempts.map(a => a.student_id).filter(Boolean))];
    
    // Fetch user emails for all students
    const userEmailsMap = {};
    if (studentIds.length > 0) {
      try {
        // Fetch all users and filter by student IDs
        // Note: In Appwrite, user_id in users collection is the document $id (Appwrite user ID)
        // student_id in attempts matches the document $id in users collection
        const usersRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USERS,
          [
            Query.limit(1000), // Fetch all users (adjust if needed)
          ]
        );
        
        (usersRes?.documents || []).forEach(user => {
          // The document $id is the user_id (Appwrite user ID)
          // student_id in attempts should match $id
          const userId = user.$id; // This is the Appwrite user ID
          if (studentIds.includes(userId)) {
            userEmailsMap[userId] = user.email || userId;
          }
        });
      } catch (error) {
        console.error('Error fetching user emails:', error);
        // Continue without user emails if fetch fails
      }
    }

    // Map attempts with user emails
    const attemptsWithEmails = attempts.map(attempt => {
      const email = userEmailsMap[attempt.student_id] || null;
      return {
        ...attempt,
        student_email: email,
      };
    });

    return {
      attempts: attemptsWithEmails,
      total: attemptsRes?.total || 0,
      quizzes,
    };
  } catch (error) {
    console.error('Error fetching admin attempts data:', error);
    throw error;
  }
}
