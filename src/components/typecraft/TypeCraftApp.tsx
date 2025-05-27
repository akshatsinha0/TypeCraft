
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

  const calculateStats = useCallback(() => {
    // Determine elapsed time: if game finished by completing text, use actual time taken.
    // Otherwise (timer ran out), use the full timeLimit.
    let elapsedSeconds;
    if (isFinished && currentIndex === textToType.length && timeRemaining > 0) {
      // Finished by typing all text before timer ran out
      elapsedSeconds = timeLimit - timeRemaining;
    } else {
      // Timer ran out, or game reset before finishing
      elapsedSeconds = timeLimit;
    }
    
    // Ensure elapsedSeconds is at least 1 to avoid division by zero if no time passed (e.g. instant finish/reset)
    // Or if timeLimit was 0.
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
        // Only count characters that were supposed to be typed as mistakes
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
      charsIncorrect: errors.size, // errors.size reflects typed incorrect chars
      totalCharsAttempted,
      mistakesDetail: uniqueMistakeChars.join(','),
    };
  }, [typedText, textToType, errors, timeLimit, timeRemaining, isFinished, currentIndex]);

  const endGame = useCallback(() => {
    setIsTyping(false);
    setIsFinished(true);
    // Interval is cleared by the timer useEffect's cleanup when isTyping becomes false.
    const finalStats = calculateStats();
    setStats(finalStats);
    if (finalStats.mistakesDetail) {
      setPreviousMistakes(finalStats.mistakesDetail);
    } else {
      setPreviousMistakes(undefined);
    }
  }, [calculateStats]); // endGame depends on calculateStats

  // Create a ref for endGame to use in the timer's interval callback.
  // This ensures the interval always calls the latest version of endGame.
  const endGameRef = useRef(endGame);
  useEffect(() => {
    endGameRef.current = endGame;
  }, [endGame]);


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
      setTypedText('');
      setCurrentIndex(0);
      setErrors(new Set());
      setTimeRemaining(timeLimit); 
      setIsTyping(false); 
      setIsFinished(false);
    }
  }, [mode, language, skillLevel, timeLimit, previousMistakes, toast]);

  const resetGame = useCallback((fetchNewText = true) => {
    setIsTyping(false);
    setIsFinished(false);
    setTypedText('');
    setCurrentIndex(0);
    setErrors(new Set());
    setTimeRemaining(timeLimit);
    setStats(null);
    // Interval is cleared by the timer useEffect's cleanup when isTyping becomes false.
    if (fetchNewText) {
      fetchText();
    } else {
      setIsLoadingText(false);
    }
  }, [timeLimit, fetchText]); // fetchText is now a dependency

  useEffect(() => {
    resetGame(true);
  }, [mode, language, skillLevel]); // Removed timeLimit from here as resetGame uses it. fetchText also uses timeLimit.

  useEffect(() => {
    if (!isTyping && !isFinished) {
      setTimeRemaining(timeLimit);
    }
  }, [timeLimit, isTyping, isFinished]);

  // Timer logic
  useEffect(() => {
    if (isTyping) {
      // If starting to type but time is already 0 (e.g. timeLimit was 0 or changed)
      if (timeRemaining <= 0) {
        endGameRef.current();
        return; // Don't start an interval
      }

      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            // endGameRef.current() will set isTyping to false,
            // which will trigger the cleanup of this useEffect.
            endGameRef.current();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      // Cleanup function: This runs when isTyping becomes false, or component unmounts.
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    } else {
      // If isTyping is false, ensure any existing interval is cleared.
      // This handles cases where isTyping becomes false not from within the interval itself
      // (e.g. reset button).
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [isTyping]); // Only depends on isTyping. setTimeRemaining is stable from useState. endGameRef.current provides latest endGame.
                  // timeRemaining is handled internally by the interval and the initial check.

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isFinished || isLoadingText || !textToType) return;

      const { key } = event;

      if (key === ' ' || key === 'Tab' || key.startsWith('Arrow')) {
        event.preventDefault();
      }
      
      if (!isTyping && key.length === 1 && currentIndex < textToType.length && timeRemaining > 0) {
        setIsTyping(true);
      }

      if (!isTyping && key.length === 1 && currentIndex < textToType.length && timeRemaining <=0) {
         // If trying to type but time is already up (e.g. after a quick config change to 0s limit)
         // Do nothing, or perhaps show a message. For now, just don't start.
         return;
      }


      if (key === 'Backspace') {
        if (currentIndex > 0 && isTyping) { // Only allow backspace if typing and not at the beginning
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
          // Placed endGameRef.current() call here as per pattern, 
          // it will set isTyping false and clear interval via useEffect.
          endGameRef.current(); 
        }
      }
    },
    [isTyping, isFinished, isLoadingText, textToType, currentIndex, errors, timeRemaining] // endGameRef is stable.
  );
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


  const handleRestart = () => {
    resetGame(true); 
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

      <Button onClick={handleRestart} variant="default" size="lg" disabled={isLoadingText && isTyping} className="shadow-md">
        <RotateCcw className="mr-2 h-5 w-5" />
        Restart
      </Button>

      {isFinished && stats && (
        <ResultsModal
          stats={stats}
          isOpen={isFinished}
          onClose={() => setIsFinished(false)} // Keep game state as finished, just close modal
          onRestart={handleRestart} // Restart will reset isFinished
          timeLimit={timeLimit}
        />
      )}
    </div>
  );
}

