import React from 'react';
import type { CallReactionItem } from '../../types/call';

interface CallReactionsOverlayProps {
  reactions: CallReactionItem[];
}

export const CallReactionsOverlay: React.FC<CallReactionsOverlayProps> = ({ reactions }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {reactions.map((reaction, index) => {
        // Compute pseudo-random horizontal trajectory based on id
        const randomX = 15 + ((reaction.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 17) % 70);
        const randomDelay = (index % 4) * 0.1;

        return (
          <div
            key={reaction.id}
            className="absolute bottom-16 flex flex-col items-center animate-callReaction"
            style={{
              left: `${randomX}%`,
              animationDelay: `${randomDelay}s`,
            }}
          >
            <span className="text-3xl sm:text-4xl filter drop-shadow-md select-none transform hover:scale-125 transition">
              {reaction.emoji}
            </span>
            <span className="text-[10px] font-semibold text-white/90 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full mt-1 border border-white/10 select-none shadow-xs">
              {reaction.senderName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CallReactionsOverlay;
