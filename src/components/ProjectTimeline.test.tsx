import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectTimeline from './ProjectTimeline';
import type { Project, Phase } from '../types/project';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns an ISO date string that is `days` calendar days after `base`. */
const addDays = (base: Date, days: number): string => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString();
};

const BASE = new Date('2026-01-01T00:00:00.000Z');

/** Builds a minimal valid Project. Override any field via `overrides`. */
const makeProject = (overrides: Partial<Project> = {}): Project => ({
    _id: 'proj-1',
    name: 'Test Project',
    phases: [],
    ...overrides,
});

/** Builds a single phase spanning `durationDays` days from BASE. */
const makePhase = (overrides: Partial<Phase> & { durationDays?: number } = {}): Phase => {
    const { durationDays = 14, ...rest } = overrides;
    return {
        _id: 'phase-1',
        name: 'Phase One',
        startDate: BASE.toISOString(),
        endDate: addDays(BASE, durationDays),
        status: 'SCHEDULED',
        ...rest,
    };
};

// ---------------------------------------------------------------------------
// 1. Status badge — health label
// ---------------------------------------------------------------------------

describe('ProjectTimeline — status label', () => {
    test('shows "Awaiting Schedule" when budgetedDuration is 0 (regardless of phases)', () => {
        const project = makeProject({ phases: [makePhase({ durationDays: 14 })] });
        render(<ProjectTimeline project={project} budgetedDuration={0} />);
        expect(screen.getByText('Awaiting Schedule')).toBeInTheDocument();
    });

    test('shows "No Schedule" when budgetedDuration > 0 but project has no phases', () => {
        render(<ProjectTimeline project={makeProject()} budgetedDuration={8} />);
        expect(screen.getByText('No Schedule')).toBeInTheDocument();
    });

    test('shows "On Track" when actualDuration equals budgetedDuration', () => {
        // 14 days = exactly 2 weeks → Math.ceil(14/7) = 2
        const project = makeProject({ phases: [makePhase({ durationDays: 14 })] });
        render(<ProjectTimeline project={project} budgetedDuration={2} />);
        expect(screen.getByText('On Track')).toBeInTheDocument();
    });

    test('shows "On Track" when actualDuration is less than budgetedDuration', () => {
        // 7 days = 1 week; budget = 4 weeks
        const project = makeProject({ phases: [makePhase({ durationDays: 7 })] });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        expect(screen.getByText('On Track')).toBeInTheDocument();
    });

    test('shows "Over Budget" when actualDuration exceeds budgetedDuration', () => {
        // 21 days = 3 weeks; budget = 2 weeks
        const project = makeProject({ phases: [makePhase({ durationDays: 21 })] });
        render(<ProjectTimeline project={project} budgetedDuration={2} />);
        expect(screen.getByText('Over Budget')).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// 2. Duration display — toFixed(1) formatting
// ---------------------------------------------------------------------------

describe('ProjectTimeline — duration display formatting', () => {
    test('displays budgetedDuration to exactly one decimal place (integer input)', () => {
        render(<ProjectTimeline project={makeProject()} budgetedDuration={8} />);
        expect(screen.getByText(/8\.0w planned/)).toBeInTheDocument();
    });

    test('displays budgetedDuration to one decimal place (repeating decimal input)', () => {
        // 17/3 ≈ 5.6666… → should display as "5.7"
        render(<ProjectTimeline project={makeProject()} budgetedDuration={17 / 3} />);
        expect(screen.getByText(/5\.7w planned/)).toBeInTheDocument();
    });

    test('does NOT display a long decimal for budgetedDuration', () => {
        render(<ProjectTimeline project={makeProject()} budgetedDuration={17 / 3} />);
        // A long decimal string like "5.666666" must not appear
        expect(screen.queryByText(/5\.6{3,}/)).toBeNull();
    });

    test('displays actualDuration to one decimal place (whole-week span)', () => {
        // 14 days = 2.0 weeks
        const project = makeProject({ phases: [makePhase({ durationDays: 14 })] });
        render(<ProjectTimeline project={project} budgetedDuration={5} />);
        expect(screen.getByText(/2\.0w\s*\/\s*5\.0w planned/)).toBeInTheDocument();
    });

    test('displays actualDuration as ceiling of fractional weeks, formatted to 1dp', () => {
        // 10 days → Math.ceil(10/7) = Math.ceil(1.428…) = 2 → "2.0"
        const project = makeProject({ phases: [makePhase({ durationDays: 10 })] });
        render(<ProjectTimeline project={project} budgetedDuration={3} />);
        expect(screen.getByText(/2\.0w\s*\/\s*3\.0w planned/)).toBeInTheDocument();
    });

    test('shows "0.0w" for actualDuration when there are no phases', () => {
        render(<ProjectTimeline project={makeProject()} budgetedDuration={4} />);
        expect(screen.getByText(/0\.0w\s*\/\s*4\.0w planned/)).toBeInTheDocument();
    });

    test('shows "0.0w / 0.0w planned" when both durations are zero', () => {
        render(<ProjectTimeline project={makeProject()} budgetedDuration={0} />);
        expect(screen.getByText(/0\.0w\s*\/\s*0\.0w planned/)).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// 3. Empty state
// ---------------------------------------------------------------------------

describe('ProjectTimeline — empty state', () => {
    test('renders empty-state message when project has no phases', () => {
        render(<ProjectTimeline project={makeProject()} budgetedDuration={0} />);
        expect(
            screen.getByText(/No phases have been added to the timeline yet/i)
        ).toBeInTheDocument();
    });

    test('does NOT render "Visual Timeline" heading when there are no phases', () => {
        render(<ProjectTimeline project={makeProject()} budgetedDuration={0} />);
        expect(screen.queryByText('Visual Timeline')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 4. Phase rendering
// ---------------------------------------------------------------------------

describe('ProjectTimeline — phase rendering', () => {
    test('renders the phase name', () => {
        const project = makeProject({ phases: [makePhase({ name: 'Foundation' })] });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        expect(screen.getByText('Foundation')).toBeInTheDocument();
    });

    test('renders phase status badge', () => {
        const project = makeProject({
            phases: [makePhase({ status: 'CONFIRMED' })],
        });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    });

    test('defaults phase status badge to "SCHEDULED" when status is undefined', () => {
        const phase: Phase = {
            _id: 'p1',
            name: 'Design',
            startDate: BASE.toISOString(),
            endDate: addDays(BASE, 7),
        };
        const project = makeProject({ phases: [phase] });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
    });

    test('renders phase progress percentage', () => {
        const project = makeProject({
            phases: [makePhase({ progress: 75 })],
        });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        expect(screen.getByText('75%')).toBeInTheDocument();
    });

    test('renders nothing for progress when progress is undefined', () => {
        const project = makeProject({ phases: [makePhase({ progress: undefined })] });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        // No "%" text for progress should appear
        expect(screen.queryByText(/%/)).toBeNull();
    });

    test('renders up to 3 assignees', () => {
        const project = makeProject({
            phases: [makePhase({ assignedTo: ['Alice', 'Bob', 'Carol', 'Dave'] })],
        });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        expect(screen.getByText(/Alice.*Bob.*Carol/)).toBeInTheDocument();
        expect(screen.queryByText(/Dave/)).toBeNull();
    });

    test('skips blank assignees', () => {
        const project = makeProject({
            phases: [makePhase({ assignedTo: ['Alice', '', '  ', 'Bob'] })],
        });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        // Only non-blank names should appear; at most 3 after filtering
        expect(screen.getByText(/Alice.*Bob/)).toBeInTheDocument();
    });

    test('renders the phase duration in days', () => {
        // 21-day phase → "21 days"
        const project = makeProject({ phases: [makePhase({ durationDays: 21 })] });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        expect(screen.getByText('21 days')).toBeInTheDocument();
    });

    test('renders all phases when multiple phases are provided', () => {
        const phases: Phase[] = [
            { _id: 'p1', name: 'Planning', startDate: BASE.toISOString(), endDate: addDays(BASE, 7), status: 'CONFIRMED' },
            { _id: 'p2', name: 'Execution', startDate: addDays(BASE, 7), endDate: addDays(BASE, 21), status: 'SCHEDULED' },
            { _id: 'p3', name: 'Closure', startDate: addDays(BASE, 21), endDate: addDays(BASE, 28), status: 'CONFLICT' },
        ];
        const project = makeProject({ phases });
        render(<ProjectTimeline project={project} budgetedDuration={6} />);
        expect(screen.getByText('Planning')).toBeInTheDocument();
        expect(screen.getByText('Execution')).toBeInTheDocument();
        expect(screen.getByText('Closure')).toBeInTheDocument();
    });

    test('renders CONFLICT status badge', () => {
        const project = makeProject({
            phases: [makePhase({ status: 'CONFLICT' })],
        });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        expect(screen.getByText('CONFLICT')).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// 5. Visual timeline section structure
// ---------------------------------------------------------------------------

describe('ProjectTimeline — visual timeline structure', () => {
    test('renders "Visual Timeline" heading when phases are present', () => {
        const project = makeProject({ phases: [makePhase()] });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        expect(screen.getByText('Visual Timeline')).toBeInTheDocument();
    });

    test('renders the status legend when phases are present', () => {
        const project = makeProject({ phases: [makePhase()] });
        render(<ProjectTimeline project={project} budgetedDuration={4} />);
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
        expect(screen.getByText('Scheduled')).toBeInTheDocument();
        expect(screen.getByText('Conflict')).toBeInTheDocument();
    });

    test('renders the page-level "Project Timeline" heading', () => {
        render(<ProjectTimeline project={makeProject()} budgetedDuration={0} />);
        expect(screen.getByText(/Project Timeline/i)).toBeInTheDocument();
    });
});
