// Authentication service
import { account } from './appwrite.js';
import { ID } from 'appwrite';
import { createUser } from './userService.js';

/**
 * Create a new user account
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name
 * @param {string} role - User role (default: 'student')
 * @returns {Promise<Object>} - Created user account and profile
 */
export async function createAccount(email, password, name, role = 'student') {
  let user = null;
  
  try {
    // Step 1: Create Appwrite account
    const userId = ID.unique();
    user = await account.create(userId, email, password, name);
    
    // Step 2: Create a session IMMEDIATELY after account creation
    // This is CRITICAL for "All users" permission to work
    // Without a session, the user is not authenticated and permission will be denied
    try {
      await account.createEmailPasswordSession(email, password);
      console.log('Session created successfully for new user');
    } catch (sessionError) {
      console.error('Error creating session after registration:', sessionError);
      // Continue anyway - session creation might fail but we can still try to create profile
      // However, this might cause permission issues
    }
    
    // Step 3: Create user profile in database - CRITICAL: Must succeed
    // Now the user is authenticated, so "All users" permission will work
    try {
      const userProfile = await createUser({
        user_id: user.$id,
        email: user.email,
        name: user.name,
        role: role,
      });
      
      console.log('User profile created successfully:', userProfile);
      
      return {
        ...user,
        profile: userProfile,
      };
    } catch (profileError) {
      console.error('Error creating user profile:', profileError);
      console.error('Profile error details:', {
        message: profileError.message,
        code: profileError.code,
        type: profileError.type,
        response: profileError.response,
      });
      
      // This is a critical error - throw it so the caller knows
      // The Appwrite account was created but profile creation failed
      throw new Error(
        `Account created but failed to save user profile. Please contact support. Error: ${profileError.message || 'Unknown error'}`
      );
    }
  } catch (error) {
    console.error('Error creating account:', error);
    // If account was created but profile failed, we still need to throw
    // so the UI can handle it appropriately
    throw error;
  }
}

/**
 * Create a session (login)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - Session object
 */
export async function createSession(email, password) {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Get current user session
 * @returns {Promise<Object>} - Current user or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    // Handle unauthenticated users silently (missing scopes, no session, etc.)
    // These are expected errors when user is not logged in
    if (error.code === 401 || 
        error.message?.includes('missing scopes') || 
        error.message?.includes('guests') ||
        error.type === 'general_unauthorized_scope') {
      // User is not authenticated - this is normal for public pages
      return null;
    }
    // Log unexpected errors
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Delete current session (logout)
 * @returns {Promise<void>}
 */
export async function deleteSession() {
  try {
    await account.deleteSession('current');
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

/**
 * Delete all sessions (logout from all devices)
 * @returns {Promise<void>}
 */
export async function deleteAllSessions() {
  try {
    await account.deleteSessions();
  } catch (error) {
    console.error('Error deleting all sessions:', error);
    throw error;
  }
}

/**
 * Update user password
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export async function updatePassword(oldPassword, newPassword) {
  try {
    await account.updatePassword(newPassword, oldPassword);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

/**
 * Send password recovery email
 * @param {string} email - User email
 * @param {string} url - Recovery URL
 * @returns {Promise<Object>}
 */
export async function createRecovery(email, url) {
  try {
    const token = await account.createRecovery(email, url);
    return token;
  } catch (error) {
    console.error('Error creating recovery:', error);
    throw error;
  }
}

/**
 * Update password using recovery token
 * @param {string} userId - User ID
 * @param {string} secret - Recovery secret
 * @param {string} newPassword - New password
 * @returns {Promise<Object>}
 */
export async function updateRecovery(userId, secret, newPassword) {
  try {
    const token = await account.updateRecovery(userId, secret, newPassword);
    return token;
  } catch (error) {
    console.error('Error updating recovery:', error);
    throw error;
  }
}
