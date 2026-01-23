import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const [deleting, setDeleting] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsAPI.getOne(id).then(res => res.data),
  });

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    setDeleting(true);
    try {
      await reportsAPI.delete(id);
      if (location.state && location.state.from) {
        navigate(location.state.from);
      } else {
        navigate('/reports');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete report');
      setDeleting(false);
    }
  };

  // Helper function to format dates in Indian timezone
  const formatIndianDateTime = (dateString) => {
    if (!dateString) return '';
    // Parse the date string - backend sends UTC time without Z suffix
    const date = new Date(dateString + (dateString.includes('Z') ? '' : 'Z'));
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Helper to format value for display
  const formatValue = (key, value) => {
    if (key === 'campaign' && value?.name) {
      return value.name;
    }
    if ((key === 'created_at' || key === 'updated_at' || key === 'report_date') && value) {
      return formatIndianDateTime(value);
    }
    if (key === 'photos_url') {
      // Don't display in table, will show separately
      return null;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (isLoading) return <div>Loading...</div>;
  if (!report) return <div>Report not found</div>;

  /* ===================== EXCEL ===================== */
  const downloadExcel = () => {
    const rows = Object.entries(report).map(([key, value]) => ({
      Field: key.replace(/_/g, ' '),
      Value: formatValue(key, value),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 25 }, { wch: 60 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `report_${report.id}.xlsx`);
  };

  /* ===================== PDF ===================== */
  const downloadPDF = () => {
    const pdf = new jsPDF();
    
    // Title
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Report #${report.id}`, 14, 20);
    
    // Campaign info
    if (report.campaign?.name) {
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Campaign: ${report.campaign.name}`, 14, 28);
    }
    
    let y = 40;
    pdf.setFontSize(10);
    
    // Header row
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(230, 230, 230);
    pdf.rect(14, y - 6, 180, 8, 'F');
    pdf.text('Field', 16, y);
    pdf.text('Value', 85, y);
    pdf.setFont(undefined, 'normal');
    
    y += 10;
    pdf.line(14, y - 4, 194, y - 4);

    Object.entries(report)
      .filter(([key]) => key !== 'photos_url' && key !== 'campaign') // Skip photos and campaign object in PDF
      .forEach(([key, value]) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }

        // Field name
        pdf.setFont(undefined, 'bold');
        const fieldName = key.replace(/_/g, ' ').toUpperCase();
        pdf.text(fieldName, 16, y);
        
        // Value
        pdf.setFont(undefined, 'normal');
        let displayValue = '';
        
        if (value === null || value === undefined) {
          displayValue = '-';
        } else if ((key === 'created_at' || key === 'updated_at' || key === 'report_date') && value) {
          displayValue = formatIndianDateTime(value);
        } else if (typeof value === 'object') {
          displayValue = JSON.stringify(value);
        } else {
          displayValue = String(value);
        }
        
        const lines = pdf.splitTextToSize(displayValue, 100);
        pdf.text(lines, 85, y);
        
        y += Math.max(8, lines.length * 5 + 3);
        
        // Light separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(14, y - 2, 194, y - 2);
      });

    // Add photo URL at the end if exists
    if (report.photos_url) {
      if (y > 260) {
        pdf.addPage();
        y = 20;
      }
      y += 10;
      pdf.setFont(undefined, 'bold');
      pdf.text('PHOTO URL', 16, y);
      pdf.setFont(undefined, 'normal');
      const photoLines = pdf.splitTextToSize(report.photos_url, 100);
      pdf.text(photoLines, 85, y);
    }

    pdf.save(`report_${report.id}.pdf`);
  };

  /* ===================== WORD ===================== */
  const downloadWord = async () => {
    const paragraphs = [
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: `Report #${report.id}`,
            bold: true,
            size: 36,
          }),
        ],
      }),
    ];

    // Add campaign name header if available
    if (report.campaign?.name) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: `Campaign: ${report.campaign.name}`,
              size: 24,
            }),
          ],
        })
      );
    }

    Object.entries(report).forEach(([key, value]) => {
      // Skip campaign object and photos_url (will add photos_url separately)
      if (key === 'campaign' || key === 'photos_url') return;
      
      const formattedValue = formatValue(key, value);
      if (formattedValue === null) return;
      
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: `${key.replace(/_/g, ' ').toUpperCase()}: `,
              bold: true,
            }),
            new TextRun(String(formattedValue)),
          ],
        })
      );
    });

    // Add photo URL at the end if exists
    if (report.photos_url) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 300, after: 120 },
          children: [
            new TextRun({
              text: 'PHOTO URL: ',
              bold: true,
            }),
            new TextRun(String(report.photos_url)),
          ],
        })
      );
    }

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `report_${report.id}.docx`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Report #{report.id}</h1>
        <div className="flex gap-2">
          <Button onClick={downloadExcel}>Excel</Button>
          <Button onClick={downloadPDF}>PDF</Button>
          <Button onClick={downloadWord}>Word</Button>
          <Button onClick={() => navigate(`/reports/${id}/edit`)}>Edit</Button>
          {hasPermission('report.delete') && (
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate('/reports')}>
            Back
          </Button>
        </div>
      </div>

      {/* Clean UI */}
      <div className="overflow-hidden rounded border">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-3 border">Field</th>
              <th className="text-left p-3 border">Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(report)
              .filter(([key]) => key !== 'photos_url') // Skip photos_url in table
              .map(([key, value]) => (
              <tr key={key} className="hover:bg-slate-50">
                <td className="p-3 border font-medium capitalize">
                  {key.replace(/_/g, ' ')}
                </td>
                <td className="p-3 border">
                  {formatValue(key, value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Photo Display Section */}
      {report.photos_url && (
        <div className="mt-4 p-4 border rounded bg-white">
          <h3 className="text-lg font-semibold mb-3">Report Photos</h3>
          {hasPermission('report.delete') ? (
            // Admin: Show actual image
            <div>
              <img 
                src={
                  report.photos_url.startsWith('http') 
                    ? report.photos_url 
                    : report.photos_url.startsWith('/uploads/') 
                      ? `${process.env.REACT_APP_BACKEND_URL}${report.photos_url}`
                      : `${process.env.REACT_APP_BACKEND_URL}/uploads/reports/${report.photos_url}`
                }
                alt="Report Photo"
                className="max-w-full h-auto rounded-lg shadow-md mb-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{display: 'none'}} className="text-sm text-slate-600 p-3 bg-slate-50 rounded">
                <p className="font-medium mb-1">Image not found. Photo reference:</p>
                <p className="break-all">{report.photos_url}</p>
                <p className="text-xs text-slate-500 mt-2">The image may not be uploaded yet or the path is incorrect.</p>
              </div>
            </div>
          ) : (
            // Non-admin: Show URL only
            <div className="text-sm text-slate-600">
              <p className="font-medium mb-1">Photo Reference:</p>
              <p className="break-all bg-slate-50 p-2 rounded">{report.photos_url}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportDetails;
