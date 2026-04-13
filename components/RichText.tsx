"use client";

import React from 'react';

interface Effect {
  id: string;
  name: string;
  type: string;
  effect: string;
}

interface RichTextProps {
  text: string;
  effects: Effect[];
  onEffectClick: (effect: Effect) => void;
  className?: string;
}

export default function RichText({ text, effects, onEffectClick, className }: RichTextProps) {
  if (!text) return null;

  // Sort effects by name length descending to match longer names first (e.g., "会心" vs "会心几率" if both existed)
  const sortedEffects = [...effects].sort((a, b) => b.name.length - a.name.length);
  
  // Create a regex that matches any of the effect names
  // We need to escape special characters in names if any (though unlikely here)
  const effectNames = sortedEffects.map(e => e.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (effectNames.length === 0) return <span className={className}>{text}</span>;

  const regex = new RegExp(`(${effectNames.join('|')})`, 'g');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const effect = sortedEffects.find(e => e.name === part);
        if (effect) {
          return (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEffectClick(effect);
              }}
              className="text-blue-600 font-bold underline hover:text-blue-800 transition-colors cursor-pointer inline-block"
            >
              {part}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
