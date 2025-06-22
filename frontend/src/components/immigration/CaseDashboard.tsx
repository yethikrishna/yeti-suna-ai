'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Plus,
  Search,
  Filter,
  FileText,
  Mail,
  Phone
} from 'lucide-react';

interface Case {
  id: string;
  case_number: string;
  client_name: string;
  case_type: string;
  status: string;
  priority_level: string;
  number_of_workers?: number;
  employment_start_date?: string;
  employment_end_date?: string;
  rfe_deadline?: string;
  response_deadline?: string;
  appeal_deadline?: string;
  client_email?: string;
  client_phone?: string;
  employer_name?: string;
  created_at: string;
  updated_at: string;
}

const CaseDashboard: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCase, setNewCase] = useState({
    case_number: '',
    client_name: '',
    case_type: 'H2A',
    number_of_workers: '',
    employment_start_date: '',
    employment_end_date: '',
    client_email: '',
    employer_name: ''
  });

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    filterCases();
  }, [cases, searchTerm, statusFilter, priorityFilter]);

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/immigration/cases');
      const data = await response.json();
      
      if (data.success) {
        setCases(data.cases);
      } else {
        setError('Failed to load cases');
      }
    } catch (err) {
      setError('Error connecting to immigration service');
      console.error('Cases fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterCases = () => {
    let filtered = cases;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(case_item =>
        case_item.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_item.employer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(case_item => case_item.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(case_item => case_item.priority_level === priorityFilter);
    }

    setFilteredCases(filtered);
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const caseData = {
        ...newCase,
        number_of_workers: newCase.number_of_workers ? parseInt(newCase.number_of_workers) : undefined,
        employment_start_date: newCase.employment_start_date || undefined,
        employment_end_date: newCase.employment_end_date || undefined
      };

      const response = await fetch('/api/immigration/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchCases();
        setShowCreateForm(false);
        setNewCase({
          case_number: '',
          client_name: '',
          case_type: 'H2A',
          number_of_workers: '',
          employment_start_date: '',
          employment_end_date: '',
          client_email: '',
          employer_name: ''
        });
      } else {
        setError('Failed to create case');
      }
    } catch (err) {
      setError('Error creating case');
      console.error('Case creation error:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'denied': return 'bg-red-100 text-red-800 border-red-200';
      case 'rfe_received': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'denied': return <XCircle className="h-4 w-4" />;
      case 'rfe_received': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading cases...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">H2A Cases</h2>
          <p className="text-gray-600">Manage and track H2A visa petitions</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Case</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Cases</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Case number, client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rfe_received">RFE Received</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Create Case Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New H2A Case</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="case_number">Case Number *</Label>
                  <Input
                    id="case_number"
                    value={newCase.case_number}
                    onChange={(e) => setNewCase({...newCase, case_number: e.target.value})}
                    placeholder="MSC2025001234"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    value={newCase.client_name}
                    onChange={(e) => setNewCase({...newCase, client_name: e.target.value})}
                    placeholder="Green Valley Farms LLC"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="employer_name">Employer Name</Label>
                  <Input
                    id="employer_name"
                    value={newCase.employer_name}
                    onChange={(e) => setNewCase({...newCase, employer_name: e.target.value})}
                    placeholder="Green Valley Farms LLC"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="number_of_workers">Number of Workers</Label>
                  <Input
                    id="number_of_workers"
                    type="number"
                    value={newCase.number_of_workers}
                    onChange={(e) => setNewCase({...newCase, number_of_workers: e.target.value})}
                    placeholder="25"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="employment_start_date">Employment Start Date</Label>
                  <Input
                    id="employment_start_date"
                    type="date"
                    value={newCase.employment_start_date}
                    onChange={(e) => setNewCase({...newCase, employment_start_date: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="employment_end_date">Employment End Date</Label>
                  <Input
                    id="employment_end_date"
                    type="date"
                    value={newCase.employment_end_date}
                    onChange={(e) => setNewCase({...newCase, employment_end_date: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="client_email">Client Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={newCase.client_email}
                    onChange={(e) => setNewCase({...newCase, client_email: e.target.value})}
                    placeholder="hr@greenvalleyfarms.com"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit">Create Case</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Cases List */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
              <p className="text-gray-600">
                {cases.length === 0 
                  ? "Create your first H2A case to get started"
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCases.map((case_item) => (
            <Card key={case_item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* Case Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {case_item.case_number}
                      </h3>
                      <Badge className={getStatusColor(case_item.status)}>
                        {getStatusIcon(case_item.status)}
                        <span className="ml-1 capitalize">{case_item.status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge className={getPriorityColor(case_item.priority_level)}>
                        {case_item.priority_level}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{case_item.client_name}</span>
                      </div>
                      
                      {case_item.number_of_workers && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{case_item.number_of_workers} workers</span>
                        </div>
                      )}
                      
                      {case_item.client_email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{case_item.client_email}</span>
                        </div>
                      )}
                      
                      {case_item.employment_start_date && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Start: {formatDate(case_item.employment_start_date)}</span>
                        </div>
                      )}
                      
                      {case_item.employment_end_date && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>End: {formatDate(case_item.employment_end_date)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Created: {formatDate(case_item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Deadlines */}
                  <div className="space-y-2">
                    {case_item.rfe_deadline && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-yellow-700">RFE Deadline</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(case_item.rfe_deadline)}
                        </div>
                        <div className="text-xs text-yellow-600">
                          {getDaysUntilDeadline(case_item.rfe_deadline)} days remaining
                        </div>
                      </div>
                    )}
                    
                    {case_item.appeal_deadline && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-red-700">Appeal Deadline</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(case_item.appeal_deadline)}
                        </div>
                        <div className="text-xs text-red-600">
                          {getDaysUntilDeadline(case_item.appeal_deadline)} days remaining
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600 text-center">
        Showing {filteredCases.length} of {cases.length} cases
      </div>
    </div>
  );
};

export default CaseDashboard;