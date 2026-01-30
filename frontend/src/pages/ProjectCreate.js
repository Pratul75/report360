import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsAPI, clientsAPI, usersAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

const ProjectCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin, hasPermission } = usePermissions();

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll().then(res => res.data),
  });

  const { data: csUsers = [], isLoading: csUsersLoading } = useQuery({
    queryKey: ['cs-users'],
    queryFn: () => usersAPI.getCSUsers().then(res => res.data),
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [assignedCS, setAssignedCS] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);

  // NEW STATE
  const [dynamicFields, setDynamicFields] = useState([]);

  // ADD FIELD
  const addField = () => {
    setDynamicFields([
      ...dynamicFields,
      { field_name: "", field_type: "text", required: false, options: [] }
    ]);
  };

  // REMOVE FIELD
  const removeField = (index) => {
    setDynamicFields(dynamicFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) return alert('Select client');
    setSubmitting(true);
    try {
      const payload = { 
        name, 
        description, 
        client_id: parseInt(clientId, 10),
        assigned_cs: assignedCS ? parseInt(assignedCS, 10) : null,
        budget: budget ? parseFloat(budget) : null, 
        start_date: startDate || null, 
        end_date: endDate || null,
        status,
        fields: dynamicFields   // 👈 NEW
      };

      if (id) {
        await projectsAPI.update(id, payload);
      } else {
        await projectsAPI.create(payload);
      }
      navigate('/projects');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert('Failed to create project');
    }
  };

  const { data: existing } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getOne(id).then(res => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name || '');
      setDescription(existing.description || '');
      setClientId(existing.client_id ? String(existing.client_id) : '');
      setAssignedCS(existing.assigned_cs ? String(existing.assigned_cs) : '');
      setBudget(existing.budget ? String(existing.budget) : '');
      setStartDate(existing.start_date || '');
      setEndDate(existing.end_date || '');
      setStatus(existing.status || 'active');
      setDynamicFields(existing.fields || []); // 👈 for edit
    }
  }, [existing]);

  return (
    <div data-testid="project-create-page">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Create Project</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border rounded-md p-2" required />
            </div>

            <div>
              <label className="block text-sm font-medium">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                className="mt-1 block w-full border rounded-md p-2" required>
                <option value="">{clientsLoading ? 'Loading...' : 'Select client'}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Assign CS</label>
              <select value={assignedCS} onChange={(e) => setAssignedCS(e.target.value)}
                className="mt-1 block w-full border rounded-md p-2">
                <option value="">{csUsersLoading ? 'Loading...' : 'Select CS (optional)'}</option>
                {csUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full border rounded-md p-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="mt-1 block w-full border rounded-md p-2">
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Budget</label>
                <input type="number" value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="mt-1 block w-full border rounded-md p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium">Start Date</label>
                <input type="date" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full border rounded-md p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium">End Date</label>
                <input type="date" value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full border rounded-md p-2" />
              </div>
            </div>

            {/* ===== DYNAMIC FIELDS SECTION - PROJECT MANAGERS ONLY ===== */}
            {(isAdmin || hasPermission('project.create') || hasPermission('project.update')) && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-2">Dynamic Form Fields</h3>

                {dynamicFields.map((f, i) => (
                  <div key={i} className="flex gap-2 items-center mb-2">
                    <input
                      placeholder="Field Name"
                      className="border rounded p-2 w-1/4"
                      value={f.field_name}
                      onChange={e => {
                        const copy = [...dynamicFields];
                        copy[i].field_name = e.target.value;
                        setDynamicFields(copy);
                      }}
                    />

                    <select
                      className="border rounded p-2"
                      value={f.field_type}
                      onChange={e => {
                        const copy = [...dynamicFields];
                        copy[i].field_type = e.target.value;
                        setDynamicFields(copy);
                      }}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="dropdown">Dropdown</option>
                    </select>

                    {f.field_type === "dropdown" && (
                      <input
                        placeholder="Options: A,B,C"
                        className="border rounded p-2 w-1/3"
                        onChange={e => {
                          const copy = [...dynamicFields];
                          copy[i].options = e.target.value.split(",");
                          setDynamicFields(copy);
                        }}
                      />
                    )}

                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={e => {
                          const copy = [...dynamicFields];
                          copy[i].required = e.target.checked;
                          setDynamicFields(copy);
                        }}
                      />
                      Required
                    </label>

                    <Button type="button" variant="ghost" onClick={() => removeField(i)}>
                      ❌
                    </Button>
                  </div>
                ))}

                <Button type="button" onClick={addField}>
                  + Add Field
                </Button>
              </div>
            )}

            {/* SUBMIT */}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (id ? 'Updating...' : 'Creating...') : (id ? 'Update' : 'Create')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/projects')}>
                Cancel
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectCreate;