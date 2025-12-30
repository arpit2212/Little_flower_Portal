
import { Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardCheck, FileText, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Dashboard from '../components/teacher/Dashboard';
import StudentManagement from '../components/teacher/StudentManagement';
import AttendanceMarking from '../components/teacher/AttendanceMarking';
import AttendanceReport from '../components/common/AttendanceReport';

const TeacherDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '', icon: LayoutDashboard, label: 'Dashboard' },
    { path: 'students', icon: Users, label: 'Manage Students' },
    { path: 'attendance', icon: ClipboardCheck, label: 'Mark Attendance' },
    { path: 'reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
        <Navbar />
        
        <div className="flex w-full">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64 bg-white shadow-lg
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            min-h-[calc(100vh-4rem)] mt-16 lg:mt-0
          `}>
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={`/teacher/${item.path}`}
                  end={item.path === ''}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 shadow-sm font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Main Content - Full Width */}
          <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
            <div className="w-full">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<StudentManagement />} />
                <Route path="/attendance" element={<AttendanceMarking />} />
                <Route path="/reports" element={<AttendanceReport role="teacher" />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TeacherDashboard;