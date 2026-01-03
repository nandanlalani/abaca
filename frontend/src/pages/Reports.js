import React from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const Reports = () => {
  return (
    <Layout>
      <div className="space-y-6" data-testid="reports-page">
        <h1 className="text-4xl font-bold tracking-tight">Reports & Analytics</h1>
        <Card>
          <CardHeader>
            <CardTitle>Generate Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Report generation and analytics coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;
