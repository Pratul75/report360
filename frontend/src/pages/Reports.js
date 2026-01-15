import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const Reports = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsAPI.getAll().then(res => res.data),
  });

  return (
    <div data-testid="reports-page">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Reports</h1>
          <p className="text-slate-600">Daily execution reports and analytics</p>
        </div>
        {hasPermission('report.create') && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="create-report-btn" onClick={() => navigate('/reports/new')}>
            <Plus className="mr-2 h-4 w-4" /> Create Report
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Campaign Reports</h3>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : reports?.length === 0 ? (
            <div className="text-center py-8">No reports found</div>
          ) : (
            <div className="space-y-3">
              {reports?.map((report) => (
                <div
                  key={report.id}
                  data-testid="report-item"
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {report.campaign?.name || `Campaign ${report.campaign_id}`} Report
                      </h4>
                      <p className="text-sm text-slate-600">
                        {formatDate(report.report_date)} • {report.km_travelled || 0} KM travelled
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/reports/${report.id}`)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
