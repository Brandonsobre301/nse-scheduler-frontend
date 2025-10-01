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
    if (!id) return;
    setLoading(true);
    projectAPI.getProject(id)
      .then(res => setProject(res.data))
      .catch(err => {
        console.error('Failed to fetch project:', err);
        setProject(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!project) return <Layout><div>Project not found.</div></Layout>;

  return (
    <Layout>
      <img src="/NSE.png" alt="NSE Logo" className="mx-auto mb-2" style={{ width: '160px', height: '64px' }} />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{project.name}</h1>
      <p className="text-lg text-gray-600 mb-8">Foreman: {project.manager}</p>

      <ProjectCalculator 
      project={project} 
      onProjectUpdate={setProject}
      onOutputsChange={setCalculatorOutputs}
      />
      <ProjectTimeline
        project={project}
        budgetedDuration={calculatorOutputs.duration}
      />

    </Layout>
  );
};

export default ProjectDetailPage;