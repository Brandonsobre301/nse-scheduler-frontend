import React, { useMemo } from 'react';
import type {Project, Phase, ProjectStatus} from '../types/project';

// Properties passed from project detail page to render timeline
type Props ={
    project: Project;
    phases?: Phase[];
    status?: ProjectStatus;
    budgetedDuration: number;
};

// Component to get the array of phases from the project prop. If it does not exist ot is empty, return null
const ProjectTimeline = ({ project, budgetedDuration }: Props) => {
    const phases = project.phases || [];

 // Calculate how many days the project will take based on the phases' date range 
    const actualDuration = useMemo(() => {
        if (phases.length === 0) return 0;
        const startDates = phases.map(p => new Date(p.startDate).getTime());
        const endDates = phases.map (p => new Date(p.endDate).getTime());
        const minStart = Math.min(...startDates);
        const maxEnd = Math.max(...endDates);
        return Math.ceil((maxEnd - minStart) / (1000 * 3600 * 24 * 7)); // duration in weeks
    }, [phases]);

    const status = useMemo(()=> {
        if (budgetedDuration === 0) {
            return 'Awaiting Schedule';
        }
        if (actualDuration === 0) {
            return 'No Schedule';
        }
        if (actualDuration <= budgetedDuration) {
            return 'On Track';
        }
        return { status: 'Over Budget' };
    }, [actualDuration, budgetedDuration]);
return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">🗓️ Project Timeline</h2>
                <div className={`flex items-center px-4 py-2 rounded-full text-white font-bold text-sm ${status}`}>
                    <span>{typeof status === 'string' ? status : status.status}</span>
                    <span className="ml-2 font-normal opacity-80">({actualDuration}w / {budgetedDuration}w planned)</span>
                </div>
            </div>
            <div className="space-y-4 mt-4">
               {phases.length > 0 ? (
                    phases.map((phase, index) => (
                        <div key={phase._id ?? index} className="border p-4 rounded-lg bg-gray-50">
                             <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-800">{phase.name}</h3>
                                <div className="flex items-center space-x-2">
                                    {(phase.assignedTo ?? []).map((initials, i) => (
                                        <span key={`${initials}-${i}`} className="bg-gray-300 text-gray-800 text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center">
                                            {initials}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4">No phases have been added to the timeline yet.</p>
                )}
            </div>
        </div>
    );
    
};
export default ProjectTimeline;