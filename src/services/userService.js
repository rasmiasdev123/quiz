// User service - CRUD operations for user profiles
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite.js';
import { ID, Query } from 'appwrite';

/**
 * Get all users
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - List of users
 */
export async function getUsers(options = {}) {
  try {
    const { role, limit = 25, offset = 0 } = options;
    
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];
    
    if (role) {
      queries.push(Query.equal('role', role));
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      queries
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Get a single user by ID
 * @param {string} userId - User ID (Appwrite user ID)
 * @returns {Promise<Object>} - User document
 */
export async function getUser(userId) {
  try {
    // Use document ID ($id) directly since we use Appwrite user ID as document ID
    // The $id links auth and database
    const user = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      userId // This is the Appwrite user ID, which is also the document $id
    );
    
    return user;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response,
    });
    console.error('Attempted to fetch user with:', {
      userId,
      databaseId: DATABASE_ID,
      collectionId: COLLECTIONS.USERS,
    });
    
    // If document not found, return null instead of throwing
    if (error.code === 404 || error.code === 'document_not_found' || error.type === 'document_not_found') {
      console.warn(`User profile not found for ID: ${userId}`);
      // Try to fetch by email as a fallback
      console.log('Attempting to fetch by email as fallback...');
      return null;
    }
    
    // For permission errors, try to fetch by listing all users (sometimes listDocuments has different permissions)
    if (error.code === 401 || error.type === 'general_unauthorized_scope' || error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      console.error('Permission denied when fetching user by ID. Attempting alternative method...');
      console.error('This usually means the collection permissions need to be updated.');
      console.error('Required: "All users" (authenticated) should have read permission on their own documents.');
      
      // Note: Can't query by $id directly, will rely on email fallback in initializeAuth
      console.error('getDocument() failed due to permissions. The email fallback in initializeAuth will be attempted.');
      
      // Return null for permission errors - don't throw
      return null;
    }
    
    // For other errors, throw them
    throw error;
  }
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object>} - User document
 */
export async function getUserByEmail(email) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.equal('email', email)]
    );
    
    if (response.documents.length > 0) {
      return response.documents[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

/**
 * Create a new user profile
 * This should be called after creating an Appwrite account
 * @param {Object} userData - User data
 * @param {string} userData.user_id - Appwrite user ID
 * @param {string} userData.email - User email
 * @param {string} userData.name - User name
 * @param {string} userData.role - User role (default: 'student')
 * @returns {Promise<Object>} - Created user
 */
export async function createUser(userData) {
  try {
    const { user_id, email, name, role = 'student' } = userData;
    
    // Validate required fields
    if (!user_id || !email || !name) {
      throw new Error('Missing required fields: user_id, email, and name are required');
    }
    
    // Validate role
    if (role !== 'admin' && role !== 'student') {
      throw new Error(`Invalid role: ${role}. Must be 'admin' or 'student'`);
    }
    
    console.log('Creating user profile with data:', {
      user_id,
      email,
      name,
      role,
      collection: COLLECTIONS.USERS,
      database: DATABASE_ID,
    });
    
    // Use Appwrite user ID as document ID ($id)
    // Only store email, name, and role as attributes
    // The $id will be the user_id, linking auth and database
    const user = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      user_id, // This becomes the document $id
      {
        email,
        name,
        role,
      }
    );
    
    console.log('User profile created successfully:', user);
    return user;
  } catch (error) {
    console.error('Error creating user profile:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response,
    });
    
    // Provide more helpful error messages
    if (error.code === 404) {
      throw new Error('Users collection not found. Please check Appwrite database configuration.');
    } else if (error.code === 401) {
      throw new Error('Permission denied. Please check Appwrite collection permissions.');
    } else if (error.code === 409) {
      // Document already exists - this is useful information
      // It means the profile exists but we might not be able to read it
      const existsError = new Error('User profile already exists for this account.');
      existsError.code = 409;
      existsError.type = error.type;
      throw existsError;
    }
    
    throw error;
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID (Appwrite user ID or document ID)
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} - Updated user
 */
export async function updateUser(userId, userData) {
  try {
    // First, get the user to find the document ID
    let documentId = userId;
    const user = await getUser(userId);
    
    if (user && user.$id) {
      documentId = user.$id;
    }
    
    const updateData = {};
    
    if (userData.name !== undefined) updateData.name = userData.name;
    if (userData.role !== undefined) updateData.role = userData.role;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.is_active !== undefined) updateData.is_active = userData.is_active;
    
    const updatedUser = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      documentId,
      updateData
    );
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Update user role
 * @param {string} userId - User ID
 * @param {string} role - New role ('admin' or 'student')
 * @returns {Promise<Object>} - Updated user
 */
export async function updateUserRole(userId, role) {
  return updateUser(userId, { role });
}

/**
 * Delete user profile
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function deleteUser(userId) {
  try {
    // First, get the user to find the document ID
    const user = await getUser(userId);
    
    if (user && user.$id) {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        user.$id
      );
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Get users by role
 * @param {string} role - User role ('admin' or 'student')
 * @returns {Promise<Object>} - List of users
 */
export async function getUsersByRole(role) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [
        Query.equal('role', role),
        Query.orderDesc('$createdAt'),
      ]
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
}

/**
 * Check if user exists
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if user exists
 */
export async function userExists(userId) {
  try {
    const user = await getUser(userId);
    return user !== null;
  } catch (error) {
    return false;
  }
}

