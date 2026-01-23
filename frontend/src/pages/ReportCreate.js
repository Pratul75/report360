import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI, campaignsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import api from '@/lib/api';

const ReportCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsAPI.getAll().then(res => res.data),
  });

  const [campaignId, setCampaignId] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [kmTravelled, setKmTravelled] = useState('');
  const [locationsCovered, setLocationsCovered] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photosUrl, setPhotosUrl] = useState('');
  const [gpsData, setGpsData] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  // Fetch GPS data from daily KM logs for selected campaign
  const fetchGpsFromLogs = async () => {
    if (!campaignId) {
      alert('Please select a campaign first');
      return;
    }
    setFetchingGps(true);
    try {
      const response = await api.get(`/daily-km-logs`, {
        params: { campaign_id: campaignId }
      });
      const logs = response.data;
      if (logs && logs.length > 0) {
        // Format in readable text format
        let gpsText = `GPS Data from ${logs.length} journey log(s):\n\n`;
        logs.forEach((log, index) => {
          gpsText += `Journey ${index + 1} (${log.date || 'N/A'}):\n`;
          gpsText += `  Start: ${log.start_latitude}, ${log.start_longitude}\n`;
          gpsText += `  End: ${log.end_latitude}, ${log.end_longitude}\n`;
          if (log.total_km) gpsText += `  Distance: ${log.total_km} km\n`;
          gpsText += `\n`;
        });
        setGpsData(gpsText);
        alert(`Fetched GPS data from ${logs.length} journey logs`);
      } else {
        alert('No GPS data found for this campaign');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch GPS data: ' + (err.response?.data?.detail || err.message));
    } finally {
      setFetchingGps(false);
    }
  };

  // Capture live location from browser
  const captureLiveLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Format time in Indian timezone
        const now = new Date();
        const indianTime = now.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: indianTime
        };
        // Save in simple format that's easy to read and edit
        const simpleFormat = `Latitude: ${location.latitude}\nLongitude: ${location.longitude}\nAccuracy: ${location.accuracy}m\nTime (IST): ${location.timestamp}`;
        setGpsData(simpleFormat);
        setCapturingLocation(false);
        alert('Location captured successfully!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Failed to capture location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg += 'Location request timed out.';
            break;
          default:
            errorMsg += error.message;
        }
        alert(errorMsg);
        setCapturingLocation(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 0 
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!campaignId) return alert('Please select a campaign');
    setSubmitting(true);
    try {
      let uploadedPhotoUrl = photosUrl;
      
      // If photo file is selected, upload it first
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const token = localStorage.getItem('token');
        
        try {
          const uploadResponse = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/v1/upload/report-photo`,
            formData,
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          uploadedPhotoUrl = uploadResponse.data.url;
        } catch (uploadErr) {
          console.error('Photo upload failed:', uploadErr);
          alert('Failed to upload photo: ' + (uploadErr.response?.data?.detail || uploadErr.message));
          setSubmitting(false);
          return;
        }
      }

      const payload = { 
        campaign_id: parseInt(campaignId, 10), 
        report_date: reportDate, 
        km_travelled: kmTravelled ? parseFloat(kmTravelled) : 0,
        locations_covered: locationsCovered || null,
        photos_url: uploadedPhotoUrl || null,
        gps_data: gpsData || null,
        notes: notes || null
      };
      
      if (id) {
        await reportsAPI.update(id, payload);
      } else {
        await reportsAPI.create(payload);
      }
      navigate('/reports');
    } catch (err) {
      console.error('Error creating report:', err);
      setSubmitting(false);
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
      alert('Failed to create report: ' + errorMsg);
    }
  };

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsAPI.getOne(id).then(res => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setCampaignId(existing.campaign_id ? String(existing.campaign_id) : '');
      setReportDate(existing.report_date || '');
      setKmTravelled(existing.km_travelled ? String(existing.km_travelled) : '');
      setLocationsCovered(existing.locations_covered || '');
      setPhotosUrl(existing.photos_url || '');
      setGpsData(existing.gps_data || '');
      setNotes(existing.notes || '');
    }
  }, [existing]);

  return (
    <div data-testid="report-create-page">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Create Report</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Campaign</label>
              <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="mt-1 block w-full border rounded-md p-2" required>
                <option value="">{campaignsLoading ? 'Loading campaigns...' : 'Select campaign'}</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Report Date</label>
              <input value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="mt-1 block w-full border rounded-md p-2" type="date" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">KM Travelled</label>
              <input value={kmTravelled} onChange={(e) => setKmTravelled(e.target.value)} className="mt-1 block w-full border rounded-md p-2" type="number" step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Locations Covered</label>
              <textarea value={locationsCovered} onChange={(e) => setLocationsCovered(e.target.value)} className="mt-1 block w-full border rounded-md p-2" rows="2" placeholder="Enter locations covered (comma-separated)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Photos (URL or File)</label>
              <input 
                type="text"
                value={photosUrl}
                onChange={(e) => setPhotosUrl(e.target.value)}
                placeholder="Enter photo URL (e.g., https://... or /uploads/...)"
                className="mt-1 block w-full border rounded-md p-2 mb-2" 
              />
              <div className="text-xs text-slate-500 mb-2">OR</div>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files[0])} 
                className="mt-1 block w-full border rounded-md p-2" 
              />
              {photoFile && (
                <p className="text-sm text-green-600 mt-1">✓ Selected: {photoFile.name}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">Enter a URL or select a file from your device</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">GPS Data</label>
              <div className="flex gap-2 mb-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={fetchGpsFromLogs}
                  disabled={fetchingGps || !campaignId}
                  className="text-xs"
                >
                  {fetchingGps ? 'Fetching...' : '📍 Fetch from Logs'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={captureLiveLocation}
                  disabled={capturingLocation}
                  className="text-xs"
                >
                  {capturingLocation ? 'Capturing...' : '🌍 Capture Live Location'}
                </Button>
              </div>
              <textarea value={gpsData} onChange={(e) => setGpsData(e.target.value)} className="mt-1 block w-full border rounded-md p-2 font-mono text-sm" rows="6" placeholder="GPS data will appear here or enter manually&#10;&#10;Examples:&#10;Latitude: 28.6139, Longitude: 77.2090&#10;OR&#10;28.6139, 77.2090&#10;OR any text format" />
              <p className="text-xs text-slate-500 mt-1">✨ Use buttons above to fetch GPS from daily logs or capture current location. You can also type latitude, longitude manually in any format.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full border rounded-md p-2" rows="3" placeholder="Additional notes or observations" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-indigo-600" disabled={submitting}>{submitting ? (id ? 'Updating...' : 'Creating...') : (id ? 'Update' : 'Create')}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/reports')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportCreate;
