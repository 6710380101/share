import React, { useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const AnnouncementBanner: React.FC = () => {
  const { settings } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  if (!settings.announcementActive || !settings.announcement || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-700 via-sky-700 to-indigo-800 text-white px-4 py-2.5 shadow-xs relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <span className="bg-white/20 p-1 rounded-md shrink-0">
            <Megaphone className="w-4 h-4 text-sky-200" />
          </span>
          <span className="font-medium truncate">{settings.announcement}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-3 p-1 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition shrink-0"
          title="ปิดประกาศนี้"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
