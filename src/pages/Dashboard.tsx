import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { projectAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import type { Project, User, ProjectStatus } from '../types/project';

const MetricCard = ({
  title, value, change, color
}: { title: string; value: string | number; change: string; color: 'blue' | 'green' | 'orange' | 'red' }) => {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-200 text-blue-600',
    green: 'border-green-200 text-green-600',
    orange: 'border-orange-200 text-orange-600',
    red: 'border-red-200 text-red-600'
  };
  return (
    <div className={`bg-white p-4 rounded-lg border ${colorClasses[color]}`}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{change}</p>
    </div>
  );
};

type Props = { user?: User; onLogout: () => void };

const Dashboard = ({ user, onLogout }: Props) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const response = await projectAPI.getProjects();
        console.log('Projects received by Dashboard:', response.data);
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      {/* Header with Logo */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <img 
            src="/NSE.png" 
            alt="NSE Logo" 
            style={{ width: '160px', height: '64px' }}
            className="object-contain cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          />
          <h1 className="text-2xl font-bold text-gray-800">Resource Utilization</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Welcome, {user?.name || 'User'}</span>
          <button 
            onClick={onLogout} 
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-3 rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Quick Navigation */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <span>📁</span>
          <span>View All Projects</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Active Projects" value={projects.length} change="+2 this month" color="blue" />
        <MetricCard title="Team Members" value="24" change="+3 new hires" color="green" />
        <MetricCard title="Resource Utilization" value="82%" change="Within optimal range" color="orange" />
        <MetricCard title="Urgent Deadlines" value="3" change="1 at risk" color="red" />
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Active Projects</h2>
          <button
            onClick={() => navigate('/projects')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No projects yet. 
                    <button 
                      onClick={() => navigate('/projects')}
                      className="text-blue-600 hover:underline ml-2"
                    >
                      Create your first project
                    </button>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600 hover:underline">
                      <Link to={`/projects/${project._id}`}>{project.name}</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.projectNumber || `#${project._id.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.manager || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.status === 'On Track' || project.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800' 
                          : project.status === 'Over Budget' || project.status === 'CONFLICT'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status || 'No Status'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${project.progress ?? 0}%` }} 
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
