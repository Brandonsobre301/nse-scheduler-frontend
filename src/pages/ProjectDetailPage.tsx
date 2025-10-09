import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ProjectCalculator from '../components/ProjectCalculator';
import { projectAPI } from '../services/api';
import type { Project, CalculatorOutputs} from '../types/project';
import ProjectTimeline from '../components/ProjectTimeline';

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
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
        let project = res.data;
        
        // Defensive check - ensure _id exists
        if (!project._id) {
          console.error('Project missing _id, using URL param as fallback');
          project._id = id;  // Use the URL parameter as fallback
        }
        
        // Ensure other required fields exist
        if (!project.name) project.name = 'Unnamed Project';
        if (!project.manager) project.manager = 'Unknown Manager';
        
        // Add mock phases ONLY for timeline visuals (not connected to calculator)
        if (!project.phases || project.phases.length === 0) {
          project.phases = [
            {
              _id: '1',
              name: 'Rough in Phase',
              startDate: '2024-01-01',
              endDate: '2024-01-14',
              status: 'CONFIRMED',
              progress: 100,
              assignedTo: ['BS', 'MM']
            },
            {
              _id: '2',
              name: 'Termination/wiring Phase',
              startDate: '2024-01-15',
              endDate: '2024-02-15',
              status: 'CONFIRMED',
              progress: 75,
              assignedTo: ['JS', 'AL']
            },
            {
              _id: '3',
              name: 'Testing & Trimout Phase',
              startDate: '2024-02-16',
              endDate: '2024-03-01',
              status: 'SCHEDULED',
              progress: 0,
              assignedTo: ['QA', 'TE']
            }
          ];
        }
        
        console.log('Final project with ID:', project._id);
        setProject(project);
      })
      .catch(err => {
        console.error('Failed to fetch project:', err);
        alert('Failed to load project. Please check the URL or try again.');
        setProject(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ADD THIS: Safe project update handler to preserve data after saving
  const handleProjectUpdate = (updatedProject: Project) => {
    console.log('Updating project state with:', updatedProject);
    
    if (!project) {
      console.error('No existing project to update');
      return;
    }
    
    // Preserve critical fields that might get lost in the update
    const safeProject = {
      ...project,        // Keep ALL existing data (phases, _id, name, manager, etc.)
      ...updatedProject, // Apply calculator updates from backend
      _id: project._id,  // Ensure _id is always preserved
      name: project.name || updatedProject.name, // Preserve name
      manager: project.manager || updatedProject.manager, // Preserve manager
      phases: project.phases || []  // Preserve mock phases for timeline
    };
    
    console.log('Safe project update preserving data:', safeProject);
    setProject(safeProject);
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!project) return <Layout><div>Project not found or failed to load.</div></Layout>;

  return (
    <Layout>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <img src="/NSE.png" alt="NSE Logo" style={{ 
          width: '160px', 
          height: '64px', 
          margin: '0 auto 8px auto' 
        }} />
      </div>
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          {project.name}
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: '#6b7280', 
          textAlign: 'center'
        }}>
          Foreman: {project.manager} | Project ID: {project.projectNumber}
        </p>
      </div>

      {/* Debug info - remove after fixing */}
      <div style={{
        backgroundColor: '#fef3c7',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '16px',
        fontSize: '14px'
      }}>
        {/*DEBUG: Project ID = {project._id || 'MISSING!'} | Name = {project.name} | Manager = {project.manager} */}
      </div>

      <ProjectCalculator 
        project={project} 
        onProjectUpdate={handleProjectUpdate}  // Use the safe handler instead of setProject
        onOutputsChange={setCalculatorOutputs}
      />
      
      {/* Timeline with mock data for visuals only */}
      <ProjectTimeline
        project={project}
        budgetedDuration={calculatorOutputs.duration}
      />
    </Layout>
  );
};

export default ProjectDetailPage;