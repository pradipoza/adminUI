import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [temperature, setTemperature] = useState([0.7]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your configuration has been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header 
          title="Settings" 
          subtitle="Configure your chatbot"
        />
        
        <main className="p-6">
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
              <p className="text-slate-500">Configure your WhatsApp AI chatbot settings</p>
            </div>

            <div className="space-y-6">
              {/* API Configuration */}
              <Card className="bg-white shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">API Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="openai-key" className="text-sm font-medium text-slate-700 mb-2">
                        OpenAI API Key
                      </Label>
                      <Input 
                        id="openai-key"
                        type="password" 
                        defaultValue="sk-••••••••••••••••••••"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="model" className="text-sm font-medium text-slate-700 mb-2">
                        Model
                      </Label>
                      <Select defaultValue="gpt-4o">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                          <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chatbot Behavior */}
              <Card className="bg-white shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Chatbot Behavior</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="system-prompt" className="text-sm font-medium text-slate-700 mb-2">
                        System Prompt
                      </Label>
                      <Textarea 
                        id="system-prompt"
                        rows={4}
                        defaultValue="You are a helpful customer service assistant for our company. Answer questions based on the knowledge base and be polite and professional."
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max-length" className="text-sm font-medium text-slate-700 mb-2">
                          Max Response Length
                        </Label>
                        <Input 
                          id="max-length"
                          type="number" 
                          defaultValue="500"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2">
                          Temperature: {temperature[0]}
                        </Label>
                        <Slider
                          value={temperature}
                          onValueChange={setTemperature}
                          max={2}
                          min={0}
                          step={0.1}
                          className="w-full mt-2"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>Conservative</span>
                          <span>Creative</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Database Settings */}
              <Card className="bg-white shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Database Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="postgres-url" className="text-sm font-medium text-slate-700 mb-2">
                        PostgreSQL Connection
                      </Label>
                      <Input 
                        id="postgres-url"
                        type="text" 
                        defaultValue="postgresql://user:••••@localhost:5432/chatbot_db"
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="pgvector" defaultChecked />
                        <Label htmlFor="pgvector" className="text-sm text-slate-700">
                          Enable pgvector extension
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="auto-backup" defaultChecked />
                        <Label htmlFor="auto-backup" className="text-sm text-slate-700">
                          Auto-backup messages
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Settings */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveSettings}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
