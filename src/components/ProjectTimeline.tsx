import React, { useMemo } from 'react';
import type { Project, Phase } from '../types/project';

type Props = {
    project: Project;
    budgetedDuration: number;
};

type TimelineHealth = 'Awaiting Schedule' | 'No Schedule' | 'On Track' | 'Over Budget';

const ProjectTimeline = ({ project, budgetedDuration }: Props) => {
    const phases = useMemo(() => project.phases || [], [project.phases]);

    const actualDuration = useMemo(() => {
        if (phases.length === 0) return 0;
        const startDates = phases.map(p => new Date(p.startDate).getTime());
        const endDates = phases.map(p => new Date(p.endDate).getTime());
        const minStart = Math.min(...startDates);
        const maxEnd = Math.max(...endDates);
        return Math.ceil((maxEnd - minStart) / (1000 * 3600 * 24 * 7));
    }, [phases]);

    const status: TimelineHealth = useMemo(() => {
        if (budgetedDuration === 0) return 'Awaiting Schedule';
        if (actualDuration === 0) return 'No Schedule';
        if (actualDuration <= budgetedDuration) return 'On Track';
        return 'Over Budget';
    }, [actualDuration, budgetedDuration]);

    const statusColors: Record<TimelineHealth, string> = {
        'Awaiting Schedule': '#6b7280',
        'No Schedule': '#f59e0b',
        'On Track': '#10b981',
        'Over Budget': '#ef4444'
    };

    const phaseColors = {
        CONFIRMED: '#10b981',
        SCHEDULED: '#3b82f6',
        CONFLICT: '#ef4444'
    };

    const getPhaseDuration = (phase: Phase): number =>
        Math.ceil((new Date(phase.endDate).getTime() - new Date(phase.startDate).getTime()) / (1000 * 3600 * 24));

    return (
        <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginTop: '32px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#374151' }}>
                    🗓️ Project Timeline
                </h2>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    backgroundColor: statusColors[status],
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px'
                }}>
                    <span>{status}</span>
                    <span style={{ opacity: 0.8 }}>
                        ({actualDuration.toFixed(1)}w / {budgetedDuration.toFixed(1)}w planned)
                    </span>
                </div>
            </div>

            {phases.length > 0 ? (
                <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                        Visual Timeline
                    </h3>

                    {phases.map((phase, index) => {
                        const phaseDuration = getPhaseDuration(phase);
                        const phaseColor = phaseColors[phase.status as keyof typeof phaseColors] ?? phaseColors.SCHEDULED;
                        const assignees = phase.assignedTo?.filter(a => a && a.trim()).slice(0, 3) ?? [];

                        return (
                            <div key={phase._id ?? index} style={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '12px'
                            }}>
                                {/* Phase name, status badge, duration */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                            {phase.name}
                                        </span>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '9999px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: 'white',
                                            backgroundColor: phaseColor
                                        }}>
                                            {phase.status || 'SCHEDULED'}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                        {phaseDuration} days
                                    </span>
                                </div>

                                {/* Progress bar — visual only, no text */}
                                <div style={{
                                    height: '8px',
                                    backgroundColor: '#e5e7eb',
                                    borderRadius: '9999px',
                                    overflow: 'hidden',
                                    marginBottom: '8px'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${phase.progress ?? 0}%`,
                                        backgroundColor: phaseColor,
                                        borderRadius: '9999px',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>

                                {/* Progress %, dates, assignees — siblings so each is a unique text node */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '12px',
                                    color: '#6b7280'
                                }}>
                                    <span>
                                        {phase.progress !== undefined ? `${phase.progress}%` : ''}
                                    </span>
                                    <span>
                                        {new Date(phase.startDate).toLocaleDateString()} – {new Date(phase.endDate).toLocaleDateString()}
                                    </span>
                                    <span>{assignees.join(', ')}</span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Legend */}
                    <div style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid #d1d5db'
                    }}>
                        <h4 style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#6b7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Status Legend
                        </h4>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {([
                                { label: 'Confirmed', color: phaseColors.CONFIRMED },
                                { label: 'Scheduled', color: phaseColors.SCHEDULED },
                                { label: 'Conflict',  color: phaseColors.CONFLICT  },
                            ] as const).map(({ label, color }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        backgroundColor: color,
                                        borderRadius: '3px'
                                    }} />
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '48px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                }}>
                    <p style={{ color: '#6b7280', fontSize: '18px' }}>
                        No phases have been added to the timeline yet.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProjectTimeline;