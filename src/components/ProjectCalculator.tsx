// filepath: src/components/ProjectCalculator.js

import React, { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import type { Project } from '../types/project';
import { useUserRole } from '../hooks/useUserRole';

// Props for project calculator
type Props = {
  project: Project;
  onProjectUpdate: (p: Project) => void;
  onOutputsChange?: (outputs: CalculatorOutputs) => void; // ✅ ADD THIS
};

// Calculation modes
type CalcMode = 'duration' | 'manpower';

// Input interfaces
interface DurationInputs {
  totalManHours: number;
  desiredManPower: number;
  efficiency: number;
}

// Input interface for Manpower mode
interface ManpowerInputs {
  totalManHours: number;
  targetDurationWeeks: number;
  efficiency: number;
}

// Output interfaces
interface DurationOutputs {
  duration: number;
  expendedHours: number;
}

// Output interface for Manpower mode
interface ManpowerOutputs {
  recommendedManpower: number;
}

// ✅ ADD THIS - Export for use in ProjectDetailPage
export interface CalculatorOutputs {
  duration: number;
  expendedHours: number;
  recommendedManpower: number;
}

// Main component of ProjectCalculator with parameters and state
const ProjectCalculator = ({ project, onProjectUpdate, onOutputsChange }: Props) => {
  const { canEdit } = useUserRole();
  
  // Mode state - defaults to 'duration'
  const [mode, setMode] = useState<CalcMode>('duration');

  // Duration mode inputs
  const [durationInputs, setDurationInputs] = useState<DurationInputs>({
    totalManHours: project.totalManHours || 0,
    desiredManPower: project.desiredManPower || 1,
    efficiency: project.efficiency ?? 0.8
  });

  // Manpower mode inputs
  const [manpowerInputs, setManpowerInputs] = useState<ManpowerInputs>({
    totalManHours: project.totalManHours || 0,
    targetDurationWeeks: project.targetDurationWeeks || 0,
    efficiency: project.efficiency ?? 0.8
  });

  const [outputs, setOutputs] = useState<CalculatorOutputs>({
    duration: 0,
    expendedHours: 0,
    recommendedManpower: 0
  });

  const [isSaving, setIsSaving] = useState(false);

  // Calculate Duration (Mode 1)
  const calculateDuration = (inputs: DurationInputs): DurationOutputs => {
    const H = Number(inputs.totalManHours) || 0;
    const M = Number(inputs.desiredManPower) || 0;
    let E = Number(inputs.efficiency);
    
    // Validate and clamp efficiency
    if (isNaN(E)) E = 0;
    E = Math.max(0, Math.min(1, E));

    // Return zeros if validation fails (silent failure)
    if (H <= 0 || M <= 0 || E <= 0) {
      return { duration: 0, expendedHours: 0 };
    }

    const MW = H / 40;                    // Man-Weeks
    const IW = MW / M;                    // Ideal Weeks
    const RD = IW / E;                    // Realistic Duration
    const EH = RD * M * 40;               // Expended Hours

    return {
      duration: Number(RD.toFixed(2)),    // 2 decimal places
      expendedHours: Math.round(EH)       // Whole number
    };
  };

  // Calculate Manpower (Mode 2)
  const calculateManpower = (inputs: ManpowerInputs): ManpowerOutputs => {
    const H = Number(inputs.totalManHours) || 0;
    const T = Number(inputs.targetDurationWeeks) || 0;
    let E = Number(inputs.efficiency);
    
    // Validate and clamp efficiency
    if (isNaN(E)) E = 0;
    E = Math.max(0, Math.min(1, E));

    // Return zero if validation fails (silent failure)
    if (H <= 0 || T <= 0 || E <= 0) {
      return { recommendedManpower: 0 };
    }

    const MW = H / 40;                    // Man-Weeks
    const EW = T * E;                     // Effective Weeks
    const MP_f = MW / EW;                 // Manpower (float)
    const RM = Math.ceil(MP_f);           // Recommended Manpower (ceiling)

    return { recommendedManpower: RM };
  };

  // Auto-calculate when inputs or mode change
  useEffect(() => {
    let newOutputs: CalculatorOutputs;

    if (mode === 'duration') {
      const durationResults = calculateDuration(durationInputs);
      newOutputs = {
        duration: durationResults.duration,
        expendedHours: durationResults.expendedHours,
        recommendedManpower: 0
      };
    } else {
      const manpowerResults = calculateManpower(manpowerInputs);
      newOutputs = {
        duration: 0,
        expendedHours: 0,
        recommendedManpower: manpowerResults.recommendedManpower
      };
    }

    setOutputs(newOutputs);
    
    // Call parent callback if provided
    if (onOutputsChange) {
      onOutputsChange(newOutputs);
    }
  }, [mode, durationInputs, manpowerInputs]); // ✅ REMOVED onOutputsChange from deps

  // Handle input changes for Duration mode
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numeric = parseFloat(value);
    setDurationInputs(prev => ({ 
      ...prev, 
      [name]: isNaN(numeric) ? 0 : Math.max(0, numeric) // Non-negative only
    }));
  };

  // Handle input changes for Manpower mode
  const handleManpowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numeric = parseFloat(value);
    setManpowerInputs(prev => ({ 
      ...prev, 
      [name]: isNaN(numeric) ? 0 : Math.max(0, numeric) // Non-negative only
    }));
  };

  // Handle efficiency change (percentage 0-100%, stored as 0.0-1.0)
  const handleEfficiencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseFloat(e.target.value);
    // Clamp to 0-100%
    const clamped = isNaN(pct) ? 0 : Math.max(0, Math.min(100, pct));
    const effValue = clamped / 100; // Convert to 0.0-1.0

    if (mode === 'duration') {
      setDurationInputs(prev => ({ ...prev, efficiency: effValue }));
    } else {
      setManpowerInputs(prev => ({ ...prev, efficiency: effValue }));
    }
  };

  // Save analysis to backend
  const handleSave = async () => {
    if (!project || !project._id) {
      console.error('No project or project ID');
      alert('Error: Cannot save. Project not loaded.');
      return;
    }
    // Prevent multiple saves
    setIsSaving(true);

    try {
      // Save based on active mode
      const updateData = mode === 'duration'
        ? {
            totalManHours: durationInputs.totalManHours,
            desiredManPower: durationInputs.desiredManPower,
            efficiency: durationInputs.efficiency
          }
        : {
            totalManHours: manpowerInputs.totalManHours,
            targetDurationWeeks: manpowerInputs.targetDurationWeeks,
            efficiency: manpowerInputs.efficiency
          };

      // Call API to update project    
      const res = await projectAPI.updateProject(project._id, updateData);
      onProjectUpdate(res.data);
      alert('Project analysis saved successfully!');
    } catch (err) {
      console.error('Failed to save project analysis:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Determine current efficiency for display
  const currentEfficiency = mode === 'duration' 
    ? durationInputs.efficiency 
    : manpowerInputs.efficiency;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">
        Man-Hour Calculator
      </h2>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-4 gap-2">
        <button
          onClick={() => setMode('duration')}
          disabled={!canEdit}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            mode === 'duration'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
           Calculate Duration
        </button>
        <button
          onClick={() => setMode('manpower')}
          disabled={!canEdit}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            mode === 'manpower'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
           Calculate Manpower
        </button>
      </div>

      {/* Mode Description Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-sm text-gray-700">
          {mode === 'duration' 
            ? ' Project duration given crew size.'
            : ' Needed man power based on duration & efficiency.'}
        </p>
      </div>

      {/* Inputs Grid - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Man-Hours Budgeted - Always visible */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">
            Total Man-Hours Budgeted
          </label>
          <input
            type="number"
            name="totalManHours"
            value={mode === 'duration' ? durationInputs.totalManHours : manpowerInputs.totalManHours}
            onChange={mode === 'duration' ? handleDurationChange : handleManpowerChange}
            disabled={!canEdit}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            min="0"
            step="1"
            placeholder="e.g., 2000"
            style={{ opacity: canEdit ? 1 : 0.6 }}
          />
        </div>

        {/* Conditional Input: Desired Manpower OR Target Duration */}
        {mode === 'duration' ? (
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">
              Desired Manpower
            </label>
            <input
              type="number"
              name="desiredManPower"
              value={durationInputs.desiredManPower}
              onChange={handleDurationChange}
              disabled={!canEdit}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              min="1"
              step="1"
              placeholder="e.g., 5"
              style={{ opacity: canEdit ? 1 : 0.6 }}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">
              Target Duration (weeks)
            </label>
            <input
              type="number"
              name="targetDurationWeeks"
              value={manpowerInputs.targetDurationWeeks}
              onChange={handleManpowerChange}
              disabled={!canEdit}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              min="0"
              step="0.1"
              placeholder="e.g., 12"
              style={{ opacity: canEdit ? 1 : 0.6 }}
            />
          </div>
        )}

        {/* Assumed Efficiency - Always visible */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">
            Assumed Efficiency (%)
          </label>
          <input
            type="number"
            value={Math.round(currentEfficiency * 100)}
            onChange={handleEfficiencyChange}
            disabled={!canEdit}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="e.g., 80"
            min="0"
            max="100"
            step="1"
            style={{ opacity: canEdit ? 1 : 0.6 }}
          />
        </div>
      </div>

      {/* Outputs */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Results</h3>
        
        {mode === 'duration' ? (
          /* Duration Mode Outputs - 2-card grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold text-green-600 mb-2"> Calculated Duration</h4>
              <p className="text-3xl font-mono text-gray-800">
                {outputs.duration} <span className="text-lg text-gray-600">weeks</span>
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold text-red-600 mb-2">⏱ Total Expended Hours</h4>
              <p className="text-3xl font-mono text-gray-800">
                {outputs.expendedHours.toLocaleString()} <span className="text-lg text-gray-600">hrs</span>
              </p>
            </div>
          </div>
        ) : (
          /* Manpower Mode Output - Single card */
          <div className="bg-white p-4 rounded-lg shadow max-w-md">
            <h4 className="font-bold text-blue-600 mb-2"> Recommended Manpower</h4>
            <p className="text-3xl font-mono text-gray-800">
              {outputs.recommendedManpower} <span className="text-lg text-gray-600">workers minimum</span>
            </p>
          </div>
        )}
      </div>

      {/* Save Button - Hidden for viewers */}
      {canEdit && (
        <div className="text-right mt-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Analysis'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectCalculator;