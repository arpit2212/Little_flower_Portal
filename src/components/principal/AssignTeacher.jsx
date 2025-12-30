import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CLASSES, SECTIONS } from '../../lib/constants';
import { UserPlus, Trash2, Edit2, Check, X } from 'lucide-react';

const AssignTeacher = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    teacher_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: teachersData } = await supabase
        .from('teachers')
        .select('*')
        .order('name');

      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .order('name');

      setTeachers(teachersData || []);
      setClasses(classesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update({
            name: formData.name,
            section: formData.section,
            teacher_id: formData.teacher_id || null
          })
          .eq('id', editingClass.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('classes')
          .insert([{
            name: formData.name,
            section: formData.section,
            teacher_id: formData.teacher_id || null
          }]);

        if (error) throw error;
      }

      setFormData({ name: '', section: '', teacher_id: '' });
      setShowForm(false);
      setEditingClass(null);
      fetchData();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Error saving class. Please try again.');
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      section: cls.section || '',
      teacher_id: cls.teacher_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (classId) => {
    if (!confirm('Are you sure you want to delete this class? All students and attendance records will be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Error deleting class. Please try again.');
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.clerk_user_id === teacherId);
    return teacher ? teacher.name : 'Not Assigned';
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Assign Teachers to Classes</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingClass(null);
            setFormData({ name: '', section: '', teacher_id: '' });
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
        >
          {showForm ? <X className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          <span className="font-medium">{showForm ? 'Cancel' : 'Add New Class'}</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingClass ? 'Edit Class' : 'Add New Class'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name *
                </label>
                <select
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  required
                >
                  <option value="">Select Class</option>
                  {CLASSES.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                >
                  <option value="">Select Session</option>
                  {SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Teacher
                </label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                >
                  <option value="">No Teacher Assigned</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.clerk_user_id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingClass(null);
                  setFormData({ name: '', section: '', teacher_id: '' });
                }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium"
              >
                <Check className="w-5 h-5" />
                <span>{editingClass ? 'Update Class' : 'Create Class'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classes List - Mobile Responsive Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                   Session
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  Teacher
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                  Created
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm sm:text-base">
                    No classes created yet. Click "Add New Class" to get started.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <span className="text-sm font-semibold text-gray-900 block">{cls.name}</span>
                        <span className="text-xs text-gray-600 sm:hidden block mt-1">
                          Teacher: {getTeacherName(cls.teacher_id)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-sm text-gray-900">{cls.section || '-'}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-900">{getTeacherName(cls.teacher_id)}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">
                        {new Date(cls.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleEdit(cls)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors"
                          aria-label="Edit class"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cls.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          aria-label="Delete class"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teachers Info */}
      {teachers.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            <strong className="font-semibold">Note:</strong> No teachers found in the system. Teachers need to log in at least once to appear in the list.
          </p>
        </div>
      )}
    </div>
  );
};

export default AssignTeacher;