'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  MessageSquare, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  Settings
} from 'lucide-react';
import EmailComposer from './EmailComposer';
import SlackSimulator from './SlackSimulator';
import CaseDashboard from './CaseDashboard';
import WorkflowEditor from './WorkflowEditor';

interface DashboardData {
  case_statistics: Record<string, number>;
  recent_email_activity: any[];
  recent_slack_messages: any[];
  urgent_cases: any[];
  total_cases: number;
}

const ImmigrationTab: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/immigration/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.dashboard);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError('Error connecting to immigration service');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'rfe_received': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading immigration dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">H2A Immigration Assistant</h1>
          <p className="text-gray-600">Automated workflow management for agricultural worker visas</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50">
            <Users className="h-3 w-3 mr-1" />
            {dashboardData?.total_cases || 0} Active Cases
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Cases</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData?.case_statistics?.pending || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">RFEs Received</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {dashboardData?.case_statistics?.rfe_received || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData?.case_statistics?.approved || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Denied</p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboardData?.case_statistics?.denied || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email Simulator</span>
          </TabsTrigger>
          <TabsTrigger value="slack" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Slack Simulator</span>
          </TabsTrigger>
          <TabsTrigger value="cases" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Cases</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Workflows</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Email Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Recent Email Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.recent_email_activity?.slice(0, 5).map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{email.email_subject}</p>
                        <p className="text-xs text-gray-600">From: {email.email_from}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(email.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(email.processing_status)}>
                        {email.processing_status}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No recent email activity</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Slack Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Recent Slack Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.recent_slack_messages?.slice(0, 5).map((message, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getPriorityIcon(message.priority_level)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{message.message_content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                        {message.attorney_response && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <strong>Attorney Response:</strong> {message.attorney_response}
                          </div>
                        )}
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No recent Slack messages</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Urgent Cases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Urgent Cases - Upcoming Deadlines</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.urgent_cases?.map((case_item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{case_item.case_number}</p>
                      <p className="text-sm text-gray-600">{case_item.client_name}</p>
                      <p className="text-sm text-gray-600">
                        Workers: {case_item.number_of_workers}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(case_item.status)}>
                        {case_item.status}
                      </Badge>
                      {case_item.rfe_deadline && (
                        <p className="text-sm text-red-600 mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          RFE Due: {new Date(case_item.rfe_deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">No urgent cases</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <EmailComposer onEmailProcessed={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="slack">
          <SlackSimulator onMessageSent={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="cases">
          <CaseDashboard />
        </TabsContent>

        <TabsContent value="workflows">
          <WorkflowEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImmigrationTab;