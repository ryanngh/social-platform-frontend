import React, { useState } from 'react';
import { X, Mic, Video, Volume2, Sparkles, Shield, Check } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';

interface CallSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CallSettingsModal: React.FC<CallSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    virtualBgType,
    toggleVirtualBackground,
    isSpeakerOn,
    toggleSpeaker,
    networkQuality,
  } = useCall();

  const [selectedMic, setSelectedMic] = useState('Default - Microphone (Built-in)');
  const [selectedCam, setSelectedCam] = useState('Default - HD Web Camera');
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [hdVideo, setHdVideo] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#18181E] border border-white/10 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0095F6]" />
            <h3 className="text-sm font-bold">Cài đặt cuộc gọi & Hiệu ứng</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-xs">
          {/* Virtual Background Selection */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Hiệu ứng nền ảo (Virtual Background)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { type: 'none', label: 'Mặc định', bg: 'bg-gray-800' },
                { type: 'blur', label: 'Làm mờ', bg: 'bg-gradient-to-tr from-slate-700 to-slate-900' },
                { type: 'studio', label: 'Studio Pro', bg: 'bg-gradient-to-tr from-indigo-900 to-slate-900' },
                { type: 'gradient', label: 'Cyberpunk', bg: 'bg-gradient-to-tr from-purple-900 via-pink-900 to-blue-900' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => toggleVirtualBackground(item.type as 'none' | 'blur' | 'studio' | 'gradient')}
                  className={`h-16 rounded-2xl ${item.bg} border-2 flex flex-col items-center justify-center p-1.5 transition cursor-pointer relative overflow-hidden group ${
                    virtualBgType === item.type
                      ? 'border-[#0095F6] ring-2 ring-[#0095F6]/40 shadow-sm'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {virtualBgType === item.type && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#0095F6] rounded-full flex items-center justify-center text-[9px] text-white">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-white/90 text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Input Device */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-blue-400" />
              <span>Thiết bị Micro</span>
            </label>
            <select
              value={selectedMic}
              onChange={(e) => setSelectedMic(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#0095F6]"
            >
              <option value="Default - Microphone (Built-in)" className="bg-[#18181E]">
                Default - Microphone (Built-in)
              </option>
              <option value="Headset Microphone (Bluetooth)" className="bg-[#18181E]">
                Tai nghe không dây Bluetooth (AirPods / Earphones)
              </option>
            </select>
          </div>

          {/* Camera Input Device */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-blue-400" />
              <span>Camera Video</span>
            </label>
            <select
              value={selectedCam}
              onChange={(e) => setSelectedCam(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#0095F6]"
            >
              <option value="Default - HD Web Camera" className="bg-[#18181E]">
                Default - HD Web Camera (720p / 1080p)
              </option>
              <option value="Front Camera" className="bg-[#18181E]">
                Front FaceTime HD Camera
              </option>
            </select>
          </div>

          {/* Audio Output */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-semibold block text-xs">Loa ngoài công suất cao</span>
                <span className="text-[10px] text-gray-400">Tối ưu âm lượng to và rõ ràng</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isSpeakerOn}
              onChange={toggleSpeaker}
              className="w-4 h-4 accent-[#0095F6] cursor-pointer"
            />
          </div>

          {/* AI Noise Suppression */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <div>
                <span className="font-semibold block text-xs">Lọc tiếng ồn thông minh (AI Krisp)</span>
                <span className="text-[10px] text-gray-400">Khử tạp âm môi trường và tiếng vang</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={noiseSuppression}
              onChange={(e) => setNoiseSuppression(e.target.checked)}
              className="w-4 h-4 accent-[#0095F6] cursor-pointer"
            />
          </div>

          {/* HD Video Quality */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <span className="font-semibold block text-xs">Chất lượng Full HD (1080p 60fps)</span>
              <span className="text-[10px] text-gray-400">
                Tình trạng đường truyền: <strong className="text-emerald-400 capitalize">{networkQuality}</strong>
              </span>
            </div>
            <input
              type="checkbox"
              checked={hdVideo}
              onChange={(e) => setHdVideo(e.target.checked)}
              className="w-4 h-4 accent-[#0095F6] cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#004AC6] hover:bg-[#003ba0] text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            Đã xong
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallSettingsModal;
