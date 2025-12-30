import { UserButton, useUser } from '@clerk/clerk-react';
import { GraduationCap, Menu } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">Little Flower Dashboard</h1>
              <p className="text-xs text-gray-600 capitalize">{userRole} Portal</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-base font-bold text-gray-800">Attendance</h1>
              <p className="text-xs text-gray-600 capitalize">{userRole}</p>
            </div>
          </div>
          
          {/* Desktop User Info */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right mr-3">
              <p className="text-sm font-medium text-gray-800">{user?.fullName || user?.firstName}</p>
              <p className="text-xs text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9"
                }
              }}
            />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Mobile User Info Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="px-4">
              <p className="text-sm font-semibold text-gray-800 mb-1">
                {user?.fullName || user?.firstName}
              </p>
              <p className="text-xs text-gray-600 break-all">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              <div className="mt-2 pt-2 border-t border-indigo-200">
                <p className="text-xs text-indigo-700 font-medium">
                  Role: <span className="capitalize">{userRole}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;