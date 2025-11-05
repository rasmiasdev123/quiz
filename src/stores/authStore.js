// Authentication store using Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCurrentUser, deleteSession } from '../services/authService.js';
import { getUser, getUserByEmail } from '../services/userService.js';

// Track ongoing initialization to prevent duplicate calls
let initializationPromise = null;

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      userProfile: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      // Actions
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          error: null 
        });
      },

      setUserProfile: (profile) => {
        set({ userProfile: profile });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      // Initialize auth state
      initializeAuth: async () => {
        // If initialization is already in progress, return the existing promise
        if (initializationPromise) {
          return initializationPromise;
        }
        
        // Check if already authenticated - no need to re-initialize
        const { isAuthenticated, user, userProfile } = get();
        if (isAuthenticated && user && userProfile) {
          return { user, userProfile };
        }
        
        // Create new initialization promise
        initializationPromise = (async () => {
          const { isLoading } = get();
          // Prevent duplicate calls if already initializing
          if (isLoading) {
            return null;
          }
          
          set({ isLoading: true, error: null });
          try {
            const user = await getCurrentUser();
            if (user) {
              // Get user profile from database
              let profile = await getUser(user.$id);
              
              // If profile not found by ID, try to get by email as fallback
              if (!profile) {
                console.warn('User profile not found by ID, trying to fetch by email:', user.email);
                try {
                  profile = await getUserByEmail(user.email);
                  if (profile) {
                    console.log('Found profile by email!', {
                      profileId: profile.$id,
                      userId: user.$id,
                      match: profile.$id === user.$id,
                    });
                    // If IDs don't match, there's a data inconsistency
                    if (profile.$id !== user.$id) {
                      console.warn('WARNING: Profile ID does not match user ID. This may cause issues.');
                      console.warn('Profile ID:', profile.$id, 'User ID:', user.$id);
                    }
                  } else {
                    console.warn('Profile not found by email either:', user.email);
                  }
                } catch (emailError) {
                  console.error('Error fetching user by email:', emailError);
                  profile = null;
                }
              }
              
              // If profile still doesn't exist, try to create one
              // This handles cases where users were created before profile system was implemented
              if (!profile && user.email && user.name) {
                console.warn('User profile missing, attempting to create default profile for:', user.email);
                try {
                  const { createUser } = await import('../services/userService.js');
                profile = await createUser({
                  user_id: user.$id,
                  email: user.email,
                  name: user.name,
                  role: 'student', // Default role for existing users without profile
                });
                console.log('Created default profile for existing user:', profile);
              } catch (createError) {
                // If document already exists (409), it means the profile exists but we can't read it
                // This is a PERMISSIONS issue - the document exists but user can't read it
                if (createError.code === 409 || createError.message?.includes('already exists')) {
                  console.warn('⚠️ CRITICAL: Profile document exists but cannot be read due to permissions.');
                  console.warn('The document exists in the database but read permission is denied.');
                  console.warn('FIX REQUIRED: Update Appwrite collection permissions:');
                  console.warn('  1. Go to Appwrite Console → Database → Collections → "users"');
                  console.warn('  2. Click on "Settings" → "Permissions"');
                  console.warn('  3. Add permission: "All users" (authenticated) → "Read"');
                  console.warn('  4. Save the permissions');
                  
                  // Try to get ALL users list (sometimes this has different permissions)
                  // If admin has access, we might be able to get the user's role this way
                  try {
                    console.log('Attempting to fetch user role via getUsers (admin access)...');
                    const { getUsers } = await import('../services/userService.js');
                    const allUsers = await getUsers();
                    const foundUser = allUsers?.documents?.find(u => u.$id === user.$id || u.email === user.email);
                    if (foundUser) {
                      console.log('Found user in users list! Using that profile:', foundUser);
                      profile = foundUser;
                    } else {
                      throw new Error('User not found in users list');
                    }
                  } catch (listError) {
                    console.warn('Could not fetch via getUsers, using fallback profile.');
                    // Create a permissions error that can be caught by the UI
                    const permissionsError = new Error(
                      'PERMISSIONS_ERROR: Your user profile exists in the database but cannot be read due to missing Appwrite permissions. ' +
                      'Please update the "users" collection permissions: Go to Appwrite Console → Database → Collections → "users" → Settings → Permissions → ' +
                      'Add "All users" (authenticated) → "Read" permission. After updating, refresh this page.'
                    );
                    permissionsError.code = 'PERMISSIONS_ERROR';
                    permissionsError.type = 'permissions_issue';
                    throw permissionsError;
                  }
                } else {
                  console.error('Failed to create default profile:', createError);
                  console.error('Create error details:', {
                    message: createError.message,
                    code: createError.code,
                    type: createError.type,
                  });
                  profile = null;
                }
              }
              }
              
              // Check if profile exists before checking is_active
              if (!profile) {
                // Profile doesn't exist - return null (will be handled by caller)
                set({ 
                  user: null, 
                userProfile: null,
                isAuthenticated: false, 
                isLoading: false,
                error: 'Failed to load user profile. Please try again.'
              });
                return null;
              }
              
              // Check if user is inactive
              const isActive = profile.is_active !== false; // Default to true if not set
              
              if (!isActive) {
                // User is inactive - don't authenticate
                try {
                  await deleteSession();
              } catch (logoutError) {
                console.error('Error logging out inactive user:', logoutError);
              }
              
              const errorMessage = 'Your account has been deactivated. Please contact admin at +91-7540892472 for assistance.';
              
              set({ 
                user: null, 
                userProfile: null,
                isAuthenticated: false, 
                isLoading: false,
                error: errorMessage
              });
              
              // Return an error object instead of null so the caller knows it's an inactive user
              return { 
                error: 'INACTIVE_USER', 
                message: errorMessage,
                user: null,
                userProfile: null
              };
              }
              
              set({ 
                user, 
                userProfile: profile,
                isAuthenticated: true, 
                isLoading: false 
              });
              return { user, userProfile: profile };
            } else {
              set({
                user: null, 
                userProfile: null,
                isAuthenticated: false, 
                isLoading: false 
              });
              return null;
              }
          } catch (error) {
            console.error('Error initializing auth:', error);
            set({ 
              user: null, 
              userProfile: null,
              isAuthenticated: false, 
              isLoading: false,
              error: error.message 
            });
            return null;
          } finally {
            // Clear the promise when done
            initializationPromise = null;
          }
        })();
        
        return initializationPromise;
      },

      // Login action
      login: async (user, profile) => {
        set({ 
          user, 
          userProfile: profile,
          isAuthenticated: true, 
          error: null 
        });
      },

      // Logout action
      logout: async () => {
        try {
          await deleteSession();
        } catch (error) {
          console.error('Error during logout:', error);
        } finally {
          set({ 
            user: null, 
            userProfile: null,
            isAuthenticated: false, 
            error: null 
          });
        }
      },

      // Update user profile
      updateProfile: (profile) => {
        set({ userProfile: profile });
      },

      // Check if user is admin
      isAdmin: () => {
        const { userProfile } = get();
        return userProfile?.role === 'admin';
      },

      // Check if user is student
      isStudent: () => {
        const { userProfile } = get();
        return userProfile?.role === 'student';
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ 
        user: state.user, 
        userProfile: state.userProfile,
        isAuthenticated: state.isAuthenticated 
      }), // Only persist these fields
    }
  )
);

export default useAuthStore;

