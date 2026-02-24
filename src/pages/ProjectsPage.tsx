import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ProjectForm from '../components/ProjectForm';
import { projectAPI } from '../services/api';
import type { Project } from '../types/project';
import { useUserRole } from '../hooks/useUserRole';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { canEdit, role } = useUserRole();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectAPI.getProjects();
      console.log('Fetched projects:', response.data);
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: Partial<Project>) => {
    try {
      setIsSubmitting(true);
      const response = await projectAPI.createProject(data);
      console.log('Created project:', response.data);
      
      // Add new project to list
      setProjects(prev => [...prev, response.data]);
      setShowCreateModal(false);
      
      // Optionally navigate to the new project
      navigate(`/projects/${response.data._id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await projectAPI.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p._id !== projectId));
      alert('Project deleted successfully');
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'On Track':
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'Over Budget':
      case 'CONFLICT':
        return 'bg-red-100 text-red-800';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'Awaiting Schedule':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex justify-start items-center mb-6 pb-4 border-b border-gray-200">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
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

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
            <p className="text-gray-600 mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''} total
            </p>
          </div>
          
          {/* Create Button - Only for users who can edit */}
          {canEdit && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="text-xl">+</span>
              <span>New Project</span>
            </button>
          )}
        </div>

        {/* Role indicator */}
        <div className={`mb-4 p-2 rounded text-sm text-center ${
          canEdit ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          Logged in as: <strong>{role}</strong>
          {!canEdit && ' (Read-only access)'}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
            <button 
              onClick={fetchProjects}
              className="ml-4 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 && !error && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Projects Yet</h2>
            <p className="text-gray-500 mb-6">
              {canEdit 
                ? 'Create your first project to get started.' 
                : 'No projects have been created yet.'}
            </p>
            {canEdit && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Project
              </button>
            )}
          </div>
        )}

        {/* Projects Grid */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div
                key={project._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                      {project.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status || 'No Status'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {project.projectNumber || `#${project._id.slice(-6).toUpperCase()}`}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Manager:</span>
                      <span className="text-gray-700">{project.manager || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Man-Hours:</span>
                      <span className="text-gray-700">
                        {project.totalManHours?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phases:</span>
                      <span className="text-gray-700">
                        {project.phases?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-gray-50 flex justify-between">
                  <button
                    onClick={() => navigate(`/projects/${project._id}`)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    View Details
                  </button>
                  
                  {canEdit && (
                    <button
                      onClick={() => handleDeleteProject(project._id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <ProjectForm
                  project={null}
                  onSubmit={handleCreateProject}
                  onCancel={() => setShowCreateModal(false)}
                  isLoading={isSubmitting}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectsPage;