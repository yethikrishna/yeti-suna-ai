'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { saveSettings, loadSettings, AppSettings } from '@/lib/settings'; // Funzioni da creare
import { Loader2 } from 'lucide-react';

// Valori iniziali (potrebbero essere vuoti o caricati)
const initialSettings: AppSettings = {
  openaiApiKey: '',
  openaiModelName: 'gpt-4o',
  geminiApiKey: '',
  geminiModelName: 'gemini-1.5-pro-latest',
  anthropicApiKey: '',
  anthropicModelName: 'claude-3-opus-20240229',
  openrouterApiKey: '',
  openrouterModelName: '', // L'utente dovrà specificare il modello completo es. 'anthropic/claude-3-opus'

  tavilyApiKey: '',
  firecrawlApiKey: '',
  perplexityApiKey: '',
  rapidApiKey: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadedSettings = loadSettings();
    if (loadedSettings) {
      setSettings(loadedSettings);
    }
    setIsLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      toast.error(`Failed to save settings: ${error.message}`);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-3 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Application Settings</CardTitle>
          <CardDescription>
            Manage API keys for AI providers and integrated tools. 
            These settings are saved locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* AI Providers Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">AI Providers</h2>
            <div className="space-y-6">
              {/* OpenAI */}
              <div>
                <h3 className="text-lg font-medium mb-2">OpenAI</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="openaiApiKey">API Key</Label>
                    <Input id="openaiApiKey" name="openaiApiKey" type="password" value={settings.openaiApiKey} onChange={handleChange} placeholder="sk-..." />
                  </div>
                  <div>
                    <Label htmlFor="openaiModelName">Model Name</Label>
                    <Input id="openaiModelName" name="openaiModelName" value={settings.openaiModelName} onChange={handleChange} placeholder="e.g., gpt-4o" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Gemini */}
              <div>
                <h3 className="text-lg font-medium mb-2">Google Gemini</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="geminiApiKey">API Key</Label>
                    <Input id="geminiApiKey" name="geminiApiKey" type="password" value={settings.geminiApiKey} onChange={handleChange} placeholder="AIzaSy..." />
                  </div>
                  <div>
                    <Label htmlFor="geminiModelName">Model Name</Label>
                    <Input id="geminiModelName" name="geminiModelName" value={settings.geminiModelName} onChange={handleChange} placeholder="e.g., gemini-1.5-pro-latest" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Anthropic */}
              <div>
                <h3 className="text-lg font-medium mb-2">Anthropic</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="anthropicApiKey">API Key</Label>
                    <Input id="anthropicApiKey" name="anthropicApiKey" type="password" value={settings.anthropicApiKey} onChange={handleChange} placeholder="sk-ant-..." />
                  </div>
                  <div>
                    <Label htmlFor="anthropicModelName">Model Name</Label>
                    <Input id="anthropicModelName" name="anthropicModelName" value={settings.anthropicModelName} onChange={handleChange} placeholder="e.g., claude-3-opus-20240229" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* OpenRouter */}
              <div>
                <h3 className="text-lg font-medium mb-2">OpenRouter</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="openrouterApiKey">API Key</Label>
                    <Input id="openrouterApiKey" name="openrouterApiKey" type="password" value={settings.openrouterApiKey} onChange={handleChange} placeholder="sk-or-v1-..." />
                  </div>
                  <div>
                    <Label htmlFor="openrouterModelName">Model Name (e.g., anthropic/claude-3-opus)</Label>
                    <Input id="openrouterModelName" name="openrouterModelName" value={settings.openrouterModelName} onChange={handleChange} placeholder="provider/model-name" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Tool API Keys Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Tool API Keys</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tavilyApiKey">Tavily API Key</Label>
                <Input id="tavilyApiKey" name="tavilyApiKey" type="password" value={settings.tavilyApiKey} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="firecrawlApiKey">Firecrawl API Key</Label>
                <Input id="firecrawlApiKey" name="firecrawlApiKey" type="password" value={settings.firecrawlApiKey} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="perplexityApiKey">Perplexity API Key</Label>
                <Input id="perplexityApiKey" name="perplexityApiKey" type="password" value={settings.perplexityApiKey} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="rapidApiKey">RapidAPI Key</Label>
                <Input id="rapidApiKey" name="rapidApiKey" type="password" value={settings.rapidApiKey} onChange={handleChange} />
              </div>
            </div>
          </section>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
