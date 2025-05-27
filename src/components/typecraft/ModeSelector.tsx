"use client";

import type { Dispatch, SetStateAction } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Type, Code, Clock, BarChartBig } from "lucide-react";

interface ModeSelectorProps {
  mode: 'general' | 'code';
  setMode: Dispatch<SetStateAction<'general' | 'code'>>;
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
  availableLanguages: string[];
  timeLimit: number;
  setTimeLimit: Dispatch<SetStateAction<number>>;
  skillLevel: number;
  setSkillLevel: Dispatch<SetStateAction<number>>;
  isLoading: boolean;
}

const timeOptions = [
  { value: 15, label: "15s" },
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
  { value: 120, label: "120s" },
];

const skillOptions = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `Level ${i + 1}`,
}));

export default function ModeSelector({
  mode,
  setMode,
  language,
  setLanguage,
  availableLanguages,
  timeLimit,
  setTimeLimit,
  skillLevel,
  setSkillLevel,
  isLoading,
}: ModeSelectorProps) {
  return (
    <Card className="w-full max-w-2xl shadow-lg mb-8 bg-card">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-semibold text-foreground">Configuration</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="mode-group" className="flex items-center text-base font-medium">
            <Type className="mr-2 h-5 w-5 text-primary" /> Mode
          </Label>
          <RadioGroup
            id="mode-group"
            value={mode}
            onValueChange={(value: 'general' | 'code') => setMode(value)}
            className="flex space-x-4"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="general" id="general" />
              <Label htmlFor="general" className="cursor-pointer">General Text</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="code" id="code" />
              <Label htmlFor="code" className="cursor-pointer">Code Snippets</Label>
            </div>
          </RadioGroup>
        </div>

        {mode === 'code' && (
          <div className="space-y-2">
            <Label htmlFor="language-select" className="flex items-center text-base font-medium">
              <Code className="mr-2 h-5 w-5 text-primary" /> Language
            </Label>
            <Select
              value={language}
              onValueChange={setLanguage}
              disabled={isLoading}
            >
              <SelectTrigger id="language-select" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="time-limit-select" className="flex items-center text-base font-medium">
            <Clock className="mr-2 h-5 w-5 text-primary" /> Time Limit
          </Label>
          <Select
            value={String(timeLimit)}
            onValueChange={(value) => setTimeLimit(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger id="time-limit-select" className="w-full">
              <SelectValue placeholder="Select time limit" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skill-level-select" className="flex items-center text-base font-medium">
            <BarChartBig className="mr-2 h-5 w-5 text-primary" /> Skill Level
          </Label>
          <Select
            value={String(skillLevel)}
            onValueChange={(value) => setSkillLevel(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger id="skill-level-select" className="w-full">
              <SelectValue placeholder="Select skill level" />
            </SelectTrigger>
            <SelectContent>
              {skillOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
