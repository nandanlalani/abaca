import React from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const Profile = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Profile management coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
