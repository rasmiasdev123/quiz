// Calendar notes service
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { Query } from 'appwrite';
import { ID } from 'appwrite';

/**
 * Convert a JavaScript Date to Appwrite DateTime format
 * Sets time to 00:00:00 (midnight) for date-only storage
 * @param {Date} date - JavaScript Date object
 * @returns {string} - Appwrite DateTime string (ISO format)
 */
function dateToAppwriteDateTime(date) {
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj.toISOString();
}

/**
 * Get start and end of day for a given date
 * Used for querying notes on a specific date
 * @param {Date} date - JavaScript Date object
 * @returns {Object} - { start: string, end: string } ISO strings
 */
function getDateRange(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Create a new calendar note
 * @param {string} userId - User ID
 * @param {Object} noteData - Note data
 * @param {Date|string} noteData.note_date - Date for the note
 * @param {string} noteData.title - Note title
 * @param {string} noteData.content - Note content/description
 * @param {string} noteData.color - Note color (optional, default: 'blue')
 * @returns {Promise<Object>} - Created note
 */
export async function createNote(userId, noteData) {
  try {
    const { note_date, title, content = '', color = 'blue' } = noteData;
    
    if (!userId || !note_date || !title) {
      throw new Error('Missing required fields: userId, note_date, and title are required');
    }
    
    // Convert date to DateTime format with time set to 00:00:00
    const dateTimeString = dateToAppwriteDateTime(note_date);
    
    const note = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CALENDAR_NOTES,
      ID.unique(),
      {
        user_id: userId,
        note_date: dateTimeString,
        title,
        content,
        color,
      }
    );
    
    return note;
  } catch (error) {
    console.error('Error creating calendar note:', error);
    throw error;
  }
}

/**
 * Get all notes for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of notes
 */
export async function getNotesByUser(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CALENDAR_NOTES,
      [
        Query.equal('user_id', userId),
        Query.orderDesc('note_date'),
      ]
    );
    
    return response.documents || [];
  } catch (error) {
    console.error('Error fetching user notes:', error);
    throw error;
  }
}

/**
 * Get notes for a specific date
 * @param {string} userId - User ID
 * @param {Date|string} date - Date to query
 * @returns {Promise<Array>} - Array of notes for that date
 */
export async function getNotesByDate(userId, date) {
  try {
    if (!userId || !date) {
      throw new Error('User ID and date are required');
    }
    
    const { start, end } = getDateRange(new Date(date));
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CALENDAR_NOTES,
      [
        Query.equal('user_id', userId),
        Query.greaterThanEqual('note_date', start),
        Query.lessThanEqual('note_date', end),
        Query.orderAsc('note_date'),
      ]
    );
    
    return response.documents || [];
  } catch (error) {
    console.error('Error fetching notes by date:', error);
    throw error;
  }
}

/**
 * Get notes for a date range
 * @param {string} userId - User ID
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Array>} - Array of notes in the date range
 */
export async function getNotesByDateRange(userId, startDate, endDate) {
  try {
    if (!userId || !startDate || !endDate) {
      throw new Error('User ID, start date, and end date are required');
    }
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CALENDAR_NOTES,
      [
        Query.equal('user_id', userId),
        Query.greaterThanEqual('note_date', start.toISOString()),
        Query.lessThanEqual('note_date', end.toISOString()),
        Query.orderAsc('note_date'),
      ]
    );
    
    return response.documents || [];
  } catch (error) {
    console.error('Error fetching notes by date range:', error);
    throw error;
  }
}

/**
 * Get a single note by ID
 * @param {string} noteId - Note ID
 * @returns {Promise<Object>} - Note document
 */
export async function getNoteById(noteId) {
  try {
    if (!noteId) {
      throw new Error('Note ID is required');
    }
    
    const note = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.CALENDAR_NOTES,
      noteId
    );
    
    return note;
  } catch (error) {
    console.error('Error fetching note by ID:', error);
    throw error;
  }
}

/**
 * Update an existing note
 * @param {string} noteId - Note ID
 * @param {Object} noteData - Updated note data
 * @param {Date|string} noteData.note_date - Date for the note (optional)
 * @param {string} noteData.title - Note title (optional)
 * @param {string} noteData.content - Note content (optional)
 * @param {string} noteData.color - Note color (optional)
 * @returns {Promise<Object>} - Updated note
 */
export async function updateNote(noteId, noteData) {
  try {
    if (!noteId) {
      throw new Error('Note ID is required');
    }
    
    const updateData = {};
    
    if (noteData.note_date !== undefined) {
      updateData.note_date = dateToAppwriteDateTime(noteData.note_date);
    }
    if (noteData.title !== undefined) {
      updateData.title = noteData.title;
    }
    if (noteData.content !== undefined) {
      updateData.content = noteData.content;
    }
    if (noteData.color !== undefined) {
      updateData.color = noteData.color;
    }
    
    const note = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.CALENDAR_NOTES,
      noteId,
      updateData
    );
    
    return note;
  } catch (error) {
    console.error('Error updating calendar note:', error);
    throw error;
  }
}

/**
 * Delete a note
 * @param {string} noteId - Note ID
 * @returns {Promise<void>}
 */
export async function deleteNote(noteId) {
  try {
    if (!noteId) {
      throw new Error('Note ID is required');
    }
    
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.CALENDAR_NOTES,
      noteId
    );
  } catch (error) {
    console.error('Error deleting calendar note:', error);
    throw error;
  }
}

