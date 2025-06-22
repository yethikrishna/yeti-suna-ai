'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Edit, 
  Save, 
  X, 
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  workflow_type: string;
  workflow_content: string;
  trigger_conditions: any;
  actions: any;
  is_active: boolean;
  priority: number;
  version: number;
  created_at: string;
  updated_at: string;
}

const WorkflowEditor: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  
  const [editContent, setEditContent] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/immigration/workflows');
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(data.workflows);
      } else {
        setError('Failed to load workflows');
      }
    } catch (err) {
      setError('Error connecting to immigration service');
      console.error('Workflows fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow.id);
    setEditContent(workflow.workflow_content);
    setEditDescription(workflow.description);
  };

  const handleSaveWorkflow = async (workflowId: string) => {
    setSaving(workflowId);
    
    try {
      const response = await fetch(`/api/immigration/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          content: editContent,
          description: editDescription
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchWorkflows();
        setEditingWorkflow(null);
        setEditContent('');
        setEditDescription('');
      } else {
        setError('Failed to update workflow');
      }
    } catch (err) {
      setError('Error updating workflow');
      console.error('Workflow update error:', err);
    } finally {
      setSaving(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingWorkflow(null);
    setEditContent('');
    setEditDescription('');
  };

  const getWorkflowTypeColor = (type: string) => {
    switch (type) {
      case 'email_processing': return 'bg-blue-100 text-blue-800';
      case 'case_management': return 'bg-green-100 text-green-800';
      case 'document_generation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkflowTypeIcon = (type: string) => {
    switch (type) {
      case 'email_processing': return <FileText className="h-4 w-4" />;
      case 'case_management': return <Settings className="h-4 w-4" />;
      case 'document_generation': return <Edit className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const formatWorkflowContent = (content: string) => {
    // Simple markdown-like formatting for display
    return content
      .replace(/^# (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h4 class="text-md font-medium text-gray-800 mt-3 mb-2">$1</h4>')
      .replace(/^### (.*$)/gm, '<h5 class="text-sm font-medium text-gray-700 mt-2 mb-1">$1</h5>')
      .replace(/^\- (.*$)/gm, '<li class="ml-4 text-sm text-gray-600">• $1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading workflows...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workflow Management</h2>
          <p className="text-gray-600">Configure and customize H2A processing workflows</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <Badge className={getWorkflowTypeColor(workflow.workflow_type)}>
                    {getWorkflowTypeIcon(workflow.workflow_type)}
                    <span className="ml-1">{workflow.workflow_type.replace('_', ' ')}</span>
                  </Badge>
                  <Badge variant={workflow.is_active ? "default" : "secondary"}>
                    {workflow.is_active ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline">
                    Priority: {workflow.priority}
                  </Badge>
                  <Badge variant="outline">
                    v{workflow.version}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {editingWorkflow === workflow.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSaveWorkflow(workflow.id)}
                        disabled={saving === workflow.id}
                      >
                        {saving === workflow.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saving === workflow.id}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditWorkflow(workflow)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
              {workflow.description && (
                <p className="text-sm text-gray-600">{workflow.description}</p>
              )}
            </CardHeader>
            <CardContent>
              {editingWorkflow === workflow.id ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`description-${workflow.id}`}>Description</Label>
                    <Input
                      id={`description-${workflow.id}`}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Workflow description..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`content-${workflow.id}`}>Workflow Content (Markdown)</Label>
                    <Textarea
                      id={`content-${workflow.id}`}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                      placeholder="# Workflow Title

## Trigger Conditions
- Condition 1
- Condition 2

## Actions
1. Action 1
2. Action 2

## Notes
Additional information..."
                    />
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="content" className="w-full">
                  <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="conditions">Trigger Conditions</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="mt-4">
                    <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: formatWorkflowContent(workflow.workflow_content) 
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="conditions" className="mt-4">
                    <div className="bg-blue-50 p-4 rounded-lg border">
                      <h4 className="font-medium text-blue-900 mb-2">Trigger Conditions</h4>
                      <pre className="text-sm text-blue-800 whitespace-pre-wrap">
                        {JSON.stringify(workflow.trigger_conditions, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="actions" className="mt-4">
                    <div className="bg-green-50 p-4 rounded-lg border">
                      <h4 className="font-medium text-green-900 mb-2">Actions</h4>
                      <pre className="text-sm text-green-800 whitespace-pre-wrap">
                        {JSON.stringify(workflow.actions, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
              
              {/* Workflow Metadata */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Created:</span>
                    <br />
                    {new Date(workflow.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>
                    <br />
                    {new Date(workflow.updated_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <br />
                    {workflow.workflow_type.replace('_', ' ')}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <br />
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Workflow Editing Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to Edit Workflows:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Markdown Format:</strong> Use standard markdown syntax for formatting</li>
              <li>• <strong>Headers:</strong> Use # for main sections, ## for subsections</li>
              <li>• <strong>Lists:</strong> Use - for bullet points, numbers for ordered lists</li>
              <li>• <strong>Emphasis:</strong> Use **bold** and *italic* for emphasis</li>
              <li>• <strong>Save Changes:</strong> Click Save to update the workflow and create a new version</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Workflow Structure:</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• <strong>Trigger Conditions:</strong> Define when the workflow should execute</li>
              <li>• <strong>Actions:</strong> Specify what actions to take when triggered</li>
              <li>• <strong>Priority:</strong> Higher numbers execute first when multiple workflows match</li>
              <li>• <strong>Version Control:</strong> Each save creates a new version for tracking changes</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Example Workflow Sections:</h4>
            <pre className="text-sm text-green-800 whitespace-pre-wrap">{`# H2A RFE Processing Workflow

## Trigger Conditions
- Email contains "RFE" or "Request for Evidence"
- Email from USCIS domain
- Subject contains case number

## Actions
1. **Immediate Response** (within 1 hour)
   - Send acknowledgment to client
   - Calculate 87-day response deadline
   - Create calendar reminders

2. **Analysis** (within 24 hours)
   - Extract specific evidence requested
   - Identify missing documents
   - Assess complexity level

3. **Attorney Notification**
   - Slack notification with RFE summary
   - Attach RFE document
   - Highlight critical deadlines`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowEditor;