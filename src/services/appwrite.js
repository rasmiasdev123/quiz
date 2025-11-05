// Appwrite configuration and services
import { Client, Account, Databases, Storage } from 'appwrite';

// Get environment variables
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

// Validate environment variables
if (!endpoint || !projectId || !databaseId) {
  throw new Error(
    'Missing Appwrite configuration. Please check your .env file.'
  );
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database ID
export const DATABASE_ID = databaseId;

// Collection IDs (to be set when collections are created in Appwrite)
export const COLLECTIONS = {
  USERS: 'users',
  BOOKS: 'books',
  TOPICS: 'topics',
  QUESTIONS: 'questions',
  QUIZZES: 'quizzes',
  QUIZ_ATTEMPTS: 'quiz_attempts',
};

export default client;

