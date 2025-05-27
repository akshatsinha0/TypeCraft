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

  const resetGame = useCallback((fetchNewText = true) => {
    setIsTyping(false);
    setIsFinished(false);
    setTypedText('');
    setCurrentIndex(0);
    setErrors(new Set());
    setTimeRemaining(timeLimit);
    setStats(null);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (fetchNewText) {
      fetchText();
    } else {
      // If not fetching new text, ensure loading is false if text is already there
      setIsLoadingText(false);
    }
  }, [timeLimit, mode, language, skillLevel, previousMistakes]);


  const fetchText = useCallback(async () => {
    setIsLoadingText(true);
    try {
      const input: AdaptiveTextGenerationInput = {
        mode,
        skillLevel,
        ...(mode === 'code' && { language }),
        ...(previousMistakes && { previousMistakes }),
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
      setIsLoadingText(false);
      // Reset partial game state for the new text
      setTypedText('');
      setCurrentIndex(0);
      setErrors(new Set());
      setTimeRemaining(timeLimit); // Reset timer for new text
      setIsTyping(false); // Ensure typing stops
      setIsFinished(false);
    }
  }, [mode, language, skillLevel, timeLimit, previousMistakes, toast]);

  useEffect(() => {
    resetGame(true); // Fetch text on initial load and config changes
  }, [mode, language, skillLevel, timeLimit]);
  
  // Ensure timeRemaining is updated when timeLimit changes and game is not active
  useEffect(() => {
    if (!isTyping && !isFinished) {
      setTimeRemaining(timeLimit);
    }
  }, [timeLimit, isTyping, isFinished]);


  const calculateStats = useCallback(() => {
    const durationInMinutes = (timeLimit - timeRemaining) / 60;
    if (durationInMinutes === 0 && typedText.length === 0) { // Avoid division by zero if no typing happened
        return { wpm: 0, accuracy: 0, rawWpm: 0, charsCorrect: 0, charsIncorrect: 0, totalCharsAttempted: 0, mistakesDetail: "" };
    }

    let correctChars = 0;
    const typedCharsArray = typedText.split('');
    let mistakeChars: string[] = [];

    for (let i = 0; i < typedText.length; i++) {
      if (i < textToType.length && typedText[i] === textToType[i] && !errors.has(i)) {
        correctChars++;
      } else if (i < textToType.length && errors.has(i)) {
        mistakeChars.push(textToType[i]);
      }
    }
    
    const totalCharsAttempted = typedText.length;
    const accuracy = totalCharsAttempted > 0 ? (correctChars / totalCharsAttempted) * 100 : 0;
    // Use actual elapsed time or timeLimit if timer ran out
    const effectiveDurationMinutes = (isFinished && timeRemaining > 0 && currentIndex === textToType.length) ? (timeLimit - timeRemaining) / 60 : timeLimit / 60;

    const wpm = effectiveDurationMinutes > 0 ? (correctChars / 5) / effectiveDurationMinutes : 0;
    const rawWpm = effectiveDurationMinutes > 0 ? (totalCharsAttempted / 5) / effectiveDurationMinutes : 0;

    const uniqueMistakeChars = Array.from(new Set(mistakeChars));
    
    return {
      wpm: Math.max(0, wpm), // Ensure WPM is not negative
      accuracy: Math.max(0, accuracy),
      rawWpm: Math.max(0, rawWpm),
      charsCorrect: correctChars,
      charsIncorrect: errors.size,
      totalCharsAttempted,
      mistakesDetail: uniqueMistakeChars.join(','),
    };
  }, [typedText, textToType, errors, timeLimit, timeRemaining, isFinished, currentIndex]);


  const endGame = useCallback(() => {
    setIsTyping(false);
    setIsFinished(true);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    const finalStats = calculateStats();
    setStats(finalStats);
    if (finalStats.mistakesDetail) {
      setPreviousMistakes(finalStats.mistakesDetail);
    } else {
      setPreviousMistakes(undefined); // Clear if no mistakes
    }
  }, [calculateStats]);


  useEffect(() => {
    if (isTyping && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerIntervalRef.current!);
            endGame();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timeRemaining === 0 && isTyping) {
      endGame();
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTyping, timeRemaining, endGame]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isFinished || isLoadingText || !textToType) return;

      const { key } = event;

      // Prevent default for keys that might scroll or interact with the page
      if (key === ' ' || key === 'Tab' || key.startsWith('Arrow')) {
        event.preventDefault();
      }
      
      // Start timer on first valid key press
      if (!isTyping && key.length === 1 && currentIndex < textToType.length) {
        setIsTyping(true);
      }

      if (key === 'Backspace') {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setTypedText((prev) => prev.slice(0, -1));
          // If the character being removed was an error, remove it from errors set
          // The character at `currentIndex - 1` (after decrement) is the one being erased
          if (errors.has(currentIndex - 1)) {
            const newErrors = new Set(errors);
            newErrors.delete(currentIndex - 1);
            setErrors(newErrors);
          }
        }
      } else if (key.length === 1 && currentIndex < textToType.length) { // Handle character input
        const expectedChar = textToType[currentIndex];
        setTypedText((prev) => prev + key);

        if (key !== expectedChar) {
          setErrors((prevErrors) => new Set(prevErrors).add(currentIndex));
        }
        setCurrentIndex((prev) => prev + 1);

        if (currentIndex + 1 === textToType.length) {
          endGame();
        }
      }
    },
    [isTyping, isFinished, isLoadingText, textToType, currentIndex, errors, endGame]
  );
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


  const handleRestart = () => {
    resetGame(true); // Fetch new text on restart
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

      {isLoadingText && !textToType ? (
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
          isLoading={isLoadingText}
        />
      )}

      <Button onClick={handleRestart} variant="default" size="lg" disabled={isLoadingText || isTyping} className="shadow-md">
        <RotateCcw className="mr-2 h-5 w-5" />
        Restart
      </Button>

      {isFinished && stats && (
        <ResultsModal
          stats={stats}
          isOpen={isFinished}
          onClose={() => setIsFinished(false)}
          onRestart={handleRestart}
          timeLimit={timeLimit}
        />
      )}
    </div>
  );
}
