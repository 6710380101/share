import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SiteSettings, DEFAULT_CATEGORIES, DEFAULT_EDUCATION_LEVELS } from '../types';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { useAuth } from './AuthContext';

const defaultSettings: SiteSettings = {
  siteName: 'คลังปัญญา (KlangPanya)',
  siteDescription: 'ศูนย์กลางรวบรวมและแบ่งปันสื่อการเรียนการสอน ความรู้ และทรัพยากรการศึกษาสำหรับนักเรียน นักศึกษา และครูอาจารย์',
  announcement: 'ยินดีต้อนรับสู่คลังปัญญา แพลตฟอร์มแบ่งปันความรู้เพื่อการศึกษาไทย ร่วมแบ่งปันเอกสาร สไลด์ วิดีโอ ได้ฟรี!',
  announcementActive: true,
  categories: DEFAULT_CATEGORIES,
  educationLevels: DEFAULT_EDUCATION_LEVELS,
};

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'general');

    const unsubscribe = onSnapshot(
      settingsDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteSettings;
          setSettings({
            ...defaultSettings,
            ...data,
            categories: data.categories?.length ? data.categories : defaultSettings.categories,
            educationLevels: data.educationLevels?.length ? data.educationLevels : defaultSettings.educationLevels,
          });
        } else {
          // If settings document doesn't exist yet, seed it if user is admin
          if (isAdmin && user) {
            try {
              await setDoc(settingsDocRef, {
                ...defaultSettings,
                updatedAt: new Date().toISOString(),
                updatedBy: user.uid,
              });
            } catch (err) {
              console.warn('Initial settings bootstrap delayed until permission granted:', err);
            }
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Settings snapshot error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin, user]);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      const settingsDocRef = doc(db, 'settings', 'general');
      const payload = {
        ...newSettings,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || 'admin',
      };
      await setDoc(settingsDocRef, payload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/general');
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
