import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import MemberModal from '../components/MemberModal';
import { calculateAge } from '../utils/dateUtils';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [dojos, setDojos] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDojo, setFilterDojo] = useState('all');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [membersRes, dojosRes, gradesRes] = await Promise.all([
        axios.get('/api/members', { headers }),
        axios.get('/api/dojos', { headers }),
        axios.get('/api/grades', { headers })
      ]);
      
      setMembers(membersRes.data);
      setDojos(dojosRes.data);
      setGrades(gradesRes.data);
      console.log('Data loaded:', { members: membersRes.data, dojos: dojosRes.data, grades: gradesRes.data });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    const matchesDojo = filterDojo === 'all' || member.main_dojo_id === parseInt(filterDojo);
    
    return matchesSearch && matchesStatus && matchesDojo;
  });

  const getStatusBadge = (status) => {
    const classes = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${classes[status] || classes.inactive}`;
  };

  const getGradeBadge = (gradeColor, gradeName) => {
    const colorClasses = {
      white: 'bg-gray-100 text-gray-800 border-gray-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      brown: 'bg-yellow-600 text-white border-yellow-700',
      black: 'bg-gray-800 text-white border-gray-900'
    };
    return `px-2 py-1 text-xs font-medium rounded border ${colorClasses[gradeColor] || colorClasses.white}`;
  };

  const getInstructorRoleBadge = (role) => {
    const roleClasses = {
      student: 'bg-gray-100 text-gray-800 border-gray-300',
      developing_instructor: 'bg-blue-100 text-blue-800 border-blue-300',
      senior_instructor: 'bg-purple-100 text-purple-800 border-purple-300',
      main_instructor: 'bg-red-100 text-red-800 border-red-300'
    };
    const roleLabels = {
      student: 'Student',
      developing_instructor: 'Developing Instructor',
      senior_instructor: 'Senior Instructor',
      main_instructor: 'Main Instructor'
    };
    return `px-2 py-1 text-xs font-medium rounded border ${roleClasses[role] || roleClasses.student}`;
  };



  const handleAddMember = () => {
    setEditingMember(null);
    setShowMemberModal(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setShowMemberModal(true);
  };

  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to deactivate ${memberName}? This action can be reversed later.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMembers(members.map(m => 
        m.id === memberId ? { ...m, status: 'inactive' } : m
      ));
      toast.success('Member deactivated successfully');
    } catch (error) {
      toast.error('Failed to deactivate member');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            <UserGroupIcon className="inline h-8 w-8 mr-2 text-blue-600" />
            Members
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage dojo members and their information
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={handleAddMember}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Member
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Members
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dojo Location
            </label>
            <select
              value={filterDojo}
              onChange={(e) => setFilterDojo(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Locations</option>
              {dojos.map(dojo => (
                <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              <div className="font-medium">Total: {filteredMembers.length}</div>
              <div>Active: {filteredMembers.filter(m => m.status === 'active').length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredMembers.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterDojo !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first member'
                }
              </p>
            </li>
          ) : (
            filteredMembers.map((member) => (
              <li key={member.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                            {member.other_names && (
                              <span className="text-gray-500"> ({member.other_names})</span>
                            )}
                          </p>
                          <span className={getStatusBadge(member.status)}>
                            {member.status}
                          </span>
                          {member.current_grade && (
                            <span className={getGradeBadge(member.grade_color, member.current_grade)}>
                              {member.current_grade}
                            </span>
                          )}
                          {member.instructor_role && (
                            <span className={getInstructorRoleBadge(member.instructor_role)}>
                              {member.instructor_role === 'student' ? 'Student' : 
                               member.instructor_role === 'developing_instructor' ? 'Developing Instructor' :
                               member.instructor_role === 'senior_instructor' ? 'Senior Instructor' :
                               member.instructor_role === 'main_instructor' ? 'Main Instructor' : 'Student'}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>Age: {calculateAge(member.date_of_birth)}</span>
                          {member.email && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{member.email}</span>
                            </>
                          )}
                          {member.phone_number && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{member.phone_number}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-400">
                          {dojos.find(d => d.id === member.main_dojo_id)?.name && (
                            <span>📍 {dojos.find(d => d.id === member.main_dojo_id)?.name}</span>
                          )}
                          {member.guardian_name && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-orange-600">👨‍👩‍👧‍👦 Guardian: {member.guardian_name}</span>
                            </>
                          )}
                          {member.special_needs && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-purple-600">⚠️ Special Needs</span>
                            </>
                          )}
                          {!member.photo_permission && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-red-600">📷 No Photo Permission</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit member"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {member.status === 'active' && (
                        <button
                          onClick={() => handleDeleteMember(member.id, `${member.first_name} ${member.last_name}`)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Deactivate member"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {member.notes && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Notes:</strong> {member.notes}
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Member Modal */}
      {showMemberModal && (
        <MemberModal
          member={editingMember}
          dojos={dojos}
          grades={grades}
          onClose={() => setShowMemberModal(false)}
          onSave={(memberData) => {
            if (editingMember) {
              setMembers(members.map(m => m.id === memberData.id ? memberData : m));
            } else {
              setMembers([...members, memberData]);
            }
            setShowMemberModal(false);
            fetchInitialData(); // Refresh data to get updated information
          }}
        />
      )}
    </div>
  );
};

export default MembersPage;