// src/components/ProjectCalculator.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProjectCalculator from './ProjectCalculator';
import { projectAPI } from '../services/api';
import type { Project } from '../types/project';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Factory mocks prevent Jest from loading the real module (avoids axios ESM issue)
jest.mock('../hooks/useUserRole', () => ({ useUserRole: jest.fn() }));
jest.mock('../services/api', () => ({
  projectAPI: {
    updateProject: jest.fn(),
    getProjects: jest.fn(),
    getProject: jest.fn(),
    createProject: jest.fn(),
    deleteProject: jest.fn(),
  },
  authAPI: {
    login: jest.fn(),
    signup: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    logout: jest.fn(),
  },
}));

import { useUserRole } from '../hooks/useUserRole';
const mockUseUserRole = useUserRole as jest.MockedFunction<typeof useUserRole>;

const mockUpdateProject = projectAPI.updateProject as jest.MockedFunction<
  typeof projectAPI.updateProject
>;

// Default: editor role
const asEditor = () =>
  mockUseUserRole.mockReturnValue({ canEdit: true, isAdmin: false, isViewer: false, role: 'manager' });

const asViewer = () =>
  mockUseUserRole.mockReturnValue({ canEdit: false, isAdmin: false, isViewer: true, role: 'viewer' });

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseProject: Project = {
  _id: 'proj-1',
  name: 'Test Project',
  totalManHours: 2000,
  desiredManpower: 5,
  efficiency: 0.8,
  targetDurationWeeks: 10,
};

const renderCalc = (
  project: Project = baseProject,
  onProjectUpdate = jest.fn(),
  onOutputsChange?: jest.Mock
) =>
  render(
    <ProjectCalculator
      project={project}
      onProjectUpdate={onProjectUpdate}
      onOutputsChange={onOutputsChange}
    />
  );

// ---------------------------------------------------------------------------
// 1. Rendering — basic structure
// ---------------------------------------------------------------------------

describe('ProjectCalculator — rendering', () => {
  beforeEach(() => asEditor());

  test('renders the Man-Hour Calculator heading', () => {
    renderCalc();
    expect(screen.getByText('Man-Hour Calculator')).toBeInTheDocument();
  });

  test('renders mode toggle buttons', () => {
    renderCalc();
    expect(screen.getByText('Calculate Duration')).toBeInTheDocument();
    expect(screen.getByText('Calculate Manpower')).toBeInTheDocument();
  });

  test('renders Results section', () => {
    renderCalc();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Duration mode — default state and auto-calculation
// ---------------------------------------------------------------------------

describe('ProjectCalculator — duration mode (default)', () => {
  beforeEach(() => asEditor());

  test('shows "Desired Manpower" input in duration mode', () => {
    renderCalc();
    expect(screen.getByText(/Desired Manpower/i)).toBeInTheDocument();
  });

  test('shows "Calculated Duration" output card in duration mode', () => {
    renderCalc();
    expect(screen.getByText(/Calculated Duration/i)).toBeInTheDocument();
  });

  test('shows "Total Expended Hours" output card in duration mode', () => {
    renderCalc();
    expect(screen.getByText(/Total Expended Hours/i)).toBeInTheDocument();
  });

  test('auto-calculates duration from project props on mount (H=2000, M=5, E=0.8 → 12.50w)', () => {
    renderCalc();
    // Duration output: "12.50 weeks" — toFixed(2) in JSX
    expect(screen.getByText(/12\.50/)).toBeInTheDocument();
  });

  test('recalculates when Total Man-Hours input changes', () => {
    renderCalc();
    const hoursInput = screen.getByPlaceholderText('e.g., 2000');
    fireEvent.change(hoursInput, { target: { value: '4000' } });
    // Doubling hours doubles duration: 12.5 * 2 = 25.00w
    expect(screen.getByText(/25\.00/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. Manpower mode — switching and auto-calculation
// ---------------------------------------------------------------------------

describe('ProjectCalculator — manpower mode', () => {
  beforeEach(() => asEditor());

  test('clicking "Calculate Manpower" switches to manpower mode', () => {
    renderCalc();
    fireEvent.click(screen.getByText('Calculate Manpower'));
    expect(screen.getByText(/Target Duration/i)).toBeInTheDocument();
  });

  test('manpower mode hides "Desired Manpower" input', () => {
    renderCalc();
    fireEvent.click(screen.getByText('Calculate Manpower'));
    expect(screen.queryByText(/Desired Manpower/i)).toBeNull();
  });

  test('manpower mode shows "Recommended Manpower" output card', () => {
    renderCalc();
    fireEvent.click(screen.getByText('Calculate Manpower'));
    expect(screen.getByText(/Recommended Manpower/i)).toBeInTheDocument();
  });

  test('auto-calculates manpower from project props (H=2000, T=10, E=0.8 → 6.25 workers)', () => {
    renderCalc();
    fireEvent.click(screen.getByText('Calculate Manpower'));
    // Output: "6.25 workers"
    expect(screen.getByText(/6\.25/)).toBeInTheDocument();
  });

  test('switching back to duration mode restores duration output', () => {
    renderCalc();
    fireEvent.click(screen.getByText('Calculate Manpower'));
    fireEvent.click(screen.getByText('Calculate Duration'));
    expect(screen.getByText(/Calculated Duration/i)).toBeInTheDocument();
    expect(screen.getByText(/12\.50/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4. onOutputsChange callback
// ---------------------------------------------------------------------------

describe('ProjectCalculator — onOutputsChange callback', () => {
  beforeEach(() => asEditor());

  test('fires onOutputsChange with correct duration outputs on mount', async () => {
    const onOutputsChange = jest.fn();
    renderCalc(baseProject, jest.fn(), onOutputsChange);
    await waitFor(() =>
      expect(onOutputsChange).toHaveBeenCalledWith(
        expect.objectContaining({ duration: expect.closeTo(12.5, 2) })
      )
    );
  });

  test('fires onOutputsChange with updated values when input changes', async () => {
    const onOutputsChange = jest.fn();
    renderCalc(baseProject, jest.fn(), onOutputsChange);
    const hoursInput = screen.getByPlaceholderText('e.g., 2000');
    fireEvent.change(hoursInput, { target: { value: '4000' } });
    await waitFor(() =>
      expect(onOutputsChange).toHaveBeenCalledWith(
        expect.objectContaining({ duration: expect.closeTo(25, 1) })
      )
    );
  });

  test('fires onOutputsChange with recommendedManpower in manpower mode', async () => {
    const onOutputsChange = jest.fn();
    renderCalc(baseProject, jest.fn(), onOutputsChange);
    fireEvent.click(screen.getByText('Calculate Manpower'));
    await waitFor(() =>
      expect(onOutputsChange).toHaveBeenCalledWith(
        expect.objectContaining({ recommendedManpower: expect.closeTo(6.25, 2) })
      )
    );
  });
});

// ---------------------------------------------------------------------------
// 5. Role-based UI
// ---------------------------------------------------------------------------

describe('ProjectCalculator — role-based UI', () => {
  test('editor: save button is visible', () => {
    asEditor();
    renderCalc();
    expect(screen.getByText('Save Analysis')).toBeInTheDocument();
  });

  test('viewer: save button is hidden', () => {
    asViewer();
    renderCalc();
    expect(screen.queryByText('Save Analysis')).toBeNull();
  });

  test('viewer: mode toggle buttons are disabled', () => {
    asViewer();
    renderCalc();
    expect(screen.getByText('Calculate Duration').closest('button')).toBeDisabled();
    expect(screen.getByText('Calculate Manpower').closest('button')).toBeDisabled();
  });

  test('editor: mode toggle buttons are enabled', () => {
    asEditor();
    renderCalc();
    expect(screen.getByText('Calculate Duration').closest('button')).not.toBeDisabled();
    expect(screen.getByText('Calculate Manpower').closest('button')).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 6. Save functionality
// ---------------------------------------------------------------------------

describe('ProjectCalculator — save functionality', () => {
  beforeEach(() => {
    asEditor();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  test('save success: calls updateProject with duration-mode payload and invokes onProjectUpdate', async () => {
    const updatedProject = { ...baseProject, totalManHours: 2000 };
    mockUpdateProject.mockResolvedValueOnce({ data: updatedProject } as any);
    const onProjectUpdate = jest.fn();
    renderCalc(baseProject, onProjectUpdate);

    fireEvent.click(screen.getByText('Save Analysis'));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          totalManHours: 2000,
          desiredManpower: 5,
          efficiency: 0.8,
        })
      );
      expect(onProjectUpdate).toHaveBeenCalledWith(updatedProject);
    });
  });

  test('save success: shows success alert', async () => {
    mockUpdateProject.mockResolvedValueOnce({ data: baseProject } as any);
    renderCalc();
    fireEvent.click(screen.getByText('Save Analysis'));
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Project analysis saved successfully!')
    );
  });

  test('save failure: shows error alert', async () => {
    mockUpdateProject.mockRejectedValueOnce(new Error('Network error'));
    renderCalc();
    await act(async () => {
      fireEvent.click(screen.getByText('Save Analysis'));
      // flush microtasks so the rejection propagates inside act()
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(window.alert).toHaveBeenCalledWith('Failed to save. Please try again.');
  });

  test('save in manpower mode sends targetDurationWeeks payload', async () => {
    mockUpdateProject.mockResolvedValueOnce({ data: baseProject } as any);
    renderCalc();
    fireEvent.click(screen.getByText('Calculate Manpower'));
    fireEvent.click(screen.getByText('Save Analysis'));
    await waitFor(() =>
      expect(mockUpdateProject).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          totalManHours: 2000,
          targetDurationWeeks: 10,
          efficiency: 0.8,
        })
      )
    );
  });

  test('save button shows "Saving..." while request is in flight', async () => {
    let resolveUpdate!: (v: any) => void;
    mockUpdateProject.mockReturnValueOnce(new Promise(r => { resolveUpdate = r; }));
    renderCalc();
    fireEvent.click(screen.getByText('Save Analysis'));
    expect(await screen.findByText('Saving...')).toBeInTheDocument();
    act(() => resolveUpdate({ data: baseProject }));
  });
});

// ---------------------------------------------------------------------------
// 7. Project prop sync
// ---------------------------------------------------------------------------

describe('ProjectCalculator — project prop sync', () => {
  beforeEach(() => asEditor());

  test('updating the project prop syncs totalManHours input', () => {
    const { rerender } = renderCalc();
    const updatedProject = { ...baseProject, totalManHours: 3000 };
    rerender(
      <ProjectCalculator
        project={updatedProject}
        onProjectUpdate={jest.fn()}
      />
    );
    // The input for hours should reflect the new value
    const hoursInput = screen.getByPlaceholderText('e.g., 2000') as HTMLInputElement;
    expect(Number(hoursInput.value)).toBe(3000);
  });
});
