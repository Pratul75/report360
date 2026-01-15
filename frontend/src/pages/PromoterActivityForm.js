import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { promoterActivitiesAPI, campaignsAPI, promotersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PromoterActivityForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    promoter_id: '',
    promoter_name: '',
    campaign_id: '',
    village_name: '',
    activity_date: '',
    people_attended: 0,
    activity_count: 0,
    specialty: '',
    language: '',
    remarks: '',
  });

  const [images, setImages] = useState({
    before: null,
    during: null,
    after: null,
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsAPI.getAll().then(res => res.data),
  });

  const { data: promoters } = useQuery({
    queryKey: ['promoters'],
    queryFn: () => promotersAPI.getAll().then(res => res.data),
  });

  // Load existing activity for edit
  const { data: activity, isLoading } = useQuery({
    queryKey: ['promoter-activity', id],
    queryFn: () => promoterActivitiesAPI.getOne(id).then(res => res.data),
    enabled: isEdit,
    onSuccess: (data) => {
      setFormData({
        promoter_id: data.promoter_id,
        promoter_name: data.promoter_name,
        campaign_id: data.campaign_id,
        village_name: data.village_name,
        activity_date: data.activity_date,
        people_attended: data.people_attended,
        activity_count: data.activity_count,
        specialty: data.specialty || '',
        language: data.language || '',
        remarks: data.remarks || '',
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => promoterActivitiesAPI.create(data),
    onSuccess: async (response) => {
      const activityId = response.data.id;
      
      // Upload images if any
      const uploadPromises = [];
      if (images.before) uploadPromises.push(promoterActivitiesAPI.uploadImage(activityId, 'before', images.before));
      if (images.during) uploadPromises.push(promoterActivitiesAPI.uploadImage(activityId, 'during', images.during));
      if (images.after) uploadPromises.push(promoterActivitiesAPI.uploadImage(activityId, 'after', images.after));
      
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }
      
      queryClient.invalidateQueries(['promoter-activities']);
      toast.success('Activity created successfully!');
      navigate('/promoter-activities');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create activity');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => promoterActivitiesAPI.update(id, data),
    onSuccess: async () => {
      // Upload new images if any
      const uploadPromises = [];
      if (images.before) uploadPromises.push(promoterActivitiesAPI.uploadImage(id, 'before', images.before));
      if (images.during) uploadPromises.push(promoterActivitiesAPI.uploadImage(id, 'during', images.during));
      if (images.after) uploadPromises.push(promoterActivitiesAPI.uploadImage(id, 'after', images.after));
      
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }
      
      queryClient.invalidateQueries(['promoter-activities']);
      queryClient.invalidateQueries(['promoter-activity', id]);
      toast.success('Activity updated successfully!');
      navigate(`/promoter-activities/${id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update activity');
    },
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePromoterSelect = (promoterId) => {
    const selectedPromoter = promoters?.find(p => p.id === parseInt(promoterId));
    if (selectedPromoter) {
      setFormData(prev => ({
        ...prev,
        promoter_id: promoterId,
        promoter_name: selectedPromoter.name,
        specialty: selectedPromoter.specialty || prev.specialty,
        language: selectedPromoter.language || prev.language,
      }));
    }
  };

  const handleImageChange = (type, file) => {
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (file && !validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP images are allowed');
      return;
    }
    
    setImages(prev => ({ ...prev, [type]: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.promoter_id) {
      toast.error('Please select a promoter');
      return;
    }
    if (!formData.campaign_id) {
      toast.error('Please select a campaign');
      return;
    }
    if (!formData.village_name) {
      toast.error('Please enter village name');
      return;
    }
    if (!formData.activity_date) {
      toast.error('Please select activity date');
      return;
    }
    if (formData.people_attended < 0) {
      toast.error('People attended cannot be negative');
      return;
    }
    if (formData.activity_count < 0) {
      toast.error('Activity count cannot be negative');
      return;
    }

    const submitData = {
      ...formData,
      promoter_id: parseInt(formData.promoter_id),
      campaign_id: parseInt(formData.campaign_id),
      people_attended: parseInt(formData.people_attended),
      activity_count: parseInt(formData.activity_count),
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isEdit && isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold text-slate-800">
          {isEdit ? 'Edit Activity' : 'Add Promoter Activity'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Activity Details</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Promoter Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Promoter *</label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.promoter_id}
                  onChange={(e) => handlePromoterSelect(e.target.value)}
                >
                  <option value="">Select Promoter</option>
                  {promoters?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Campaign *</label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.campaign_id}
                  onChange={(e) => handleChange('campaign_id', e.target.value)}
                >
                  <option value="">Select Campaign</option>
                  {campaigns?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Village Name *</label>
                <Input
                  required
                  value={formData.village_name}
                  onChange={(e) => handleChange('village_name', e.target.value)}
                  placeholder="Enter village/location name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Activity Date *</label>
                <Input
                  required
                  type="date"
                  value={formData.activity_date}
                  onChange={(e) => handleChange('activity_date', e.target.value)}
                />
              </div>
            </div>

            {/* Numeric Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">People Attended</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.people_attended}
                  onChange={(e) => handleChange('people_attended', e.target.value)}
                  placeholder="Number of attendees"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Activity Count</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.activity_count}
                  onChange={(e) => handleChange('activity_count', e.target.value)}
                  placeholder="Number of activities"
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Specialty</label>
                <Input
                  value={formData.specialty}
                  onChange={(e) => handleChange('specialty', e.target.value)}
                  placeholder="Promoter specialty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <Input
                  value={formData.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  placeholder="Language(s) spoken"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium mb-2">Remarks</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows="3"
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                placeholder="Additional notes or observations..."
              />
            </div>

            {/* Image Uploads */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Activity Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['before', 'during', 'after'].map((type) => (
                  <div key={type} className="border-2 border-dashed rounded-lg p-4">
                    <label className="block text-sm font-medium mb-2 capitalize">{type} Image</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleImageChange(type, e.target.files[0])}
                      className="hidden"
                      id={`${type}-upload`}
                    />
                    <label
                      htmlFor={`${type}-upload`}
                      className="flex flex-col items-center justify-center cursor-pointer py-4"
                    >
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-600">
                        {images[type] ? images[type].name : `Upload ${type} image`}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">Max 5MB • JPG, PNG, WEBP</span>
                    </label>
                    {isEdit && activity?.[`${type}_image`] && !images[type] && (
                      <div className="mt-2 text-xs text-green-600">✓ Image already uploaded</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Update Activity' : 'Create Activity'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default PromoterActivityForm;
