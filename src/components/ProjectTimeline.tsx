import React, { useMemo } from 'react';
import type { Project, Phase } from '../types/project';

type Props = {
    project: Project;
    budgetedDuration: number;
};

type TimelineHealth = 'Awaiting Schedule' | 'No Schedule' | 'On Track' | 'Over Budget';

const ProjectTimeline = ({ project, budgetedDuration }: Props) => {
    const phases = useMemo(() => project.phases || [], [project.phases]);

    // cache duration and status calculations
    const actualDuration = useMemo(() => {
        if (phases.length === 0) return 0;
        const startDates = phases.map(p => new Date(p.startDate).getTime());
        const endDates = phases.map(p => new Date(p.endDate).getTime());
        const minStart = Math.min(...startDates);
        const maxEnd = Math.max(...endDates);
        return Math.ceil((maxEnd - minStart) / (1000 * 3600 * 24 * 7));
    }, [phases]);

    // cache status calculations
    const status: TimelineHealth = useMemo(() => {
        if (budgetedDuration === 0) return 'Awaiting Schedule';
        if (actualDuration === 0) return 'No Schedule';
        if (actualDuration <= budgetedDuration) return 'On Track';
        return 'Over Budget';
    }, [actualDuration, budgetedDuration]);

    const timelineData = useMemo(() => {
        if (phases.length === 0) return null;
        
        const allDates = phases.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
        const projectStart = new Date(Math.min(...allDates.map(d => d.getTime())));
        const projectEnd = new Date(Math.max(...allDates.map(d => d.getTime())));
        const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 3600 * 24));

        return {
            projectStart,
            projectEnd,
            totalDays,
            phases: phases.map(phase => {
                const start = new Date(phase.startDate);
                const end = new Date(phase.endDate);
                const startOffset = Math.ceil((start.getTime() - projectStart.getTime()) / (1000 * 3600 * 24));
                const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
                
                return {
                    ...phase,
                    startOffset: (startOffset / totalDays) * 100,
                    width: Math.max((duration / totalDays) * 100, 8),
                    duration: duration
                };
            })
        };
    }, [phases]);

    const statusColors = {
        'Awaiting Schedule': '#6b7280',
        'No Schedule': '#f59e0b', 
        'On Track': '#10b981',
        'Over Budget': '#ef4444'
    };

    const phaseColors = {
        'CONFIRMED': '#10b981',
        'SCHEDULED': '#3b82f6',
        'CONFLICT': '#ef4444'
    };

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
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#374151'
                }}>
                    🗓️ Project Timeline
                </h2>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    backgroundColor: statusColors[status],
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px'
                }}>
                    <span>{status}</span>
                    <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                        ({actualDuration}w / {budgetedDuration}w planned)
                    </span>
                </div>
            </div>

            {/* Working Timeline Section */}
            {phases.length > 0 && timelineData ? (
                <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    <h3 style={{
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '16px'
                    }}>
                        Visual Timeline
                    </h3>

                    {timelineData.phases.map((phase, index) => (
                        <div key={phase._id ?? index} style={{ marginBottom: '24px' }}>
                            {/* Phase Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151'
                                    }}>
                                        {phase.name}
                                    </span>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '9999px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        color: 'white',
                                        backgroundColor: phaseColors[phase.status as keyof typeof phaseColors] || phaseColors.SCHEDULED
                                    }}>
                                        {phase.status || 'SCHEDULED'}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: '12px',
                                    color: '#6b7280'
                                }}>
                                    {phase.duration} days
                                </span>
                            </div>

                            {/* Timeline Bar */}
                            {/* Timeline Bar - simplified placeholder (no colored bars) */}
                            <div style={{
                                position: 'relative',
                                height: '32px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 12px',
                                color: '#374151',
                                fontSize: '12px'
                            }}>
                                {/* Progress text (keeps info but no colored fill) */}
                                <span style={{ fontWeight: 500 }}>
                                    {phase.progress !== undefined ? `${phase.progress}%` : ''}
                                </span>

                                {/* Assignees shown as text to preserve info */}
                                <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>
                                    {phase.assignedTo?.filter(a => a && a.trim()).slice(0,3).join(', ') ?? ''}
                                </div>
                            </div>

                            {/* Dates */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '12px',
                                color: '#6b7280',
                                marginTop: '4px'
                            }}>
                                {/* <span>{new Date(phase.startDate).toLocaleDateString()}</span> */}
                                {/* <span>{new Date(phase.endDate).toLocaleDateString()}</span> */}
                            </div>
                        </div>
                    ))}

                    {/* Legend (neutralized while styling is disabled) */}
                    <div style={{
                        marginTop: '24px',
                        paddingTop: '16px',
                        borderTop: '1px solid #d1d5db'
                    }}>
                        <h4 style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#6b7280',
                            marginBottom: '8px'
                        }}>
                            Status Legend (styling disabled)
                        </h4>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    backgroundColor: '#9ca3af',
                                    borderRadius: '4px'
                                }} />
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Confirmed</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    backgroundColor: '#9ca3af',
                                    borderRadius: '4px'
                                }} />
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Scheduled</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    backgroundColor: '#9ca3af',
                                    borderRadius: '4px'
                                }} />
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Conflict</span>
                            </div>
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
                    <p style={{
                        color: '#6b7280',
                        fontSize: '18px',
                        marginBottom: '16px'
                    }}>
                        No phases have been added to the timeline yet.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProjectTimeline;

// test: quick note for git demo