
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import Chat from './pages/Chat';
import Community from './pages/Community';
import Configuration from './pages/Configuration';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MyTasks from './pages/MyTasks';
import Profile from './pages/Profile';
import SystemControl from './pages/SystemControl';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md w-full">
        <h2 className="text-xl font-bold text-red-500 mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-sm mb-4">We encountered an unexpected error.</p>
        <pre className="text-xs text-red-400 bg-red-950/30 p-4 rounded-lg overflow-auto text-left mb-6 max-h-32">
          {error.message}
        </pre>
        <button 
          onClick={resetErrorBoundary}
          className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" />
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                 <Route index element={<Dashboard />} />
                 <Route path="tasks" element={<MyTasks />} />
                 <Route path="admin" element={<SystemControl />} />
                 <Route path="settings" element={<Configuration />} />
                 <Route path="community" element={<Community />} />
                 <Route path="profile" element={<Profile />} />
                 <Route path="profile/:id" element={<Profile />} />
                 <Route path="chat" element={<Chat />} />
              </Route>
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
