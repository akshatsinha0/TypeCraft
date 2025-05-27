
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import ModeSelector from './ModeSelector';
import TextDisplay from './TextDisplay';
import TimerDisplay from './TimerDisplay';
import ResultsModal from './ResultsModal';
import { Button } from '@/components/ui/button';
import { RotateCcw, Zap } from 'lucide-react';
import { generateAdaptiveText, type AdaptiveTextGenerationInput } from '@/ai/flows/adaptive-text-generation';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const AVAILABLE_LANGUAGES = ['javascript', 'python', 'java', 'csharp', 'html', 'css', 'typescript', 'go', 'rust', 'php', 'ruby'];

interface Stats {
  wpm: number;
  accuracy: number;
  rawWpm: number;
  charsCorrect: number;
  charsIncorrect: number;
  totalCharsAttempted: number;
  mistakesDetail: string;
}

export default function TypeCraftApp() {
  const [mode, setMode] = useState<'general' | 'code'>('general');
  const [language, setLanguage] = useState<string>('javascript');
  const [skillLevel, setSkillLevel] = useState<number>(5);
  const [timeLimit, setTimeLimit] = useState<number>(30);

  const [textToType, setTextToType] = useState<string>('');
  const [typedText, setTypedText] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [errors, setErrors] = useState<Set<number>>(new Set());
  
  const [timeRemaining, setTimeRemaining] = useState<number>(timeLimit);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingText, setIsLoadingText] = useState<boolean>(true);
  const [previousMistakes, setPreviousMistakes] = useState<string | undefined>(undefined);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const gameProcessedRef = useRef<boolean>(false); // To ensure endGame logic runs once

  const calculateStats = useCallback(() => {
    let elapsedSeconds;
    // Use isFinished state directly for calculation logic
    if (isFinished && currentIndex === textToType.length && timeRemaining > 0) {
      elapsedSeconds = timeLimit - timeRemaining;
    } else {
      elapsedSeconds = timeLimit;
    }
    
    const durationInMinutes = Math.max(1, elapsedSeconds) / 60;

    if (typedText.length === 0 && durationInMinutes === 0) {
        return { wpm: 0, accuracy: 0, rawWpm: 0, charsCorrect: 0, charsIncorrect: 0, totalCharsAttempted: 0, mistakesDetail: "" };
    }

    let correctChars = 0;
    const mistakeChars: string[] = [];

    for (let i = 0; i < typedText.length; i++) {
      if (i < textToType.length && typedText[i] === textToType[i] && !errors.has(i)) {
        correctChars++;
      } else if (i < textToType.length && errors.has(i)) {
        if (textToType[i]) mistakeChars.push(textToType[i]);
      }
    }
    
    const totalCharsAttempted = typedText.length;
    const accuracy = totalCharsAttempted > 0 ? (correctChars / totalCharsAttempted) * 100 : 0;
    
    const wpm = durationInMinutes > 0 ? (correctChars / 5) / durationInMinutes : 0;
    const rawWpm = durationInMinutes > 0 ? (totalCharsAttempted / 5) / durationInMinutes : 0;

    const uniqueMistakeChars = Array.from(new Set(mistakeChars));
    
    return {
      wpm: Math.max(0, wpm),
      accuracy: Math.max(0, accuracy),
      rawWpm: Math.max(0, rawWpm),
      charsCorrect: correctChars,
      charsIncorrect: errors.size, 
      totalCharsAttempted,
      mistakesDetail: uniqueMistakeChars.join(','),
    };
  }, [typedText, textToType, errors, timeLimit, timeRemaining, isFinished, currentIndex]);


  const fetchText = useCallback(async () => {
    setIsLoadingText(true);
    try {
      const input: AdaptiveTextGenerationInput = {
        mode,
        skillLevel,
        ...(mode === 'code' && { language }),
        ...(previousMistakes && { previousMistakes }), // Uses current previousMistakes state
      };
      const result = await generateAdaptiveText(input);
      if (result.text && result.text.trim() !== "") {
        setTextToType(result.text);
      } else {
        setTextToType("Couldn't fetch text, please try again. Defaulting to sample text.");
        toast({ title: "Text Generation Failed", description: "Using default text.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to fetch adaptive text:", error);
      setTextToType("Error fetching text. This is a sample text for practice.");
      toast({ title: "Error", description: "Failed to fetch text. Please try again.", variant: "destructive" });
    } finally {
      // Reset only states directly related to the new text snippet
      setTypedText('');
      setCurrentIndex(0);
      setErrors(new Set());
      setIsLoadingText(false);
      // DO NOT change isFinished, stats, or isTyping here.
    }
  }, [mode, language, skillLevel, timeLimit, previousMistakes, toast]); // previousMistakes is a dependency.

  const endGame = useCallback(() => {
    if (gameProcessedRef.current) return; // Prevent multiple executions
    gameProcessedRef.current = true;

    setIsTyping(false);
    setIsFinished(true); // Set game as finished
    const finalStats = calculateStats();
    setStats(finalStats);
    if (finalStats.mistakesDetail) {
      setPreviousMistakes(finalStats.mistakesDetail);
    } else {
      setPreviousMistakes(undefined);
    }
    // DO NOT fetch new text here. Modal should show.
  }, [calculateStats]); // calculateStats is the main dependency here.

  const endGameRef = useRef(endGame);
  useEffect(() => {
    endGameRef.current = endGame;
  }, [endGame]);

  // Effect for when user changes configuration settings OR for initial load
  useEffect(() => {
    gameProcessedRef.current = false; // Reset for new game session
    setIsTyping(false);
    setIsFinished(false);
    setStats(null);
    setPreviousMistakes(undefined); // Clear previous mistakes for a new configuration
    setTimeRemaining(timeLimit);
    // Fetch text will be triggered by the change in previousMistakes if fetchText is a dependency of another effect.
    // Or, call it directly. Let's call it directly for clarity.
    // This fetchText call will use `previousMistakes: undefined`.
    fetchText();
  }, [mode, language, skillLevel, timeLimit]); // fetchText is NOT a dependency here to avoid loops.

  // This effect handles the timer countdown
  useEffect(() => {
    if (!isTyping) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // If time runs out and the game hasn't been processed as finished yet
    if (timeRemaining <= 0 && !gameProcessedRef.current) {
      endGameRef.current();
      return; // Stop the timer interval logic
    }
    
    // If already finished, clear interval
    if (isFinished || gameProcessedRef.current) {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        return;
    }


    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          // Check gameProcessedRef before calling endGame to prevent double execution from here and the effect above
          if (!gameProcessedRef.current) { 
            endGameRef.current();
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isTyping, timeRemaining, isFinished]); // isFinished is added to re-evaluate if timer should run

  // Effect to set initial time remaining when timeLimit changes AND game is not active
  useEffect(() => {
    if (!isTyping && !isFinished) {
      setTimeRemaining(timeLimit);
    }
  }, [timeLimit, isTyping, isFinished]);
  
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isFinished || gameProcessedRef.current || isLoadingText || !textToType) return;

      const { key } = event;

      if (key === ' ' || key === 'Tab' || key.startsWith('Arrow')) {
        event.preventDefault();
      }
      
      if (!isTyping && key.length === 1 && currentIndex < textToType.length && timeRemaining > 0) {
        setIsTyping(true);
      }

      if (!isTyping && key.length === 1 && currentIndex < textToType.length && timeRemaining <=0) {
         return;
      }

      if (key === 'Backspace') {
        if (currentIndex > 0 && isTyping) { 
          setCurrentIndex((prev) => prev - 1);
          setTypedText((prev) => prev.slice(0, -1));
          if (errors.has(currentIndex - 1)) {
            const newErrors = new Set(errors);
            newErrors.delete(currentIndex - 1);
            setErrors(newErrors);
          }
        }
      } else if (key.length === 1 && currentIndex < textToType.length && isTyping) { 
        const expectedChar = textToType[currentIndex];
        setTypedText((prev) => prev + key);

        if (key !== expectedChar) {
          setErrors((prevErrors) => new Set(prevErrors).add(currentIndex));
        }
        setCurrentIndex((prev) => prev + 1);

        if (currentIndex + 1 === textToType.length) {
          // Check gameProcessedRef before calling endGame
          if (!gameProcessedRef.current) {
            endGameRef.current(); 
          }
        }
      }
    },
    [isTyping, isFinished, isLoadingText, textToType, currentIndex, errors, timeRemaining] 
  );
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleRestart = () => {
    gameProcessedRef.current = false; // Reset for new game session
    setIsTyping(false);
    setIsFinished(false);
    setStats(null);
    setTimeRemaining(timeLimit);
    // previousMistakes state is preserved from the last game for adaptive text.
    // If you want to clear mistakes on every restart, uncomment next line:
    // setPreviousMistakes(undefined); 
    fetchText(); 
  };

  return (
    <div className="w-full max-w-3xl flex flex-col items-center space-y-8">
      <header className="text-center">
        <h1 className="text-5xl font-bold text-primary flex items-center justify-center">
          <Zap className="w-12 h-12 mr-2" /> TypeCraft
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Hone your typing skills with AI-powered adaptive text.
        </p>
      </header>

      <ModeSelector
        mode={mode}
        setMode={setMode}
        language={language}
        setLanguage={setLanguage}
        availableLanguages={AVAILABLE_LANGUAGES}
        timeLimit={timeLimit}
        setTimeLimit={setTimeLimit}
        skillLevel={skillLevel}
        setSkillLevel={setSkillLevel}
        isLoading={isLoadingText || isTyping}
      />
      
      <TimerDisplay timeRemaining={timeRemaining} />

      {isLoadingText && !textToType && !isFinished ? ( // Don't show skeleton if results are showing
         <div className="w-full max-w-2xl p-6 bg-card rounded-lg shadow-lg space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-1/2" />
         </div>
      ) : (
        <TextDisplay
          textToType={textToType}
          typedText={typedText}
          currentIndex={currentIndex}
          errors={errors}
          isLoading={isLoadingText && !isFinished} // Only show loading text if not finished
        />
      )}

      <Button onClick={handleRestart} variant="default" size="lg" disabled={isLoadingText && isTyping} className="shadow-md">
        <RotateCcw className="mr-2 h-5 w-5" />
        Restart
      </Button>

      {isFinished && stats && (
        <ResultsModal
          stats={stats}
          isOpen={isFinished}
          onClose={() => {
            setIsFinished(false);
            gameProcessedRef.current = false; // Allow new game if modal is closed manually
          }} 
          onRestart={handleRestart} 
          timeLimit={timeLimit}
        />
      )}
    </div>
  );
}

// AppPrototyperTouchedV3
