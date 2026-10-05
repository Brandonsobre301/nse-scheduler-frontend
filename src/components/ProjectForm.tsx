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
    desiredManpower: 1,
    efficiency: 0.8,
    targetDurationWeeks: 0,
    deadline: '',
    projectType: '',
    phases: [] as any[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [manpowerInput, setManpowerInput] = useState('1');

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
        desiredManpower: project.desiredManpower || 1,
        efficiency: project.efficiency || 0.8,
        targetDurationWeeks: project.targetDurationWeeks || 0,
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
        projectType: project.projectType || '',
        phases: project?.phases || []      
      });
      setManpowerInput(String(project.desiredManpower || 1));
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

  // -- Phase Management Functions (placeholders for now) --
  const handleAddPhase = () => {
    setFormData(prev => ({
      ...prev,
      phases: [...prev.phases, { name: '', startDate: '', endDate: '', status: 'Planning', progress: 0 }]
    }));
  };

  const handlePhaseChange = (index: number, field: string, value: any) => {
    const updatedPhases = [...formData.phases];
    updatedPhases[index] = { ...updatedPhases[index], [field]: value };
    setFormData(prev => ({ ...prev, phases: updatedPhases }));
  };

  const handleRemovePhase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phases: prev.phases.filter((_, i) => i !== index)
    }));
  }

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

    if (formData.desiredManpower <= 0) {
      newErrors.desiredManpower = 'Manpower must be greater than 0';
    }

    if (formData.efficiency < 0 || formData.efficiency > 1) {
      newErrors.efficiency = 'Efficiency must be between 0 and 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData: Partial<any> = { ...formData };

    // Normalise deadline: send ISO string if set, omit if blank
    if (submitData.deadline) {
      submitData.deadline = new Date(submitData.deadline).toISOString();
    } else {
      delete submitData.deadline;
    }

    try {
      await onSubmit(submitData);
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

          {/* Project Type — used by AI efficiency inference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Type
              <span className="ml-1 text-xs text-blue-500 font-normal">✨ improves AI estimates</span>
            </label>
            <input
              type="text"
              name="projectType"
              value={formData.projectType}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Office Tenant Improvement"
            />
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
          <div className="flex flex-col justify-end">
            <label className="block text-sm font-medium text-gray-700 mb-2 min-h-[2.5rem] flex items-end">
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
          <div className="flex flex-col justify-end">
            <label className="block text-sm font-medium text-gray-700 mb-2 min-h-[2.5rem] flex items-end">
              Desired Manpower
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={manpowerInput}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '' || /^[0-9]*\.?[0-9]*$/.test(raw)) {
                  setManpowerInput(raw);
                  const num = parseFloat(raw);
                  if (!isNaN(num) && num > 0) {
                    setFormData(prev => ({ ...prev, desiredManpower: num }));
                    if (errors.desiredManpower) setErrors(prev => ({ ...prev, desiredManpower: '' }));
                  }
                }
              }}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                errors.desiredManpower ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 5"
            />
            {errors.desiredManPower && (
              <p className="text-red-500 text-sm mt-1">{errors.desiredManpower}</p>
            )}
          </div>

          {/* Efficiency */}
          <div className="flex flex-col justify-end">
            <label className="block text-sm font-medium text-gray-700 mb-2 min-h-[2.5rem] flex items-end">
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
          <div className="flex flex-col justify-end">
            <label className="block text-sm font-medium text-gray-700 mb-2 min-h-[2.5rem] flex items-end">
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
      
      {/* Phase Builder Section*/}
      <div className="bg-green-50 p-4 rounded-lg border border-emerald-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Project Phases (Timeline Data)</h3>
          <button
           type = "button"
           onClick={handleAddPhase}
           className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition"
          >
            + Add Phase
          </button>
        </div>

        {formData.phases.length === 0 ? (
         <p className ="text-sm text-gray-500 italic text-center py-4 bg-white rounded border-dashed border-gray-300">
           No phases added yet. Add a phase to generate your Timeline.
         </p>
       ) : (
        <div className="space-y-3">
          {formData.phases.map((phase, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 bg-white p-3 rounded border border-gray-200 items-end">
              <div className="col-span-12 md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phase Name
                </label>
                <input
                  type="text" 
                  value={phase.name}
                  onChange={(e)=> handlePhaseChange(index, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Foundation"
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label> 
                <input
                  type="date"
                  value={phase.startDate ? phase.startDate.split('T')[0] : ''}
                  onChange={(e) => handlePhaseChange(index, 'startDate', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={phase.endDate ? phase.endDate.split('T')[0] : ''}
                  onChange={(e) => handlePhaseChange(index, 'endDate', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-12 md:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemovePhase(index)}
                  className="text-red-600 hover:text-red-800 transition"
                  title = "Remove Phase"
                >
                  x
                </button>
              </div>                
            </div>
          ))}
        </div>
       )}
      </div>

        {/*Deadline */}
        <div>
          <label className="block text-sm font-medium test-gray-700 mb-1">
            Deadline
        </label>
        <input
        type="date"
        name="deadline"
        value={formData.deadline}
        onChange={handleChange}
        className="w-full p-2 border border-gray-300 rounded focus ring-2 focus:ring-blue-500"
      />
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