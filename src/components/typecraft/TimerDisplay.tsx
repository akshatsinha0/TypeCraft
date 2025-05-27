"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TimerDisplayProps {
  timeRemaining: number;
}

export default function TimerDisplay({ timeRemaining }: TimerDisplayProps) {
  return (
    <Card className="mb-8 bg-card shadow-md">
      <CardContent className="p-4 flex items-center justify-center">
        <Clock className="h-6 w-6 mr-3 text-primary" />
        <span className="text-3xl font-bold text-foreground">
          {timeRemaining}s
        </span>
      </CardContent>
    </Card>
  );
}
