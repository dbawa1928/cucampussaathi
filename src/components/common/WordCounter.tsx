import React from 'react';

interface WordCounterProps {
  text: string;
  maxWords?: number;
  className?: string;
}

export const countWords = (str: string): number => {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
};

export const WordCounter: React.FC<WordCounterProps> = ({
  text,
  maxWords = 400,
  className = '',
}) => {
  const currentCount = countWords(text);
  const remaining = maxWords - currentCount;
  const isOver = currentCount > maxWords;
  const isNear = remaining <= 40 && remaining >= 0;

  return (
    <div
      className={`flex items-center justify-between text-xs transition-colors py-1 ${className} ${
        isOver
          ? 'text-[#C62828] font-bold'
          : isNear
          ? 'text-amber-600 font-medium'
          : 'text-[#666666]'
      }`}
    >
      <span>
        {isOver
          ? `Limit exceeded by ${Math.abs(remaining)} words`
          : `${remaining} words remaining`}
      </span>
      <span className="font-mono font-semibold">
        {currentCount} / {maxWords} words
      </span>
    </div>
  );
};
