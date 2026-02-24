import React, { useState, useEffect } from 'react';
import type { Project, ProjectStatus } from '../types/project';

interface ProjectFormProps {
  project?: Project | null; // null = create mode, Project = edit mode
  onSubmit: (data: Partial<Project>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS: ProjectStatus[] = [
  'Awaiting Schedule',
  'No Schedule',
  'On Track',
  'Over Budget',
  'CONFIRMED',
  'SCHEDULED',
  'CONFLICT'
];

const ProjectForm: React.FC<ProjectFormProps> = ({ 
  project, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const isEditMode = !!project;

  const [formData, setFormData] = useState({
    name: '',
    manager: '',
    projectNumber: '',
    status: 'Awaiting Schedule' as ProjectStatus,
    scope: '',
    totalManHours: 0,
    desiredManPower: 1,
    efficiency: 0.8,
    targetDurationWeeks: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        manager: project.manager || '',
        projectNumber: project.projectNumber || '',
        status: project.status || 'Awaiting Schedule',
        scope: project.scope || '',
        totalManHours: project.totalManHours || 0,
        desiredManPower: project.desiredManPower || 1,
        efficiency: project.efficiency || 0.8,
        targetDurationWeeks: project.targetDurationWeeks || 0
      });
    }
  }, [project]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.manager.trim()) {
      newErrors.manager = 'Manager/Foreman name is required';
    }

    if (formData.totalManHours < 0) {
      newErrors.totalManHours = 'Man hours cannot be negative';
    }

    if (formData.desiredManPower < 1) {
      newErrors.desiredManPower = 'Manpower must be at least 1';
    }

    if (formData.efficiency < 0 || formData.efficiency > 1) {
      newErrors.efficiency = 'Efficiency must be between 0 and 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">
        {isEditMode ? 'Edit Project' : 'Create New Project'}
      </h2>

      {/* Basic Info Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Downtown Office Renovation"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Manager/Foreman */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manager/Foreman <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="manager"
              value={formData.manager}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                errors.manager ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., John Smith"
            />
            {errors.manager && (
              <p className="text-red-500 text-sm mt-1">{errors.manager}</p>
            )}
          </div>

          {/* Project Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Number
            </label>
            <input
              type="text"
              name="projectNumber"
              value={formData.projectNumber}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., PRJ-2024-001"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scope */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Scope
          </label>
          <textarea
            name="scope"
            value={formData.scope}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the project scope..."
          />
        </div>
      </div>

      {/* Calculator Inputs Section */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
           Man-Hour Calculator Inputs
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Man Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Man-Hours Budgeted
            </label>
            <input
              type="number"
              name="totalManHours"
              value={formData.totalManHours}
              onChange={handleChange}
              min="0"
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                errors.totalManHours ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 2000"
            />
            {errors.totalManHours && (
              <p className="text-red-500 text-sm mt-1">{errors.totalManHours}</p>
            )}
          </div>

          {/* Desired Manpower */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desired Manpower
            </label>
            <input
              type="number"
              name="desiredManPower"
              value={formData.desiredManPower}
              onChange={handleChange}
              min="1"
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                errors.desiredManPower ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 5"
            />
            {errors.desiredManPower && (
              <p className="text-red-500 text-sm mt-1">{errors.desiredManPower}</p>
            )}
          </div>

          {/* Efficiency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Efficiency (0-100%)
            </label>
            <input
              type="number"
              name="efficiency"
              value={Math.round(formData.efficiency * 100)}
              onChange={(e) => {
                const pct = parseFloat(e.target.value) || 0;
                const clamped = Math.max(0, Math.min(100, pct));
                setFormData(prev => ({ ...prev, efficiency: clamped / 100 }));
              }}
              min="0"
              max="100"
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                errors.efficiency ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 80"
            />
            {errors.efficiency && (
              <p className="text-red-500 text-sm mt-1">{errors.efficiency}</p>
            )}
          </div>

          {/* Target Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Duration (weeks)
            </label>
            <input
              type="number"
              name="targetDurationWeeks"
              value={formData.targetDurationWeeks}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 12"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : isEditMode ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;