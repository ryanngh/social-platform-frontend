import { useEffect, type RefObject } from 'react';
import { useChat } from '../contexts/ChatContext';
import { canReadVisibleConversation } from '../utils/readVisibility';
// Reading requires the newest rendered message to be visible in a focused document.
export function useConversationRead(id: string | undefined, seq: number, root: RefObject<HTMLDivElement | null>, enabled = true) {
  const { markAsRead } = useChat();
  useEffect(() => {
    if (!id || !seq || !enabled) return;
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const node = root.current;
        if (node && canReadVisibleConversation(node, document.visibilityState === 'visible', document.hasFocus())) { const rect=node.getBoundingClientRect(); const front=document.elementFromPoint(Math.max(0, Math.min(window.innerWidth-1, rect.left+rect.width/2)), Math.max(0, rect.bottom-16)); if(front && node.contains(front)) markAsRead(id, seq); }
      });
    };
    const node = root.current;
    node?.addEventListener('scroll', check, { passive: true }); window.addEventListener('focus', check); document.addEventListener('visibilitychange', check);
    const observer = new ResizeObserver(check); if (node) observer.observe(node);
    check();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); node?.removeEventListener('scroll', check); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check); };
  }, [id, seq, enabled, root, markAsRead]);
}
