import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ProjectCalculator from '../components/ProjectCalculator';
import ProjectForm from '../components/ProjectForm';
import { projectAPI } from '../services/api';
import type { Project, CalculatorOutputs } from '../types/project';
import ProjectTimeline from '../components/ProjectTimeline';
import { useUserRole } from '../hooks/useUserRole';

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit, isAdmin, role } = useUserRole();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    
    console.log('Loading project with ID:', id);
    setLoading(true);
    
    projectAPI.getProject(id)
      .then(res => {
        console.log('API Response:', res.data);
        let projectData = res.data;
        
        if (!projectData._id) {
          console.error('Project missing _id, using URL param as fallback');
          projectData._id = id;
        }
        
        if (!projectData.name) projectData.name = 'Unnamed Project';
        if (!projectData.manager) projectData.manager = 'Unknown Manager';
        
        setProject(projectData);
      })
      .catch(err => {
        console.error('Failed to fetch project:', err);
        alert('Failed to load project. Please check the URL or try again.');
        setProject(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleEditProject = async (data: Partial<Project>) => {
    if (!project?._id) return;
    
    try {
      setIsSubmitting(true);
      const response = await projectAPI.updateProject(project._id, data);
      console.log('Updated project:', response.data);
      setProject(response.data);
      setShowEditModal(false);
      alert('Project updated successfully!');
    } catch (err) {
      console.error('Failed to update project:', err);
      alert('Failed to update project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    console.log('Updating project state with:', updatedProject);
    
    if (!project) {
      console.error('No existing project to update');
      return;
    }
    
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
  if (!project) return <Layout><div>Project not found or failed to load.</div></Layout>;

  return (
    <Layout>
      {/* Navigation Bar */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>
        
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <span></span>
          <span>All Projects</span>
        </button>
      </div>

      {/* Centered Logo */}
      <div className="flex justify-center mb-6">
        <img 
          src="/NSE.png" 
          alt="NSE Logo" 
          style={{ width: '160px', height: '64px' }}
          className="object-contain"
        />
      </div>
      
      {/* Header with Edit Button */}
      <div className="mb-8">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {project.name}
          </h1>
          <p className="text-lg text-gray-600">
            Foreman: {project.manager} | Project: {project.projectNumber ?? project._id.slice(-6).toUpperCase()}
          </p>
        </div>
        
        {/* Edit Button - Centered below header */}
        {canEdit && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
               Edit Project
            </button>
          </div>
        )}
      </div>

      {/* Role indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`p-3 rounded-lg mb-4 text-sm text-center ${
          canEdit ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          <strong>Role:</strong> {role.toUpperCase()} | 
          <strong> Edit Access:</strong> {canEdit ? '✅ ' : '❌ '}
          {!canEdit && ' (Read-only mode)'}
        </div>
      )}

      {/* Calculator section */}
      {canEdit ? (
        <ProjectCalculator 
          project={project} 
          onProjectUpdate={handleProjectUpdate}
          onOutputsChange={setCalculatorOutputs}
        />
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg mb-8 text-center">
          <h2 className="text-xl text-gray-600 mb-2">
            🔒 Calculator (View Only)
          </h2>
          <p className="text-gray-400 mb-4">
            Contact an admin or manager to edit project calculator values.
          </p>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Total Man-Hours:</strong> {project.totalManHours ?? 'N/A'}</p>
            <p><strong>Desired Manpower:</strong> {project.desiredManPower ?? 'N/A'}</p>
            <p><strong>Efficiency:</strong> {project.efficiency ? `${(project.efficiency * 100).toFixed(0)}%` : 'N/A'}</p>
            <p><strong>Target Duration:</strong> {project.targetDurationWeeks ?? 'N/A'} weeks</p>
          </div>
        </div>
      )}
      
      {/* Timeline */}
      <ProjectTimeline
        project={project}
        budgetedDuration={calculatorOutputs.duration}
      />

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
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