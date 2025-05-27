"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BarChart, CheckCircle, XCircle, Target, Type } from "lucide-react";

interface Stats {
  wpm: number;
  accuracy: number;
  rawWpm: number;
  charsCorrect: number;
  charsIncorrect: number;
  totalCharsAttempted: number;
  mistakesDetail: string; // To pass to AI
}

interface ResultsModalProps {
  stats: Stats | null;
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  timeLimit: number;
}

export default function ResultsModal({
  stats,
  isOpen,
  onClose,
  onRestart,
  timeLimit,
}: ResultsModalProps) {
  if (!stats) return null;

  const StatItem: React.FC<{ icon: React.ElementType; label: string; value: string | number; unit?: string; className?: string }> = ({ icon: Icon, label, value, unit, className }) => (
    <div className={`flex items-center justify-between p-3 bg-accent/10 rounded-md ${className}`}>
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-3 text-primary" />
        <span className="text-sm font-medium text-foreground/80">{label}</span>
      </div>
      <span className="text-lg font-semibold text-foreground">
        {value} {unit}
      </span>
    </div>
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg bg-card text-card-foreground shadow-xl rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-center text-primary flex items-center justify-center">
            <BarChart className="w-7 h-7 mr-2" /> Session Results
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground pt-1">
            Here's how you performed in this {timeLimit}s session.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3 my-6 px-2">
          <StatItem icon={Target} label="WPM (Net)" value={stats.wpm.toFixed(0)} unit="wpm" />
          <StatItem icon={Type} label="Raw WPM" value={stats.rawWpm.toFixed(0)} unit="wpm" />
          <StatItem icon={CheckCircle} label="Accuracy" value={stats.accuracy.toFixed(1)} unit="%" />
          <div className="grid grid-cols-2 gap-3">
            <StatItem icon={CheckCircle} label="Correct Chars" value={stats.charsCorrect} className="text-sm"/>
            <StatItem icon={XCircle} label="Incorrect Chars" value={stats.charsIncorrect} className="text-sm"/>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Close</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onRestart} className="w-full sm:w-auto">Restart</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
