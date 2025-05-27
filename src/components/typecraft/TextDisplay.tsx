"use client";

import { cn } from "@/lib/utils";

interface TextDisplayProps {
  textToType: string;
  typedText: string;
  currentIndex: number;
  errors: Set<number>;
  isLoading: boolean;
}

export default function TextDisplay({
  textToType,
  typedText,
  currentIndex,
  errors,
  isLoading,
}: TextDisplayProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl p-6 bg-card rounded-lg shadow-lg text-center text-muted-foreground">
        Loading text...
      </div>
    );
  }

  if (!textToType) {
    return (
      <div className="w-full max-w-2xl p-6 bg-card rounded-lg shadow-lg text-center text-muted-foreground">
        Press Restart to begin.
      </div>
    );
  }
  
  return (
    <div 
      className="w-full max-w-2xl p-6 bg-card rounded-lg shadow-lg text-2xl leading-relaxed font-mono select-none"
      style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
      aria-live="polite"
    >
      {textToType.split("").map((char, index) => {
        let charStateClass = "text-muted-foreground"; // Upcoming text
        const isCurrent = index === currentIndex;
        const isTyped = index < currentIndex;

        if (isCurrent) {
          charStateClass = "text-foreground animate-pulse border-b-2 border-primary";
        } else if (isTyped) {
          if (errors.has(index)) {
            charStateClass = "text-destructive bg-destructive/20";
          } else if (typedText[index] === char) {
            charStateClass = "text-foreground/60"; // Correctly typed
          } else {
             // This case should ideally not happen if errors set is maintained correctly
             // but as a fallback, treat as incorrect if typed and not matching
            charStateClass = "text-destructive bg-destructive/20";
          }
        }
        
        // Handle case where typedText might be shorter than index (e.g. after backspace)
        if (isTyped && index >= typedText.length) {
             charStateClass = "text-muted-foreground"; // Treat as upcoming if effectively untyped due to backspace
        }


        return (
          <span
            key={index}
            className={cn(
              "transition-colors duration-100 ease-in-out",
              charStateClass,
              char === " " && isCurrent && "bg-primary/20", // Special background for space
              char === " " && !isCurrent && isTyped && errors.has(index) && "bg-destructive/30",
              char === " " && !isCurrent && isTyped && !errors.has(index) && "bg-transparent" // Ensure typed spaces are transparent
            )}
          >
            {char === "\n" && isCurrent ? "↵\n" : char} 
          </span>
        );
      })}
    </div>
  );
}
