import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, useUser } from '@clerk/clerk-react';
import PrincipalDashboard from './pages/PrincipalDashboard';
import TeacherDashboard from './pages/TeacherDashboard';

function App() {
  const { isLoaded, isSignedIn, user } = useUser();

  // Show loading spinner while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in page if not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Little Flower Dashboard </h1>
            <p className="text-gray-600 text-sm sm:text-base">Sign in to continue</p>
          </div>
          <div className="flex justify-center">
            <SignIn 
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: " w-full"
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const userRole = user?.publicMetadata?.role;

  return (
    <div className="w-full">
      <Routes>
        <Route 
          path="/" 
          element={
            userRole === 'principal' ? (
              <Navigate to="/principal" replace />
            ) : userRole === 'teacher' ? (
              <Navigate to="/teacher" replace />
            ) : (
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full mx-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">No Role Assigned</h1>
                    <p className="text-gray-600 text-sm sm:text-base mb-4 leading-relaxed">
                      Your account doesn't have a role assigned yet. Please contact the administrator to assign you a role (Principal or Teacher).
                    </p>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-4 text-left">
                      <p className="text-sm text-indigo-900 mb-2 break-words">
                        <strong className="font-semibold">Logged in as:</strong> {user?.fullName || user?.firstName}
                      </p>
                      <p className="text-sm text-indigo-900 break-all">
                        <strong className="font-semibold">Email:</strong> {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          } 
        />
        <Route path="/principal/*" element={<PrincipalDashboard />} />
        <Route path="/teacher/*" element={<TeacherDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;