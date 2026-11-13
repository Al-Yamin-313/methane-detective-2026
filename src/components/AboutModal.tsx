import React from 'react';
import { X, Info } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#080E1A] border border-[#243B66] rounded-xl max-w-sm w-full p-6 shadow-2xl relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-[#A8B7D2] hover:text-white hover:bg-[#142240] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-[#142240] border border-[#7CC4FF]/40 flex items-center justify-center mx-auto mb-4 text-[#7CC4FF]">
          <Info className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <p className="font-manrope font-semibold text-white text-sm tracking-wide">
            Developed by team RISING_CODERS_X
          </p>
          <p className="font-mono text-xs text-[#A8B7D2] tracking-wider">
            NASA Space Apps Challenge 2026
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#243B66] text-xs font-inter text-[#DCE6F5] leading-relaxed">
          <p>
            Earth System Trend Detective track: Empowering citizens, students, and scientists to discover and understand invisible greenhouse gas trends using genuine NASA Earth observation data.
          </p>
        </div>

        <div className="mt-3 p-2.5 rounded-lg bg-[#142240] border border-[#243B66] text-[10px] font-inter text-[#A8B7D2] text-left leading-relaxed">
          <span className="font-semibold text-white block mb-0.5">Mandatory Non-Endorsement Notice:</span>
          NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites.
        </div>
      </div>
    </div>
  );
};
