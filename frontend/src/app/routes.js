// app/routes.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the route table.
// Each entry: { path, element, kind, roles?, redirect? }
//   kind values:
//     'open'        — anyone can hit it (no wrapper)
//     'public-only' — wrapped in <PublicOnlyRoute> (logged-in users get bounced)
//     'protected'   — wrapped in <ProtectedRoute allowedRoles={roles}>
//     'redirect'    — renders <Navigate to={redirect} replace/>
//     'catch-all'   — used for "*" fallback
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

import { getAuthToken } from '../shared/auth/AuthUtils';

import LandingPage from '../features/landing/pages/LandingPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import UnauthorizedAccess from '../features/auth/pages/UnauthorizedAccess';

import Dashboard from '../features/dashboard/components/Dashboard';
import StudentDetailsForm from '../features/auth/pages/StudentDetailsForm';
import TeacherDetailsForm from '../features/teacher/pages/TeacherDetailsForm';
import TeacherSetupAccountPage from '../features/teacher/pages/TeacherSetupAccountPage';
import TeacherClassDashboard from '../features/teacher/pages/TeacherClassDashboard';

import TypingTest from '../features/typing-test/pages/TypingTest';
import InstructorModule from '../features/teacher/pages/InstructorModule';
import TranslationTerminal from '../features/translation-terminal/pages/TranslationTerminal';
import FallingTypingTest from '../features/falling-code/pages/FallingTypingTest';
import ChallengePage from '../features/teacher/pages/ChallengePage';
import CreateLessonModule from '../features/lessons/pages/CreateLessonModule';
import EditLessonModule from '../features/lessons/pages/EditLessonModule';
import LessonDetail from '../features/lessons/pages/LessonDetail';
import AllLessonsView from '../features/lessons/pages/AllLessonsView';

import AdminManageUsers from '../features/admin/pages/AdminManageUsers';
import SyntaxSniper from '../features/syntax-sniper/pages/SyntaxSniper';
import Game from '../features/galaxy/pages/Game';
import GalaxyMainGame from '../features/galaxy/pages/GalaxyMainGame';
import GalaxyChallengeList from '../features/galaxy/pages/GalaxyChallengeList';
import GridGame from '../features/grid-game/pages/GridGame';

import Bookworm from '../features/bookworm/pages/Bookworm';
import Quiz from '../features/quiz/pages/QuizMenu';
import CrosswordGame from '../features/quiz/pages/CrosswordGame';
import LeaderboardPage from '../features/leaderboard/pages/LeaderboardPage';
import PersonalStatsDashboard from '../features/dashboard/pages/PersonalStatsDashboard';
import ProfilePage from '../features/profile/pages/ProfilePage';

import NotFoundRedirect from './layout/NotFoundRedirect';

// Root chooser — landing page for guests, dashboard for authed users.
const RootRedirect = () => {
  if (getAuthToken()) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
};

// Nested admin routes — preserved verbatim from original App.js.
const AdminSubRoutes = () => (
  <Routes>
    <Route path="users" element={<AdminManageUsers />} />
    <Route path="*" element={<div>Admin Dashboard Home or Not Found</div>} />
  </Routes>
);

const ALL = ['ADMIN', 'TEACHER', 'STUDENT', 'USER'];
const STAFF = ['TEACHER', 'ADMIN'];
const PLAYERS = ['STUDENT', 'TEACHER', 'ADMIN'];

export const routes = [
  // Root
  { path: '/',                       element: <RootRedirect />,           kind: 'open' },

  // Public-only (redirect away if logged in)
  { path: '/login',                  element: <LoginPage />,              kind: 'public-only' },
  { path: '/register',               element: <RegisterPage />,           kind: 'public-only' },

  // Public
  { path: '/unauthorized',           element: <UnauthorizedAccess />,     kind: 'open' },
  { path: '/leaderboard',            element: <LeaderboardPage />,        kind: 'open' },

  // Protected — any logged-in role
  { path: '/dashboard',              element: <Dashboard />,              kind: 'protected', roles: ALL },
  { path: '/my-stats',               element: <PersonalStatsDashboard />, kind: 'protected', roles: ALL },
  { path: '/profile',                element: <ProfilePage />,            kind: 'protected', roles: ALL },

  // Protected — STUDENT-only setup
  { path: '/student-details-form',   element: <StudentDetailsForm />,     kind: 'protected', roles: ['STUDENT'] },

  // Protected — TEACHER-only setup
  { path: '/teacher-details-form',   element: <TeacherDetailsForm />,     kind: 'protected', roles: ['TEACHER'] },
  { path: '/teacher-setup-account',  element: <TeacherSetupAccountPage />, kind: 'protected', roles: ['TEACHER'] },

  // Protected — staff
  { path: '/teacher/class',          element: <TeacherClassDashboard />,  kind: 'protected', roles: STAFF },
  { path: '/instructor',             element: <InstructorModule />,       kind: 'protected', roles: STAFF },
  { path: '/challenges',             element: <ChallengePage />,          kind: 'protected', roles: STAFF },
  { path: '/lesson',                 element: <CreateLessonModule />,     kind: 'protected', roles: STAFF },
  { path: '/lesson/edit/:id',        element: <EditLessonModule />,       kind: 'protected', roles: STAFF },

  // Games — playable by any logged-in player
  { path: '/typingtest',             element: <TypingTest />,             kind: 'protected', roles: PLAYERS },
  { path: '/syntax-sniper',          element: <SyntaxSniper />,           kind: 'protected', roles: PLAYERS },
  { path: '/translation-terminal',   element: <TranslationTerminal />,    kind: 'protected', roles: PLAYERS },
  { path: '/fallingtypingtest',      element: <FallingTypingTest />,      kind: 'protected', roles: PLAYERS },
  { path: '/galaxy',                 element: <Game />,                   kind: 'protected', roles: PLAYERS },
  { path: '/galaxy-new',             element: <GalaxyChallengeList />,    kind: 'protected', roles: PLAYERS },
  { path: '/play/galaxy/:id',        element: <GalaxyMainGame />,         kind: 'protected', roles: PLAYERS },
  { path: '/grid',                   element: <GridGame />,               kind: 'protected', roles: PLAYERS },
  { path: '/bookworm',               element: <Bookworm />,               kind: 'protected', roles: PLAYERS },
  { path: '/quiz',                   element: <Quiz />,                   kind: 'protected', roles: PLAYERS },
  { path: '/crossword',              element: <CrosswordGame />,          kind: 'protected', roles: PLAYERS },
  { path: '/lessons/view/:id',       element: <LessonDetail />,           kind: 'protected', roles: PLAYERS },
  { path: '/lessons/all',            element: <AllLessonsView />,         kind: 'protected', roles: PLAYERS },

  // Legacy redirects
  { path: '/bug-bash',               kind: 'redirect',  redirect: '/fallingtypingtest' },
  { path: '/fallingtypingtest2',     kind: 'redirect',  redirect: '/fallingtypingtest' },

  // Admin
  { path: '/admin/*',                element: <AdminSubRoutes />,         kind: 'protected', roles: ['ADMIN'] },

  // Catch-all
  { path: '*',                       element: <NotFoundRedirect />,       kind: 'catch-all' },
];
