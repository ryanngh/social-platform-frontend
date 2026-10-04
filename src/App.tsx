import { AccountSettingsPage, PrivacySettingsPage, ForgotPasswordPage, AccountRecoveryPage } from './pages/AccountSettingsPages';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PresenceProvider } from './contexts/PresenceContext';
import { CallProvider } from './contexts/CallContext';
import { ChatProvider } from './contexts/ChatContext';
import { DockedChatProvider } from './contexts/DockedChatContext';
import CallContainer from './components/call/CallContainer';
import DockedChatContainer from './components/chat/DockedChatContainer';

import MainLayout from './components/layouts/MainLayout';
import FeedPage from './pages/FeedPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import PostDetailPage from './pages/PostDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import ExplorePage from './pages/ExplorePage';
import MessagesPage from './pages/MessagesPage';
import StoragePage from './pages/StoragePage';
import MarketplacePage from './pages/MarketplacePage';
import SavedPage from './pages/SavedPage';
import SearchPage from './pages/SearchPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

import BrandLoadingScreen from './components/common/BrandLoadingScreen';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <BrandLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

const ProfileRouteWrapper = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <BrandLoadingScreen />;
  }
  if (user?.username) {
    return <Navigate to={`/${user.username}`} replace />;
  }
  return <Navigate to="/feed" replace />;
};

const ProfileIdentifierRedirect = () => {
  const { identifier } = useParams<{ identifier: string }>();
  return <Navigate to={identifier ? `/${identifier}` : '/feed'} replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <NotificationProvider>
                <PresenceProvider>
                  <CallProvider>
                    <ChatProvider>
                      <DockedChatProvider>
                        <Toaster
                          position="bottom-right"
                          toastOptions={{
                            className: 'dark:!bg-[#262626] dark:!text-[#F5F5F5] dark:!border dark:!border-[#363636]',
                          }}
                        />
                        <CallContainer />
                        <DockedChatContainer />
                        <Routes>
                          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                          <Route path="/account/recovery" element={<AccountRecoveryPage />} />
                          <Route path="/signin" element={<SignInPage />} />
                          <Route path="/signup" element={<SignUpPage />} />

                          {/* Main App Layout Routes */}
                          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                            <Route path="/settings/account" element={<AccountSettingsPage />} />
                            <Route path="/settings/privacy" element={<PrivacySettingsPage />} />
                            <Route path="/feed" element={<FeedPage />} />
                            <Route path="/trending" element={<FeedPage defaultTab="trending" />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/explore" element={<ExplorePage />} />
                            <Route path="/messages" element={<MessagesPage />} />
                            <Route path="/messages/:chatId" element={<MessagesPage />} />
                            <Route path="/drive" element={<StoragePage />} />
                            <Route path="/storage" element={<StoragePage />} />
                            <Route path="/marketplace" element={<MarketplacePage />} />
                            <Route path="/marketplace/:itemId" element={<MarketplacePage />} />
                            <Route path="/saved" element={<SavedPage />} />
                            <Route path="/posts/:postId" element={<PostDetailPage />} />
                            <Route path="/search" element={<SearchPage />} />
                            <Route path="/" element={<Navigate to="/feed" replace />} />
                          </Route>

                          {/* Backward compatibility for /profile */}
                          <Route path="/profile" element={<ProtectedRoute><ProfileRouteWrapper /></ProtectedRoute>} />
                          <Route path="/profile/:identifier" element={<ProtectedRoute><ProfileIdentifierRedirect /></ProtectedRoute>} />

                          {/* Root parameter profile route */}
                          <Route path="/:identifier" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                          <Route path="*" element={<Navigate to="/feed" replace />} />
                        </Routes>
                      </DockedChatProvider>
                    </ChatProvider>
                  </CallProvider>
                </PresenceProvider>
              </NotificationProvider>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}


export default App;
