import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  CameraIcon,
  ShareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import { calculateAge, validateDateOfBirth, getTodayString } from '../utils/dateUtils';

const MemberModal = ({ member, dojos, grades, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    other_names: '',
    date_of_birth: '',
    gender: '',
    address: '',
    phone_number: '',
    email: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    medical_conditions: '',
    special_needs: '',
    notes: '',
    current_grade_id: '',
    photo_permission: false,
    social_media_permission: false,
    main_dojo_id: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showGuardianSection, setShowGuardianSection] = useState(false);
  const [dateCalculationTimeout, setDateCalculationTimeout] = useState(null);

  // Initialize form data when member prop changes
  useEffect(() => {
    if (member) {
      setFormData({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        other_names: member.other_names || '',
        date_of_birth: member.date_of_birth || '',
        gender: member.gender || '',
        address: member.address || '',
        phone_number: member.phone_number || '',
        email: member.email || '',
        guardian_name: member.guardian_name || '',
        guardian_phone: member.guardian_phone || '',
        guardian_email: member.guardian_email || '',
        guardian_relationship: member.guardian_relationship || '',
        emergency_contact_name: member.emergency_contact_name || '',
        emergency_contact_phone: member.emergency_contact_phone || '',
        emergency_contact_relationship: member.emergency_contact_relationship || '',
        medical_conditions: member.medical_conditions || '',
        special_needs: member.special_needs || '',
        notes: member.notes || '',
        current_grade_id: member.current_grade_id || '',
        photo_permission: member.photo_permission || false,
        social_media_permission: member.social_media_permission || false,
        main_dojo_id: member.main_dojo_id || '',
        status: member.status || 'active'
      });
    }
  }, [member]);

  // Calculate age and determine if guardian is needed (with debounce)
  useEffect(() => {
    // Clear existing timeout
    if (dateCalculationTimeout) {
      clearTimeout(dateCalculationTimeout);
    }

    // Set a new timeout to debounce the calculation
    const timeout = setTimeout(() => {
      if (formData.date_of_birth) {
        try {
          const age = calculateAge(formData.date_of_birth);
          setShowGuardianSection(typeof age === 'number' && age < 18);
        } catch (error) {
          console.error('Error calculating age:', error);
          setShowGuardianSection(false);
        }
      } else {
        setShowGuardianSection(false);
      }
    }, 300); // 300ms debounce

    setDateCalculationTimeout(timeout);

    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [formData.date_of_birth]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (dateCalculationTimeout) {
        clearTimeout(dateCalculationTimeout);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (formData.date_of_birth) {
      const validation = validateDateOfBirth(formData.date_of_birth);
      if (!validation.isValid) {
        newErrors.date_of_birth = validation.error;
      }
    }
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.main_dojo_id) newErrors.main_dojo_id = 'Main dojo is required';

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.phone_number && !/^[\d\s\-\+\(\)]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    // Guardian validation (if under 18)
    if (showGuardianSection) {
      if (!formData.guardian_name.trim()) newErrors.guardian_name = 'Guardian name is required for members under 18';
      if (!formData.guardian_phone.trim()) newErrors.guardian_phone = 'Guardian phone is required for members under 18';
      if (!formData.guardian_relationship.trim()) newErrors.guardian_relationship = 'Guardian relationship is required';
    }

    // Emergency contact validation
    if (formData.emergency_contact_name && !formData.emergency_contact_phone) {
      newErrors.emergency_contact_phone = 'Emergency contact phone is required when name is provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!validateForm()) {
        toast.error('Please fix the errors in the form');
        return;
      }

      setLoading(true);
      
      // Validate date before submission
      if (formData.date_of_birth) {
        const testDate = new Date(formData.date_of_birth);
        if (isNaN(testDate.getTime())) {
          toast.error('Please enter a valid date of birth');
          setLoading(false);
          return;
        }
      }
      
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Clean the form data before sending
      const cleanFormData = { ...formData };
      
      let response;
      if (member) {
        // Update existing member
        response = await axios.put(`/api/members/${member.id}`, cleanFormData, { headers });
        toast.success('Member updated successfully');
      } else {
        // Create new member
        response = await axios.post('/api/members', cleanFormData, { headers });
        toast.success('Member created successfully');
      }
      
      onSave(response.data);
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save member';
      toast.error(errorMessage);
      console.error('Error saving member:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white mb-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <UserIcon className="h-8 w-8 mr-2 text-blue-600" />
            {member ? 'Edit Member' : 'Add New Member'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
              Personal Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Names
                </label>
                <input
                  type="text"
                  name="other_names"
                  value={formData.other_names}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Middle names, nicknames, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    max={getTodayString()} // Prevent future dates
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="YYYY-MM-DD"
                  />
                  <CalendarDaysIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>}
                {formData.date_of_birth && (
                  <p className="text-sm text-gray-500 mt-1">
                    Age: {(() => {
                      const age = calculateAge(formData.date_of_birth);
                      return typeof age === 'number' ? `${age} years old` : age;
                    })()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Dojo <span className="text-red-500">*</span>
                </label>
                <select
                  name="main_dojo_id"
                  value={formData.main_dojo_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.main_dojo_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select main dojo</option>
                  {dojos.map(dojo => (
                    <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
                  ))}
                </select>
                {errors.main_dojo_id && <p className="text-red-500 text-sm mt-1">{errors.main_dojo_id}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPinIcon className="inline h-4 w-4 mr-1" />
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full address"
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PhoneIcon className="h-5 w-5 mr-2 text-blue-600" />
              Contact Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Guardian Information Section (conditional) */}
          {showGuardianSection && (
            <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-400">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2 text-orange-600" />
                Guardian Information
                <span className="ml-2 text-sm text-orange-600 font-normal">(Required for members under 18)</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guardian Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="guardian_name"
                    value={formData.guardian_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.guardian_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter guardian's full name"
                  />
                  {errors.guardian_name && <p className="text-red-500 text-sm mt-1">{errors.guardian_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guardian Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="guardian_phone"
                    value={formData.guardian_phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.guardian_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter guardian's phone number"
                  />
                  {errors.guardian_phone && <p className="text-red-500 text-sm mt-1">{errors.guardian_phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guardian Email
                  </label>
                  <input
                    type="email"
                    name="guardian_email"
                    value={formData.guardian_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter guardian's email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship to Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="guardian_relationship"
                    value={formData.guardian_relationship}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.guardian_relationship ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select relationship</option>
                    <option value="parent">Parent</option>
                    <option value="legal_guardian">Legal Guardian</option>
                    <option value="grandparent">Grandparent</option>
                    <option value="aunt_uncle">Aunt/Uncle</option>
                    <option value="sibling">Sibling</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.guardian_relationship && <p className="text-red-500 text-sm mt-1">{errors.guardian_relationship}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
              Emergency Contact
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter emergency contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.emergency_contact_phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter emergency contact phone"
                />
                {errors.emergency_contact_phone && <p className="text-red-500 text-sm mt-1">{errors.emergency_contact_phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship to Member
                </label>
                <select
                  name="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select relationship</option>
                  <option value="parent">Parent</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Medical & Special Needs Section */}
          <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
              Medical Information & Special Needs
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Conditions
                </label>
                <textarea
                  name="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List any medical conditions, allergies, medications, or health concerns that instructors should be aware of..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Needs
                </label>
                <textarea
                  name="special_needs"
                  value={formData.special_needs}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe any special needs, accommodations, or considerations required for this member..."
                />
              </div>
            </div>
          </div>

          {/* Karate Information Section */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🥋 Karate Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Grade
                </label>
                <select
                  name="current_grade_id"
                  value={formData.current_grade_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select current grade</option>
                  {grades.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name} ({grade.color})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CameraIcon className="h-5 w-5 mr-2 text-purple-600" />
              Photo & Media Permissions
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="photo_permission"
                  checked={formData.photo_permission}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">
                    Permission for Photographs
                  </label>
                  <p className="text-sm text-gray-500">
                    I give permission for photographs to be taken of this member during dojo activities for internal use, promotional materials, and records.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="social_media_permission"
                  checked={formData.social_media_permission}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">
                    Permission for Social Media
                  </label>
                  <p className="text-sm text-gray-500">
                    I give permission for photos and videos of this member to be posted on the club's social media accounts (Facebook, Instagram, etc.).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
              Additional Notes
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                General Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes about this member, their goals, preferences, or other relevant information..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {member ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {member ? 'Update Member' : 'Create Member'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberModal;