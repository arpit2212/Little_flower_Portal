import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, RefreshCw } from 'lucide-react';

const TeacherLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        throw error;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching teacher logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const teacherOptions = Array.from(
    new Set(
      logs
        .map((log) => log.teacher_name || log.teacher_email || log.clerk_user_id)
        .filter(Boolean)
    )
  );

  const actionOptions = Array.from(
    new Set(
      logs
        .map((log) => log.action)
        .filter(Boolean)
    )
  );

  const filteredLogs = logs.filter((log) => {
    const lowerSearch = searchTerm.toLowerCase();
    const lowerClass = classFilter.toLowerCase();

    const matchesSearch =
      searchTerm.trim().length === 0 ||
      (log.teacher_name || '').toLowerCase().includes(lowerSearch) ||
      (log.teacher_email || '').toLowerCase().includes(lowerSearch) ||
      (log.action || '').toLowerCase().includes(lowerSearch) ||
      (log.description || '').toLowerCase().includes(lowerSearch);

    const matchesDate =
      !selectedDate ||
      (log.created_at &&
        new Date(log.created_at).toISOString().split('T')[0] === selectedDate);

    const matchesTeacher =
      !selectedTeacher ||
      (log.teacher_name || '').toLowerCase() === selectedTeacher.toLowerCase() ||
      (log.teacher_email || '').toLowerCase() === selectedTeacher.toLowerCase() ||
      (log.clerk_user_id || '').toLowerCase() === selectedTeacher.toLowerCase();

    const matchesAction =
      !selectedAction || (log.action || '') === selectedAction;

    const matchesClass =
      classFilter.trim().length === 0 ||
      (log.description || '').toLowerCase().includes(lowerClass);

    return (
      matchesSearch &&
      matchesDate &&
      matchesTeacher &&
      matchesAction &&
      matchesClass
    );
  });

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Teacher Activity Logs</h2>
          <p className="text-sm text-gray-600">
            View all important actions performed by teachers across the system.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by teacher, action, or description
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Filter className="w-4 h-4 mr-1 text-gray-400" />
              Filter by date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800 text-sm"
            />
          </div>

          <div className="flex md:justify-end">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 w-full md:w-auto">
              <p className="text-xs text-indigo-900">
                Showing{' '}
                <span className="font-semibold">
                  {filteredLogs.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold">
                  {logs.length}
                </span>{' '}
                recent log entries
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by teacher
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800 text-sm"
            >
              <option value="">All teachers</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher} value={teacher}>
                  {teacher}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by action type
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800 text-sm"
            >
              <option value="">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by class
            </label>
            <input
              type="text"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              placeholder="e.g. 5A, 8-B, Class 10"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Time
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Teacher
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Action
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-10 text-center text-gray-500 text-sm sm:text-base"
                  >
                    No logs found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const createdAt = log.created_at
                    ? new Date(log.created_at)
                    : null;
                  const dateString = createdAt
                    ? createdAt.toLocaleDateString()
                    : '';
                  const timeString = createdAt
                    ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">{dateString}</span>
                          <span className="text-gray-500">{timeString}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {log.teacher_name || 'Unknown'}
                          </span>
                          <span className="text-gray-500 break-all">
                            {log.teacher_email || log.clerk_user_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {log.action}
                          </span>
                          <span className="text-gray-500 capitalize">
                            {log.entity_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 align-top hidden lg:table-cell">
                        <div className="max-w-3xl">
                          <div className="whitespace-pre-wrap break-words">
                            {log.description || '-'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogs;
