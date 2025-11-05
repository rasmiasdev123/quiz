import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toast } from './components/ui'
import { useUIStore } from './stores'
import { useAuthStore } from './stores'
import { ROUTES } from './utils/constants'

// Pages
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Home from './pages/Home.jsx'

// Components
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import Books from './pages/admin/Books.jsx'
import BookForm from './pages/admin/BookForm.jsx'
import Topics from './pages/admin/Topics.jsx'
import TopicForm from './pages/admin/TopicForm.jsx'
import Questions from './pages/admin/Questions.jsx'
import QuestionForm from './pages/admin/QuestionForm.jsx'
import BulkImport from './pages/admin/BulkImport.jsx'
import Quizzes from './pages/admin/Quizzes.jsx'
import QuizForm from './pages/admin/QuizForm.jsx'
import Attempts from './pages/admin/Attempts.jsx'
import AttemptDetail from './pages/admin/AttemptDetail.jsx'
import Users from './pages/admin/Users.jsx'
import AdminChangePassword from './pages/admin/ChangePassword.jsx'

// Student Pages
import StudentLayout from './pages/student/StudentLayout.jsx'
import StudentDashboard from './pages/student/Dashboard.jsx'
import StudentQuizzes from './pages/student/Quizzes.jsx'
import QuizTaking from './pages/student/QuizTaking.jsx'
import QuizResults from './pages/student/QuizResults.jsx'
import History from './pages/student/History.jsx'
import ChangePassword from './pages/student/ChangePassword.jsx'

function App() {
  const toasts = useUIStore((state) => state.toasts)
  const removeToast = useUIStore((state) => state.removeToast)
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    // Initialize auth state on app load
    initializeAuth()
  }, [initializeAuth])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Routes - Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="books" element={<Books />} />
          <Route path="books/new" element={<BookForm />} />
          <Route path="books/:id/edit" element={<BookForm />} />
          <Route path="topics" element={<Topics />} />
          <Route path="topics/new" element={<TopicForm />} />
          <Route path="topics/:id/edit" element={<TopicForm />} />
          <Route path="questions" element={<Questions />} />
          <Route path="questions/new" element={<QuestionForm />} />
          <Route path="questions/:id/edit" element={<QuestionForm />} />
          <Route path="bulk-import" element={<BulkImport />} />
          <Route path="quizzes" element={<Quizzes />} />
          <Route path="quizzes/new" element={<QuizForm />} />
          <Route path="quizzes/:id/edit" element={<QuizForm />} />
          <Route path="attempts" element={<Attempts />} />
          <Route path="attempts/:id" element={<AttemptDetail />} />
          <Route path="users" element={<Users />} />
          <Route path="change-password" element={<AdminChangePassword />} />
        </Route>
        
        {/* Protected Routes - Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.STUDENT.DASHBOARD} replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="quizzes" element={<StudentQuizzes />} />
          <Route path="quizzes/:quizId/results" element={<QuizResults />} />
          <Route path="history" element={<History />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
        
        {/* Quiz Taking - Full Screen (No Layout) */}
        <Route
          path="/student/quizzes/:quizId/take"
          element={
            <ProtectedRoute requiredRole="student">
              <QuizTaking />
            </ProtectedRoute>
          }
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
      
      {/* Toast Container */}
      <Toast.Container toasts={toasts} onDismiss={removeToast} />
    </BrowserRouter>
  )
}

export default App

