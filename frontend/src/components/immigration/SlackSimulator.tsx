'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface SlackSimulatorProps {
  onMessageSent: () => void;
}

interface SlackMessage {
  id: string;
  message_type: string;
  message_content: string;
  priority_level: string;
  case_id?: string;
  attorney_response?: string;
  response_date?: string;
  response_type?: string;
  created_at: string;
}

const SlackSimulator: React.FC<SlackSimulatorProps> = ({ onMessageSent }) => {
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  
  const [newResponse, setNewResponse] = useState('');
  const [responseType, setResponseType] = useState('feedback');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSlackMessages();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchSlackMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSlackMessages = async () => {
    try {
      const response = await fetch('/api/immigration/dashboard');
      const data = await response.json();
      
      if (data.success && data.dashboard.recent_slack_messages) {
        // Sort messages by creation date
        const sortedMessages = data.dashboard.recent_slack_messages.sort(
          (a: SlackMessage, b: SlackMessage) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error('Error fetching Slack messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async (messageId: string) => {
    if (!newResponse.trim()) return;

    setResponding(messageId);
    
    try {
      const response = await fetch(`/api/immigration/slack/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slack_id: messageId,
          feedback_text: newResponse,
          feedback_type: responseType,
          context: 'Slack conversation feedback'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh messages to show the response
        await fetchSlackMessages();
        onMessageSent();
        setNewResponse('');
        setResponseType('feedback');
      }
    } catch (error) {
      console.error('Error sending response:', error);
    } finally {
      setResponding(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'notification': return '📢';
      case 'question': return '❓';
      case 'draft': return '📝';
      case 'update': return '🔄';
      default: return '💬';
    }
  };

  const formatMessageContent = (content: string) => {
    // Simple formatting for Slack-like appearance
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading Slack messages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Slack Simulator - Attorney Communication</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            View AI agent notifications and provide feedback to improve performance
          </p>
        </CardHeader>
        <CardContent>
          {/* Messages Container */}
          <div className="border rounded-lg bg-gray-50 h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No messages yet</p>
                  <p className="text-sm">Process some emails to see AI notifications here</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="space-y-3">
                  {/* AI Agent Message */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">H2A Assistant</span>
                        <Badge className={getPriorityColor(message.priority_level)}>
                          {getPriorityIcon(message.priority_level)}
                          <span className="ml-1">{message.priority_level}</span>
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {getMessageTypeIcon(message.message_type)} {message.message_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border shadow-sm">
                        <div 
                          className="text-sm whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ 
                            __html: formatMessageContent(message.message_content) 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attorney Response */}
                  {message.attorney_response && (
                    <div className="flex items-start space-x-3 ml-8">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">Attorney</span>
                          <Badge variant="outline" className="bg-green-50">
                            {message.response_type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {message.response_date && new Date(message.response_date).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <p className="text-sm">{message.attorney_response}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Response Input (only for messages without responses) */}
                  {!message.attorney_response && (
                    <div className="ml-8 space-y-3">
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <Label className="text-sm font-medium">Respond as Attorney:</Label>
                        <div className="mt-2 space-y-2">
                          <Select value={responseType} onValueChange={setResponseType}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="approval">✅ Approval</SelectItem>
                              <SelectItem value="correction">❌ Correction</SelectItem>
                              <SelectItem value="instruction">📝 Instruction</SelectItem>
                              <SelectItem value="question">❓ Question</SelectItem>
                              <SelectItem value="feedback">💬 General Feedback</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea
                            value={newResponse}
                            onChange={(e) => setNewResponse(e.target.value)}
                            placeholder="Type your response... (e.g., 'Good work!', 'Don't send urgent notifications for approvals', 'Always include case number in subject')"
                            rows={3}
                            className="resize-none"
                          />
                          <Button
                            onClick={() => handleSendResponse(message.id)}
                            disabled={!newResponse.trim() || responding === message.id}
                            size="sm"
                            className="w-full"
                          >
                            {responding === message.id ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="h-3 w-3 mr-2" />
                                Send Response
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Instructions */}
          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to Use Slack Simulator:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>AI Notifications:</strong> The agent sends notifications here when processing emails</li>
              <li>• <strong>Provide Feedback:</strong> Respond to messages to teach the agent your preferences</li>
              <li>• <strong>Learning System:</strong> Your feedback is stored and used to improve future responses</li>
              <li>• <strong>Real-time Updates:</strong> New messages appear automatically as emails are processed</li>
            </ul>
          </div>

          {/* Sample Feedback Examples */}
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Sample Feedback Examples:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <p><strong>Corrections:</strong></p>
                <ul className="text-gray-600 space-y-1">
                  <li>• "Don't mark approvals as urgent priority"</li>
                  <li>• "Always include client name in notifications"</li>
                  <li>• "RFE deadlines should be 87 days, not 90"</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p><strong>Instructions:</strong></p>
                <ul className="text-gray-600 space-y-1">
                  <li>• "For denials, always schedule appeal consultation"</li>
                  <li>• "Include case number in all Slack messages"</li>
                  <li>• "Notify me immediately for any USCIS emails"</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SlackSimulator;