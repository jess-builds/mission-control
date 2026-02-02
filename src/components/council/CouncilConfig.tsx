'use client';

import React, { useState, useEffect } from 'react';
import { CouncilService } from '@/services/councilService';
import { RoundTemplate } from '@/types/council';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Rocket } from 'lucide-react';

interface CouncilConfigProps {
  onStart: (config: {
    template?: 'standard' | 'quick' | 'freeForAll';
    customRounds?: any[];
    contextPrompt?: string;
  }) => void;
}

export default function CouncilConfig({ onStart }: CouncilConfigProps) {
  const [templates, setTemplates] = useState<Record<string, RoundTemplate>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [contextPrompt, setContextPrompt] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await CouncilService.getTemplates();
      setTemplates(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setLoading(false);
    }
  };

  const handleStart = () => {
    onStart({
      template: selectedTemplate as 'standard' | 'quick' | 'freeForAll',
      contextPrompt: contextPrompt.trim() || undefined,
    });
  };

  if (loading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">START A NEW COUNCIL</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Choose a template:</h2>
          <div className="grid gap-4">
            {Object.entries(templates).map(([key, template]) => (
              <Card
                key={key}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedTemplate === key
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => setSelectedTemplate(key)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <input
                      type="radio"
                      checked={selectedTemplate === key}
                      onChange={() => setSelectedTemplate(key)}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {key === 'standard' && '📋'} 
                      {key === 'quick' && '⚡'} 
                      {key === 'freeForAll' && '🌊'} 
                      {' '}{template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    {template.rounds && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {template.rounds.length} rounds • 
                        {' '}~{Math.round(template.rounds.reduce((sum, r) => sum + r.durationSeconds, 0) / 60)} minutes
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            Optional: Add context
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            What problem are we solving? (optional)
          </p>
          <Textarea
            placeholder="e.g., We need a tool that helps with daily task prioritization..."
            value={contextPrompt}
            onChange={(e) => setContextPrompt(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
        >
          <Rocket className="h-5 w-5 mr-2" />
          Start Council
        </Button>
      </div>
    </div>
  );
}