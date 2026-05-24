import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import NotFoundRedirect from './components/NotFoundRedirect';
import { getAuthToken } from './utils/AuthUtils';

import LandingPage from './pages/LandingPage';

const RootRedirect = () => {
  if (getAuthToken()) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
};

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedAccess from './pages/UnauthorizedAccess';

import Dashboard from './components/Dashboard';
import StudentDetailsForm from './pages/StudentDetailsForm';
import TeacherDetailsForm from './pages/TeacherDetailsForm';
import TeacherSetupAccountPage from './pages/TeacherSetupAccountPage';

import TypingTest from './pages/TypingTest';
import InstructorModule from './pages/InstructorModule';
import TranslationTerminal from './pages/TranslationTerminal';
import FallingTypingTest from './pages/FallingTypingTest';
import ChallengePage from './pages/ChallengePage';
import CreateLessonModule from './pages/CreateLessonModule';
import EditLessonModule from './pages/EditLessonModule';
import LessonDetail from './pages/LessonDetail';
import AllLessonsView from './pages/AllLessonsView';


import AdminManageUsers from './components/AdminManageUsers';
import SyntaxSniper from './pages/SyntaxSniper';
import Game from './pages/Game';
import GalaxyMainGame from './pages/GalaxyGame/GalaxyMainGame';
import GalaxyChallengeList from './pages/GalaxyGame/GalaxyChallengeList';
import GridGame from './pages/GridGame';

import Bookworm from './pages/Bookworm';
import Quiz from './pages/QuizMenu';
import CrosswordGame from './pages/CrosswordGame';
import LeaderboardPage from './pages/LeaderboardPage';


const App = () => {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* Root: redirect based on auth state */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public-only routes */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        {/* Public shared route */}
        <Route path="/unauthorized" element={<UnauthorizedAccess />} />

        {/* Protected routes by role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT', 'USER']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-details-form"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDetailsForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-details-form"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherDetailsForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-setup-account"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherSetupAccountPage />
            </ProtectedRoute>
          }
        />

        {/* Lessons & Challenges */}
        <Route
          path="/typingtest"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <TypingTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
              <InstructorModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/syntax-sniper"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <SyntaxSniper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/translation-terminal"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <TranslationTerminal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bug-bash"
          element={<Navigate to="/fallingtypingtest" replace />}
        />
        <Route
          path="/fallingtypingtest"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <FallingTypingTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fallingtypingtest2"
          element={<Navigate to="/fallingtypingtest" replace />}
        />
        <Route
          path="/galaxy"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <Game />
            </ProtectedRoute>
          }
        />

        <Route
          path="/galaxy-new"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <GalaxyChallengeList />
            </ProtectedRoute>
          }
        />

        {/* Play a specific Galaxy challenge by id */}
        <Route
          path="/play/galaxy/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <GalaxyMainGame />
            </ProtectedRoute>
          }
        />

        <Route
          path="/grid"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <GridGame />
            </ProtectedRoute>
          }
        />

        <Route
          path='/bookworm'
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <Bookworm />
            </ProtectedRoute>
          }
        />

        <Route
          path='/quiz'
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <Quiz />
            </ProtectedRoute>
          }
        />

        <Route
          path='/crossword'
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <CrosswordGame />
            </ProtectedRoute>
          }
        />

        {/* Public route - accessible to guests */}
        <Route
          path="/leaderboard"
          element={<LeaderboardPage />}
        />

        <Route
          path="/challenges"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
              <ChallengePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
              <CreateLessonModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
              <EditLessonModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lessons/view/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <LessonDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lessons/all"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <AllLessonsView />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Routes>
                <Route path="users" element={<AdminManageUsers />} />
                <Route path="*" element={<div>Admin Dashboard Home or Not Found</div>} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </Router>
  );
};

export default App;
