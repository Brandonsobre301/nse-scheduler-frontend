// filepath: src/components/ProjectCalculator.js

import React, { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import type { Project, CalculatorInputs, CalculatorOutputs } from '../types/project';

/**
 * Props for ProjectCalaculator component
 * - project: current project record
 * - onProjectUpdate: callback function to handle project updates
 */
type Props = {
  project: Project;
  onProjectUpdate: (p: Project) => void;
  onOutputsChange?: (outputs: CalculatorOutputs) => void;
};




const ProjectCalculator = ({ project, onProjectUpdate, onOutputsChange }: Props) => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    totalManHours: project.totalManHours || 0,
    desiredManPower: project.desiredManPower || 1,
    efficiency: project.efficiency ?? 0.8,
    targetDurationWeeks: project.targetDurationWeeks || 0
  });

  const [outputs, setOutputs] = useState<CalculatorOutputs>({
    duration: 0,
    expendedHours: 0,
    recommendedManpower: 0
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const rawHours = Number(inputs.totalManHours) || 0;
    const manpower = Number(inputs.desiredManPower) || 0;

    let eff = Number(inputs.efficiency);
    if (isNaN(eff)) eff = 0;
    eff = Math.max(0, Math.min(1, eff));

    const targetWeeks = Number(inputs.targetDurationWeeks) || 0;

    let duration = 0;
    let expendedHours = 0;
    let recommendedManpower = 0;

    if (rawHours > 0 && manpower > 0 && eff > 0) {
      const manWeeks = rawHours / 40;
      const idealWeeks = manWeeks / manpower;
      const realisticWeeks = idealWeeks / eff;
      duration = Number.isFinite(realisticWeeks) ? Number(realisticWeeks.toFixed(2)) : 0;
      expendedHours = Math.round(duration * manpower * 40);
    }

    if (rawHours > 0 && eff > 0 && targetWeeks > 0) {
      const requiredManWeeks = rawHours / 40;
      const manpowerFloat = requiredManWeeks / (eff * targetWeeks);
      recommendedManpower = Math.max(0, Math.ceil(manpowerFloat));
    }

    setOutputs({ duration, expendedHours, recommendedManpower });
  }, [inputs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numeric = parseFloat(value);
    setInputs(prev => ({ ...prev, [name]: isNaN(numeric) ? 0 : numeric }));
  };

  const handleSave = () => {
    setIsSaving(true);
    projectAPI.updateProject(project._id, inputs)
      .then(res => {
        onProjectUpdate(res.data);
        alert('Project analysis saved!');
      })
      .catch(err => {
        console.error('Failed to save project analysis:', err);
        alert('Failed to save. Please try again.');
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">
         Project Calculator
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">Total Man-Hours Bid</label>
          <input type="number" name="totalManHours" value={inputs.totalManHours} onChange={handleChange} className="w-full p-2 border rounded" min="0" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">Desired Manpower</label>
          <input type="number" name="desiredManPower" value={inputs.desiredManPower} onChange={handleChange} className="w-full p-2 border rounded" min="0" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">Assumed Efficiency (%)</label>
          <input
            type="number"
            name="efficiency"
            value={(Math.max(0, Math.min(1, inputs.efficiency ?? 0)) * 100).toString()}
            onChange={(e) => {
              const pct = parseFloat(e.target.value);
              const clamped = isNaN(pct) ? 0 : Math.max(0, Math.min(100, pct));
              setInputs(prev => ({ ...prev, efficiency: clamped / 100 }));
            }}
            className="w-full p-2 border rounded"
            placeholder="e.g., 80"
            min="0"
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">Target Duration (weeks)</label>
          <input type="number" name="targetDurationWeeks" value={inputs.targetDurationWeeks} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g., 12" min="0" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg">
        <div>
          <h3 className="font-bold text-gray-600">Recommended Manpower</h3>
          <p className="text-2xl font-mono">{outputs.recommendedManpower} Men</p>
        </div>
        <div>
          <h3 className="font-bold text-green-600">Calculated Project Duration</h3>
          <p className="text-2xl font-mono">{outputs.duration} Weeks</p>
        </div>
        <div>
          <h3 className="font-bold text-red-600">Total Expended Man-Hours</h3>
          <p className="text-2xl font-mono">{outputs.expendedHours.toLocaleString()} Hours</p>
        </div>
      </div>

      <div className="text-right mt-4">
        <button onClick={handleSave} disabled={isSaving} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
          {isSaving ? 'Saving...' : 'Save Analysis'}
        </button>
      </div>
    </div>
  );
};

export default ProjectCalculator;