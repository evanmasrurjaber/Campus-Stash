import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/routing/ProtectedRoute';
import PublicOnlyRoute from './components/routing/PublicOnlyRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LandingPage from './pages/LandingPage';
import CreateEntryPage from './pages/CreateEntryPage';
import EditEntryPage from './pages/EditEntryPage';
import ProfilePage from './pages/ProfilePage';
import InboxPage from './pages/InboxPage';
import NotificationsPage from './pages/NotificationsPage';
import MarketplacePage from './pages/MarketplacePage';
import BookmarkPage from './pages/BookmarkPage';
import ItemDetailPage from './pages/ItemDetailPage';
import MyListingsPage from './pages/MyListingsPage';
import MyLostAndFoundPage from './pages/MyLostAndFoundPage';
import { NotificationProvider } from './context/NotificationContext';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <NotificationProvider userId={user?._id}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/create-entry" element={<CreateEntryPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/bookmarks" element={<BookmarkPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/my-lost-and-found" element={<MyLostAndFoundPage />} />
          <Route path="/items/:itemId" element={<ItemDetailPage />} />
          <Route path="/items/:itemId/edit" element={<EditEntryPage />} />
        </Route>

        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NotificationProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;