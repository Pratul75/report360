import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate } from '@/lib/utils';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getOne(id).then(res => res.data),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="flex gap-2">
          {hasPermission('project.update') && (
            <Button onClick={() => navigate(`/projects/${id}/edit`)}>Edit</Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              if (location.state && location.state.from) {
                navigate(location.state.from);
              } else {
                navigate('/projects');
              }
            }}
          >
            Back
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Project Details</h3>
          <div><strong>Name:</strong> {project.name}</div>
          <div><strong>Description:</strong> {project.description || '-'}</div>
          <div><strong>Budget:</strong> {project.budget ?? '-'}</div>
          <div><strong>Start:</strong> {project.start_date ? formatDate(project.start_date) : '-'}</div>
          <div><strong>End:</strong> {project.end_date ? formatDate(project.end_date) : '-'}</div>
          <div><strong>Status:</strong> {project.status}</div>
          <div><strong>Assigned CS:</strong> {project.cs_user ? project.cs_user.name : '-'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Client & Campaigns</h3>
          <div><strong>Client:</strong> {project.client ? (
            <Button variant="link" onClick={() => navigate(`/clients/${project.client.id}`)}>{project.client.name}</Button>
          ) : '-'}
          </div>
          <div className="mt-3"><strong>Campaigns:</strong>
            {project.campaigns && project.campaigns.length > 0 ? (
              <ul>
                {project.campaigns.map(c => (
                  <li key={c.id} className="py-1">
                    <Button variant="link" onClick={() => navigate(`/campaigns/${c.id}`)}>{c.name}</Button>
                  </li>
                ))}
              </ul>
            ) : <div className="text-sm text-slate-500">No campaigns</div>}
          </div>
          <div className="text-sm text-slate-500 mt-3">Created: {formatDate(project.created_at)}</div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;

