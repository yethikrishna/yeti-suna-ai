'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Loader2
} from 'lucide-react';

interface EmailComposerProps {
  onEmailProcessed: () => void;
}

interface ProcessingResult {
  success: boolean;
  message: string;
  email_log_id?: string;
  message_id?: string;
}

const EmailComposer: React.FC<EmailComposerProps> = ({ onEmailProcessed }) => {
  const [formData, setFormData] = useState({
    from_email: 'rfe.notices@uscis.gov',
    to_email: 'paralegal@immigrationlaw.com',
    subject: 'Request for Evidence - Receipt Number MSC2025001234',
    content: ''
  });

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Pre-defined email templates
  const emailTemplates = {
    rfe: {
      subject: 'Request for Evidence - Receipt Number MSC2025001234',
      from_email: 'rfe.notices@uscis.gov',
      content: `Dear Petitioner,

This notice is to inform you that additional evidence is required for the above petition. You must submit the requested evidence within 87 days from the date of this notice.

EVIDENCE REQUESTED:

1. RECRUITMENT DOCUMENTATION
   - Provide evidence of recruitment efforts conducted in accordance with 20 CFR 655.135
   - Submit copies of all job postings, newspaper advertisements, and contact with former U.S. workers
   - Include documentation of wages offered and working conditions

2. HOUSING INSPECTION REPORTS
   - Submit current housing inspection reports from appropriate state or local authority
   - Reports must be dated within the last 12 months
   - Include documentation that housing meets applicable safety and health standards

3. TRANSPORTATION ARRANGEMENTS
   - Provide detailed documentation of transportation arrangements for workers
   - Include evidence of compliance with applicable safety standards
   - Submit copies of any transportation contracts or agreements

4. PREVAILING WAGE DETERMINATION
   - Submit evidence that the wage offered meets or exceeds the prevailing wage
   - Include documentation from the Department of Labor wage determination
   - Provide evidence of actual wages paid to similarly employed workers

FAILURE TO RESPOND: If you do not respond to this request within 87 days, we may deny your petition based on the evidence in the record.

Please submit your response to the address shown below and include a copy of this notice with your response.

Sincerely,
USCIS Administrative Appeals Office

Receipt Number: MSC2025001234
Case Type: H-2A Temporary Agricultural Workers`
    },
    approval: {
      subject: 'Approval Notice - Receipt Number MSC2025001234',
      from_email: 'approvals@uscis.gov',
      content: `Dear Petitioner,

We are pleased to inform you that your Form I-129, Petition for Nonimmigrant Worker, has been approved.

CASE DETAILS:
Receipt Number: MSC2025001234
Petitioner: Green Valley Farms LLC
Classification: H-2A Temporary Agricultural Worker
Number of Workers: 25
Validity Period: April 1, 2025 to October 31, 2025

NEXT STEPS:
1. Workers must apply for H-2A visas at U.S. Embassy or Consulate
2. Present this approval notice when applying for visas
3. Workers may enter the United States no earlier than 10 days before employment start date

IMPORTANT NOTES:
- This approval is valid only for the specific workers and time period listed
- Any changes to the petition require filing an amended petition
- Workers must maintain valid H-2A status throughout their stay

Please retain this notice for your records and provide copies to the beneficiary workers.

Sincerely,
USCIS Service Center

Receipt Number: MSC2025001234
Priority Date: January 15, 2025
Approval Date: March 10, 2025`
    },
    denial: {
      subject: 'Denial Notice - Receipt Number EAC2025005678',
      from_email: 'denials@uscis.gov',
      content: `Dear Petitioner,

After careful review of your Form I-129, Petition for Nonimmigrant Worker, we must deny your petition for the following reasons:

REASONS FOR DENIAL:

1. INSUFFICIENT RECRUITMENT EVIDENCE
   - The submitted recruitment documentation does not demonstrate compliance with 20 CFR 655.135
   - Job postings did not include all required information about wages and working conditions
   - No evidence provided of contact with former U.S. workers

2. INADEQUATE HOUSING DOCUMENTATION
   - Housing inspection reports are outdated (more than 12 months old)
   - Inspection reports do not demonstrate compliance with applicable safety standards
   - No evidence of adequate housing capacity for requested number of workers

3. PREVAILING WAGE ISSUES
   - Wage determination provided is expired
   - No evidence that offered wage meets current prevailing wage requirements
   - Insufficient documentation of wages paid to similarly employed workers

APPEAL RIGHTS:
You may appeal this decision by filing Form I-290B, Notice of Appeal or Motion, within 30 days of the date of this decision. The appeal must be filed with the appropriate fee.

MOTION TO REOPEN/RECONSIDER:
You may file a motion to reopen or reconsider within 30 days of this decision if you believe we made an error in our decision.

Please refer to the enclosed information about your appeal rights and procedures.

Sincerely,
USCIS Administrative Appeals Office

Receipt Number: EAC2025005678
Decision Date: March 15, 2025`
    },
    client_inquiry: {
      subject: 'H-2A Petition Status Inquiry - Green Valley Farms',
      from_email: 'hr@greenvalleyfarms.com',
      content: `Dear Attorney,

I hope this email finds you well. I am writing to inquire about the status of our H-2A petition that was filed in January.

CASE DETAILS:
- Company: Green Valley Farms LLC
- Receipt Number: MSC2025001234 (if available)
- Number of Workers: 25
- Employment Period: April 1 - October 31, 2025
- Crops: Strawberries and seasonal vegetables

CONCERNS:
We are getting close to our planned employment start date and have not received any updates from USCIS. Our workers in Mexico are waiting for confirmation so they can begin the visa application process.

QUESTIONS:
1. What is the current status of our petition?
2. Are there any issues or additional documentation needed?
3. What is the expected timeline for a decision?
4. Should we be preparing for any next steps?

We have already completed our recruitment efforts and have the required housing inspections ready. Please let us know if you need any additional information from us.

Thank you for your assistance with this matter. Please contact me at your earliest convenience.

Best regards,
Maria Rodriguez
HR Director
Green Valley Farms LLC
Phone: (555) 123-4567
Email: hr@greenvalleyfarms.com`
    }
  };

  const handleTemplateSelect = (templateKey: string) => {
    if (templateKey && emailTemplates[templateKey as keyof typeof emailTemplates]) {
      const template = emailTemplates[templateKey as keyof typeof emailTemplates];
      setFormData({
        ...formData,
        subject: template.subject,
        from_email: template.from_email,
        content: template.content
      });
      setSelectedTemplate(templateKey);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch('/api/immigration/process-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          received_date: new Date().toISOString()
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Refresh dashboard data
        onEmailProcessed();
        
        // Clear form after successful processing
        setTimeout(() => {
          setFormData({
            from_email: '',
            to_email: 'paralegal@immigrationlaw.com',
            subject: '',
            content: ''
          });
          setSelectedTemplate('');
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to process email. Please try again.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const getResultIcon = () => {
    if (!result) return null;
    
    if (result.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Email Simulator - H2A Processing</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Simulate incoming emails to test H2A workflow processing and agent responses
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Quick Templates</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a pre-filled template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rfe">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>USCIS RFE Notice</span>
                  </div>
                </SelectItem>
                <SelectItem value="approval">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>USCIS Approval Notice</span>
                  </div>
                </SelectItem>
                <SelectItem value="denial">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>USCIS Denial Notice</span>
                  </div>
                </SelectItem>
                <SelectItem value="client_inquiry">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>Client Status Inquiry</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* From Email */}
            <div className="space-y-2">
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                value={formData.from_email}
                onChange={(e) => handleInputChange('from_email', e.target.value)}
                placeholder="sender@example.com"
                required
              />
            </div>

            {/* To Email */}
            <div className="space-y-2">
              <Label htmlFor="to_email">To Email</Label>
              <Input
                id="to_email"
                type="email"
                value={formData.to_email}
                onChange={(e) => handleInputChange('to_email', e.target.value)}
                placeholder="paralegal@immigrationlaw.com"
                required
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Email subject..."
                required
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Email Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Email content..."
                rows={12}
                required
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Email...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Process Email
                </>
              )}
            </Button>
          </form>

          {/* Result Display */}
          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center space-x-2">
                {getResultIcon()}
                <AlertDescription>
                  <strong>{result.success ? 'Success!' : 'Error:'}</strong> {result.message}
                  {result.email_log_id && (
                    <div className="mt-2">
                      <Badge variant="outline">
                        Log ID: {result.email_log_id}
                      </Badge>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Processing Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How Email Processing Works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Analysis:</strong> AI analyzes email content for type, priority, and case association</li>
              <li>• <strong>Case Matching:</strong> Attempts to associate with existing H2A cases by case number or client</li>
              <li>• <strong>Workflow Execution:</strong> Runs appropriate workflow (RFE, approval, denial, etc.)</li>
              <li>• <strong>Attorney Notification:</strong> Sends Slack notification if required</li>
              <li>• <strong>Document Storage:</strong> Stores email and metadata for case management</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailComposer;