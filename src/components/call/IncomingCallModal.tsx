import React, { useState } from 'react';
import { Phone, PhoneOff, Video, MessageSquare } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import toast from 'react-hot-toast';

export const IncomingCallModal: React.FC = () => {
  const { status, type, partner, acceptCall, declineCall } = useCall();
  const [showQuickMessage, setShowQuickMessage] = useState(false);

  if (status !== 'incoming' || !partner) return null;

  const isVideo = type === 'video';

  const handleDeclineWithMessage = (message: string) => {
    toast.success(`Đã từ chối và gửi tin nhắn: "${message}"`);
    declineCall();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-blue-500/20 filter blur-3xl -z-10 animate-pulse" />

      <div className="bg-[#141419]/90 border border-white/15 rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-2xl relative overflow-hidden backdrop-blur-2xl animate-scaleUp">
        {/* Top Call Type Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-medium text-white/90 mb-6 shadow-xs">
          {isVideo ? (
            <>
              <Video className="w-3.5 h-3.5 text-blue-400" />
              <span>Cuộc gọi video đến</span>
            </>
          ) : (
            <>
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cuộc gọi thoại đến</span>
            </>
          )}
        </div>

        {/* Pulsing Caller Avatar */}
        <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ripple" />
          <div className="absolute -inset-2 rounded-full bg-emerald-500/20 animate-pulse" />
          <img
            src={partner.avatarUrl}
            alt={partner.name}
            className="w-24 h-24 rounded-full object-cover border-3 border-white/80 shadow-lg relative z-10"
          />
        </div>

        {/* Caller Info */}
        <h2 className="text-lg font-bold text-white tracking-tight mb-0.5">{partner.name}</h2>
        <p className="text-xs text-gray-400 mb-6">
          {partner.username ? `@${partner.username}` : 'Người dùng RySocial'}
        </p>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-6">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={declineCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Từ chối cuộc gọi"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-[11px] text-gray-400 font-medium">Từ chối</span>
          </div>

          {/* Quick Message Reply Option */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => setShowQuickMessage(!showQuickMessage)}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center hover:scale-105 transition cursor-pointer"
              title="Gửi tin nhắn nhanh"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-gray-400">Tin nhắn</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition cursor-pointer animate-pulse"
              title="Chấp nhận cuộc gọi"
            >
              {isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </button>
            <span className="text-[11px] text-emerald-400 font-semibold">Trả lời</span>
          </div>
        </div>

        {/* Quick Message Reply Dropdown / Options */}
        {showQuickMessage && (
          <div className="mt-5 p-2 bg-black/50 border border-white/10 rounded-2xl space-y-1.5 text-left text-xs animate-fadeIn">
            <p className="text-[10px] font-semibold text-gray-400 px-2 py-1">Tin nhắn phản hồi nhanh:</p>
            {[
              'Tôi đang bận, sẽ gọi lại sau nhé!',
              'Có việc gì gấp không bạn ơi?',
              'Đang trong cuộc họp, nhắn tin giúp mình nhé.',
            ].map((msg, i) => (
              <button
                key={i}
                onClick={() => handleDeclineWithMessage(msg)}
                className="w-full text-left px-3 py-2 rounded-xl text-gray-200 hover:bg-white/10 hover:text-white transition text-xs truncate"
              >
                {msg}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomingCallModal;
