'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, FileJson, CheckCircle2, XCircle } from 'lucide-react';

interface DataExportCardProps {
  accountIds?: string[];
}

export function DataExportCard({ accountIds }: DataExportCardProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [dateRange, setDateRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('3m');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleExport = async () => {
    setExporting(true);

    try {
      // Calculate date range
      const dateTo = new Date().toISOString();
      let dateFrom: string | undefined;

      if (dateRange !== 'all') {
        const months = {
          '1m': 1,
          '3m': 3,
          '6m': 6,
          '1y': 12,
        }[dateRange];

        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);
        dateFrom = fromDate.toISOString();
      }

      // Build query parameters
      const params = new URLSearchParams({
        format,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(accountIds && accountIds.length > 0 && { accountIds: accountIds.join(',') }),
      });

      // Trigger download
      const response = await fetch(`/api/dashboard/export?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Export failed');
      }

      // Get filename from headers or use default
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `export.${format}`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: `Your financial data has been exported as ${format.toUpperCase()}`,
      });

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);

    } catch (error) {
      console.error('Export error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to export data',
      });

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Financial Data
        </CardTitle>
        <CardDescription>
          Download your account balances and net worth history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="export-format">Export Format</Label>
          <Select value={format} onValueChange={(value) => setFormat(value as 'csv' | 'json')}>
            <SelectTrigger id="export-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>CSV (Spreadsheet)</span>
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  <span>JSON (Data Format)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-range">Date Range</Label>
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
            <SelectTrigger id="date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleExport}
          disabled={exporting}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
        </Button>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Your data is exported securely and contains account balances and net worth history for the selected period.
        </p>
      </CardContent>
    </Card>
  );
}
