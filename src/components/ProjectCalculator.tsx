// filepath: src/components/ProjectCalculator.tsx

import React, { useState, useEffect } from 'react';
import { projectAPI, estimateAPI } from '../services/api';
import type { Project, EstimationOutputs as ApiEstimationOutputs } from '../types/project';
import { useUserRole } from '../hooks/useUserRole';

// Props for project calculator
type Props = {
  project: Project;
  onProjectUpdate: (p: Project) => void;
  onOutputsChange?: (outputs: CalculatorOutputs) => void;
};

type CalcMode = 'duration' | 'manpower';

// Exported for ProjectDetailPage compatibility
export interface CalculatorOutputs {
  duration: number;
  expendedHours: number;
  recommendedManpower: number;
}

const SOURCE_META: Record<string, { label: string; classes: string }> = {
  agent_inferred:   { label: 'AI Inferred',     classes: 'bg-blue-100 text-blue-800' },
  provided:         { label: 'Manual Input',     classes: 'bg-gray-100 text-gray-700' },
  fallback_default: { label: 'Default Fallback', classes: 'bg-yellow-100 text-yellow-800' },
};

const ProjectCalculator = ({ project, onProjectUpdate, onOutputsChange }: Props) => {
  const { canEdit } = useUserRole();

  const [mode,         setMode]         = useState<CalcMode>('duration');
  const [useAiInfer,   setUseAiInfer]   = useState(true);
  const [isCalculating,setIsCalculating]= useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [calcError,    setCalcError]    = useState<string | null>(null);
  const [apiResult,    setApiResult]    = useState<ApiEstimationOutputs | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);

  const [durationInputs, setDurationInputs] = useState({
    totalManHours:   project.totalManHours  || 0,
    desiredManpower: project.desiredManpower || 1,
    efficiency:      project.efficiency     ?? 0.8,
  });

  const [manpowerInputs, setManpowerInputs] = useState({
    totalManHours:       project.totalManHours       || 0,
    targetDurationWeeks: project.targetDurationWeeks || 0,
    efficiency:          project.efficiency          ?? 0.8,
  });

  // Sync when project prop refreshes (e.g. after Save)
  useEffect(() => {
    setDurationInputs({
      totalManHours:   project.totalManHours  || 0,
      desiredManpower: project.desiredManpower || 1,
      efficiency:      project.efficiency     ?? 0.8,
    });
    setManpowerInputs({
      totalManHours:       project.totalManHours       || 0,
      targetDurationWeeks: project.targetDurationWeeks || 0,
      efficiency:          project.efficiency          ?? 0.8,
    });
  }, [project]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const n = parseFloat(value);
    setDurationInputs(prev => ({ ...prev, [name]: isNaN(n) ? 0 : Math.max(0, n) }));
  };

  const handleManpowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const n = parseFloat(value);
    setManpowerInputs(prev => ({ ...prev, [name]: isNaN(n) ? 0 : Math.max(0, n) }));
  };

  // Efficiency entered as % (1–200), stored as decimal
  const handleEfficiencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseFloat(e.target.value);
    const clamped = isNaN(pct) ? 0 : Math.max(0, Math.min(200, pct));
    const val = clamped / 100;
    if (mode === 'duration') {
      setDurationInputs(prev => ({ ...prev, efficiency: val }));
    } else {
      setManpowerInputs(prev => ({ ...prev, efficiency: val }));
    }
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    setCalcError(null);
    setApiResult(null);

    const totalManHours    = mode === 'duration' ? durationInputs.totalManHours : manpowerInputs.totalManHours;
    const manualEfficiency = mode === 'duration' ? durationInputs.efficiency    : manpowerInputs.efficiency;

    try {
      const res = await estimateAPI.calculate({
        projectId:       project._id,
        calculationMode: mode,
        inputs: {
          totalManHours,
          desiredManpower:     mode === 'duration' ? durationInputs.desiredManpower        : undefined,
          targetDurationWeeks: mode === 'manpower' ? manpowerInputs.targetDurationWeeks     : undefined,
          assumedEfficiency:   useAiInfer          ? undefined                              : manualEfficiency,
          projectType:         project.projectType ?? undefined,
          // manager field doubles as the site supervisor for AI inference
          supervisor:          project.manager ?? undefined,
          jobName:             project.name,
        },
      });

      const outputs = res.data.outputs;
      setApiResult(outputs);

      if (onOutputsChange) {
        onOutputsChange({
          duration:            outputs.realisticDurationWeeks ?? 0,
          expendedHours:       outputs.totalExpendedHours     ?? 0,
          recommendedManpower: outputs.recommendedManpower    ?? 0,
        });
      }
    } catch (err: any) {
      setCalcError(
        err.response?.data?.message || 'Calculation failed. Please check your inputs and try again.'
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!project?._id) return;
    setIsSaving(true);
    try {
      const updateData = mode === 'duration'
        ? { totalManHours: durationInputs.totalManHours, desiredManpower: durationInputs.desiredManpower, efficiency: durationInputs.efficiency }
        : { totalManHours: manpowerInputs.totalManHours, targetDurationWeeks: manpowerInputs.targetDurationWeeks, efficiency: manpowerInputs.efficiency };
      const res = await projectAPI.updateProject(project._id, updateData);
      onProjectUpdate(res.data);
      alert('Project analysis saved successfully!');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentEfficiency = mode === 'duration' ? durationInputs.efficiency : manpowerInputs.efficiency;
  const sourceMeta = apiResult ? (SOURCE_META[apiResult.efficiencySource] ?? SOURCE_META.provided) : null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">
        Man-Hour Calculator
      </h2>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-4 gap-2">
        {(['duration', 'manpower'] as CalcMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setApiResult(null); setCalcError(null); }}
            disabled={!canEdit}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              mode === m ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {m === 'duration' ? 'Calculate Duration' : 'Calculate Manpower'}
          </button>
        ))}
      </div>

      {/* Mode Description Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-sm text-gray-700">
          {mode === 'duration'
            ? 'Project duration given crew size.'
            : 'Needed manpower based on deadline & efficiency.'}
        </p>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        {/* Total Man-Hours */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1 min-h-[2.5rem] flex items-end">
            Total Man-Hours Budgeted
          </label>
          <input
            type="number" name="totalManHours"
            value={mode === 'duration' ? durationInputs.totalManHours : manpowerInputs.totalManHours}
            onChange={mode === 'duration' ? handleDurationChange : handleManpowerChange}
            disabled={!canEdit}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            min="1" step="0.01" placeholder="e.g., 2000"
            style={{ opacity: canEdit ? 1 : 0.6 }}
          />
        </div>

        {/* Crew size or target duration */}
        {mode === 'duration' ? (
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1 min-h-[2.5rem] flex items-end">
              Desired Manpower (Team size)
            </label>
            <input
              type="number" name="desiredManPower"
              value={durationInputs.desiredManpower}
              onChange={handleDurationChange}
              disabled={!canEdit}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              min="1" step="1" placeholder="e.g., 5"
              style={{ opacity: canEdit ? 1 : 0.6 }}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1 min-h-[2.5rem] flex items-end">
              Target Duration (weeks)
            </label>
            <input
              type="number" name="targetDurationWeeks"
              value={manpowerInputs.targetDurationWeeks}
              onChange={handleManpowerChange}
              disabled={!canEdit}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              min="0" step="0.1" placeholder="e.g., 12"
              style={{ opacity: canEdit ? 1 : 0.6 }}
            />
          </div>
        )}

        {/* Efficiency — AI toggle or manual input */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1 min-h-[2.5rem] flex items-end">
            Assumed Efficiency
          </label>

          <div className="flex rounded-lg overflow-hidden border border-gray-300 mb-2">
            <button
              type="button"
              onClick={() => setUseAiInfer(true)}
              className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
                useAiInfer ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              ✨ AI Infer
            </button>
            <button
              type="button"
              onClick={() => setUseAiInfer(false)}
              disabled={!canEdit}
              className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
                !useAiInfer ? 'bg-gray-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Manual
            </button>
          </div>

          {useAiInfer ? (
            <p className="text-xs text-blue-600 bg-blue-50 rounded p-2">
              Efficiency will be inferred from similar historical projects.
            </p>
          ) : (
            <input
              type="number"
              value={Math.round(currentEfficiency * 100)}
              onChange={handleEfficiencyChange}
              disabled={!canEdit}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="e.g., 85" min="1" max="200" step="1"
              style={{ opacity: canEdit ? 1 : 0.6 }}
            />
          )}
        </div>
      </div>

      {/* Run Estimate button */}
      {canEdit && (
        <div className="flex justify-center mb-6">
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCalculating ? 'Calculating…' : 'Run Estimate'}
          </button>
        </div>
      )}

      {/* Error */}
      {calcError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {calcError}
        </div>
      )}

      {/* Results */}
      {apiResult && (
        <div className="bg-gray-50 p-6 rounded-lg mb-4">

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Results</h3>
            {sourceMeta && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${sourceMeta.classes}`}>
                Efficiency: {(apiResult.calculatedEfficiency * 100).toFixed(0)}% — {sourceMeta.label}
              </span>
            )}
          </div>

          {mode === 'duration' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-bold text-green-600 mb-2">Calculated Duration</h4>
                <p className="text-3xl font-mono text-gray-800">
                  {apiResult.realisticDurationWeeks?.toFixed(2)}{' '}
                  <span className="text-lg text-gray-600">weeks</span>
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-bold text-red-600 mb-2">⏱ Total Expended Hours</h4>
                <p className="text-3xl font-mono text-gray-800">
                  {apiResult.totalExpendedHours?.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                  <span className="text-lg text-gray-600">hrs</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow max-w-md">
              <h4 className="font-bold text-blue-600 mb-2">Recommended Manpower</h4>
              <p className="text-3xl font-mono text-gray-800">
                {apiResult.recommendedManpower}{' '}
                <span className="text-lg text-gray-600">workers</span>
              </p>
            </div>
          )}

          {/* Warnings */}
          {apiResult.warnings?.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              {apiResult.warnings.map((w, i) => (
                <p key={i} className="text-sm text-yellow-800">⚠ {w}</p>
              ))}
            </div>
          )}

          {/* AI Evidence */}
          {apiResult.inferenceEvidence && apiResult.inferenceEvidence.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowEvidence(v => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                <span>{showEvidence ? '▼' : '▶'}</span>
                {showEvidence ? 'Hide' : 'Show'} AI Evidence
                <span className="ml-1 text-xs font-normal text-gray-500">
                  ({apiResult.inferenceMatchCount} matches,{' '}
                  {((apiResult.inferenceConfidence ?? 0) * 100).toFixed(0)}% confidence)
                </span>
              </button>

              {showEvidence && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100 text-gray-600 uppercase tracking-wide">
                      <tr>
                        <th className="px-3 py-2 text-left">Job #</th>
                        <th className="px-3 py-2 text-left">Job Name</th>
                        <th className="px-3 py-2 text-right">Actual Eff.</th>
                        <th className="px-3 py-2 text-right">Similarity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiResult.inferenceEvidence.map((ev, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 font-mono">{ev.jobNumber}</td>
                          <td className="px-3 py-2">{ev.jobName}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {(ev.actualEfficiency * 100).toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {(ev.similarityScore * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save Analysis */}
      {canEdit && (
        <div className="text-right mt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save Analysis'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectCalculator;