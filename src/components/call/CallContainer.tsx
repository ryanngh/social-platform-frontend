import React from 'react';
import { useCall } from '../../contexts/CallContext';
import IncomingCallModal from './IncomingCallModal';
import ActiveCallModal from './ActiveCallModal';
import FloatingCallWidget from './FloatingCallWidget';

export const CallContainer: React.FC = () => {
  const { status, viewMode } = useCall();

  if (status === 'idle') return null;

  return (
    <>
      {/* 1. Incoming Call Prompt Modal */}
      {status === 'incoming' && <IncomingCallModal />}

      {/* 2. Active Call Expanded Modal or Fullscreen */}
      {(status === 'calling' || status === 'connected') &&
        (viewMode === 'modal' || viewMode === 'fullscreen') && <ActiveCallModal />}

      {/* 3. Floating Picture-in-Picture Calling UI (Draggable Widget) */}
      {(status === 'calling' || status === 'connected') &&
        (viewMode === 'floating' || viewMode === 'minimized') && <FloatingCallWidget />}
    </>
  );
};

export default CallContainer;
