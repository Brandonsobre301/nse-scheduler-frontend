import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ProjectCalculator, { CalculatorOutputs } from '../components/ProjectCalculator';
import ProjectForm from '../components/ProjectForm';
import { projectAPI } from '../services/api';
import type { Project } from '../types/project';
import ProjectTimeline from '../components/ProjectTimeline';
import { useUserRole } from '../hooks/useUserRole';

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit, role } = useUserRole();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // THE BRIDGE: State to hold the calculator's real-time outputs
  const [calculatorOutputs, setCalculatorOutputs] = useState<CalculatorOutputs>({
    duration: 0,
    expendedHours: 0,
    recommendedManpower: 0
  });

  useEffect(() => {
    if (!id) {
      console.error('No project ID in URL params');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    projectAPI.getProject(id)
      .then((res: any) => {
        let projectData = res.data;
        
        if (!projectData._id) {
          projectData._id = id;
        }
        
        if (!projectData.name) projectData.name = 'Unnamed Project';
        if (!projectData.manager) projectData.manager = 'Unknown Manager';
        
        setProject(projectData);
      })
      .catch((err: any) => {
        console.error('Failed to fetch project:', err);
        setProject(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleEditProject = async (data: Partial<Project>) => {
    if (!project?._id) return;
    
    try {
      setIsSubmitting(true);
      const response: any = await projectAPI.updateProject(project._id, data);
      setProject(response.data);
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    if (!project) return;
    
    const safeProject = {
      ...project,
      ...updatedProject,
      _id: project._id,
      name: project.name || updatedProject.name,
      manager: project.manager || updatedProject.manager,
      phases: project.phases || []
    };
    
    setProject(safeProject);
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!project) return <Layout><div className="text-center p-12 text-slate-500">Project not found or failed to load.</div></Layout>;

  return (
    <Layout>
      {/* Navigation Bar */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors text-sm font-semibold"
        >
          <span>←</span> Back to Dashboard
        </button>
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors text-sm font-semibold"
        >
          All Projects →
        </button>
      </div>

      {/* Header Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-20 -mt-20 opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold tracking-widest uppercase">
                {project.projectNumber ?? project._id.slice(-6)}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold uppercase">
                Active
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
              {project.name}
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <span className="text-slate-400">👤 Foreman:</span> {project.manager}
            </p>
          </div>
          
          {canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-semibold shadow-md whitespace-nowrap self-start md:self-auto"
            >
               Edit Project Details
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Calculator and Timeline side-by-side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Calculator */}
        <div className="lg:col-span-1 sticky top-6">
          {canEdit ? (
            <ProjectCalculator 
              project={project} 
              onProjectUpdate={handleProjectUpdate}
              onOutputsChange={setCalculatorOutputs} // <-- Bridge connection 1
            />
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 text-center border border-slate-200">
              <h2 className="text-lg text-slate-700 mb-3 font-bold flex items-center justify-center gap-2 border-b pb-3">
                🔒 Calculator (View Only)
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Contact an admin or manager to edit estimation values.
              </p>
              <div className="text-sm text-slate-700 space-y-3 bg-slate-50 p-5 rounded-lg border border-slate-100 text-left">
                <div className="flex justify-between items-center"><span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Total Man-Hours:</span> <span className="font-bold">{project.totalManHours ?? 'N/A'}</span></div>
                <div className="flex justify-between items-center"><span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Desired Crew:</span> <span className="font-bold">{project.desiredManpower ?? 'N/A'}</span></div>
                <div className="flex justify-between items-center"><span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Efficiency:</span> <span className="font-bold">{project.efficiency ? `${(project.efficiency * 100).toFixed(0)}%` : 'N/A'}</span></div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200"><span className="font-bold text-slate-600 text-xs uppercase tracking-wider">Target Duration:</span> <span className="font-bold text-blue-600">{project.targetDurationWeeks ?? 'N/A'} wks</span></div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Timeline */}
        <div className="lg:col-span-2 h-full">
          <ProjectTimeline
            project={project}
            budgetedDuration={calculatorOutputs.duration} // <-- Bridge connection 2
          />
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-8">
              <ProjectForm
                project={project}
                onSubmit={handleEditProject}
                onCancel={() => setShowEditModal(false)}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProjectDetailPage;