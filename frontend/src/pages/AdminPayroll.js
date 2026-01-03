import React from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const AdminPayroll = () => {
  return (
    <Layout>
      <div className="space-y-6" data-testid="admin-payroll-page">
        <h1 className="text-4xl font-bold tracking-tight">Payroll Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Manage Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Payroll management interface coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminPayroll;
