// ============================================
// AllClassesView.jsx
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, BookOpen, TrendingUp, Search, Filter } from 'lucide-react';

const AllClassesView = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    caste: '',
    gender: '',
    house: '',
    rte: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data: classesData, error } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const enrichedClasses = await Promise.all(
        (classesData || []).map(async (cls) => {
          const { count: studentCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          let teacherName = 'Not Assigned';
          if (cls.teacher_id) {
            const { data: teacher } = await supabase
              .from('teachers')
              .select('name')
              .eq('clerk_user_id', cls.teacher_id)
              .single();
            
            if (teacher) teacherName = teacher.name;
          }

          const today = new Date().toISOString().split('T')[0];
          const { data: todayAttendance } = await supabase
            .from('attendance')
            .select('status')
            .eq('class_id', cls.id)
            .eq('date', today);

          const presentCount = todayAttendance?.filter(a => a.status === 'present').length || 0;
          const attendanceRate = studentCount > 0 ? ((presentCount / studentCount) * 100).toFixed(1) : 0;

          return {
            ...cls,
            studentCount: studentCount || 0,
            teacherName,
            attendanceRate
          };
        })
      );

      setClasses(enrichedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    setSearchLoading(true);

    try {
      let query = supabase
        .from('students')
        .select(
          'id, name, student_name, scholar_number, father_name, mother_name, mobile_no, parent_contact, class_id, roll_number, samagra_id, caste, gender, house, rte'
        );

      if (activeFilters.caste) {
        query = query.eq('caste', activeFilters.caste);
      }
      if (activeFilters.gender) {
        query = query.eq('gender', activeFilters.gender);
      }
      if (activeFilters.house) {
        query = query.ilike('house', activeFilters.house);
      }
      if (activeFilters.rte) {
        query = query.eq('rte', activeFilters.rte);
      }

      if (term) {
        query = query.or(
          `name.ilike.%${term}%,student_name.ilike.%${term}%,scholar_number.ilike.%${term}%,father_name.ilike.%${term}%,mother_name.ilike.%${term}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      const results = (data || []).map((student) => {
        const classInfo = classes.find((cls) => cls.id === student.class_id);
        return {
          ...student,
          class_name: classInfo ? classInfo.name : '',
          class_session: classInfo ? classInfo.session : ''
        };
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching students:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClassClick = (cls) => {
    navigate(`/principal/classes/${cls.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">All Classes</h2>
        </div>

        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, scholar number, father or mother name across all classes"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {searchLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  <span>Search Student</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Caste</label>
                <select
                  value={activeFilters.caste}
                  onChange={(e) => setActiveFilters({ ...activeFilters, caste: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="Gen">Gen</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="NA">NA</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={activeFilters.gender}
                  onChange={(e) => setActiveFilters({ ...activeFilters, gender: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="girl">girl</option>
                  <option value="boy">boy</option>
                  <option value="others">others</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">House</label>
                <input
                  type="text"
                  value={activeFilters.house}
                  onChange={(e) => setActiveFilters({ ...activeFilters, house: e.target.value })}
                  placeholder="e.g., Red, Blue"
                  className="w-full text-xs border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">RTE</label>
                <select
                  value={activeFilters.rte}
                  onChange={(e) => setActiveFilters({ ...activeFilters, rte: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="yes">yes</option>
                  <option value="no">no</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-xs hover:bg-indigo-700"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilters({ caste: '', gender: '', house: '', rte: '' })}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md text-xs hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-4 max-h-72 overflow-y-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Roll</th>
                    <th className="px-2 py-1 text-left">Name</th>
                    <th className="px-2 py-1 text-left">Scholar No.</th>
                    <th className="px-2 py-1 text-left">Father</th>
                    <th className="px-2 py-1 text-left">Mother</th>
                    <th className="px-2 py-1 text-left">Mobile</th>
                    <th className="px-2 py-1 text-left">Class</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((student) => (
                    <tr key={student.id}>
                      <td className="px-2 py-1">{student.roll_number || '-'}</td>
                      <td className="px-2 py-1">{student.student_name || student.name}</td>
                      <td className="px-2 py-1">{student.scholar_number || '-'}</td>
                      <td className="px-2 py-1">{student.father_name || '-'}</td>
                      <td className="px-2 py-1">{student.mother_name || '-'}</td>
                      <td className="px-2 py-1">{student.mobile_no || student.parent_contact || '-'}</td>
                      <td className="px-2 py-1">
                        {student.class_name || '-'}
                        {student.class_session ? ` - ${student.class_session}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!searchLoading && searchTerm.trim() && searchResults.length === 0 && (
            <p className="mt-3 text-xs text-gray-500">No students found for this search.</p>
          )}
        </form>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center border border-gray-100">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Yet</h3>
          <p className="text-gray-600 text-sm sm:text-base">Classes will appear here once teachers are assigned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-xl shadow-md border border-gray-100 flex flex-col h-full"
            >
              <div className="p-5 sm:p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                      {cls.name} {cls.session && `- ${cls.session} `}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 truncate">Teacher: {cls.teacherName}</p>
                    </div>
                  <div className="bg-indigo-100 p-2 rounded-lg ml-2 flex-shrink-0">
                    <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Students</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-800">{cls.studentCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Today's Attendance</span>
                    </div>
                    <span className={`text-lg font-semibold ${
                      cls.attendanceRate >= 80 ? 'text-green-600' :
                      cls.attendanceRate >= 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {cls.attendanceRate}%
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => handleClassClick(cls)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Open Class
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 px-5 sm:px-6 py-3 rounded-b-xl border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  Created {new Date(cls.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllClassesView;
