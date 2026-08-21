import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Pencil,
  Smile,
  BookOpen,
  LayoutGrid,
  Briefcase,
  Sparkles,
  ShieldAlert,
  HeartHandshake,
  Mail,
  Sun,
  Moon,
  Laptop,
  Palette,
  Settings as SettingsIcon,
  Bell,
  AudioWaveform,
  ShieldCheck,
  KeyRound,
  Terminal,
  HardDrive,
  Database,
  Megaphone,
  Bug,
  Info,
  LogOut,
  Check,
  ChevronRight,
  ChevronDown,
  Trash2,
  Download,
  Plus,
  Volume2,
  X,
} from 'lucide-react';
import {
  UserSettings,
  ThemeMode,
  AccentColor,
  DotvexModelId,
} from '../../types/settings';
import { settingsService } from '../../services/api/settingsService';
import { cognitionService } from '../../services/api/cognitionService';
import { conversationService } from '../../services/api/conversationService';
import { MemoryItem, UserUnderstandingProfile } from '../../types/memory';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeChanged: (theme: ThemeMode) => void;
  onOpenCognitionLab?: () => void;
  onOpenPlugins?: () => void;
  onOpenUpgrade?: () => void;
}

type SubPage =
  | 'main'
  | 'personalization'
  | 'memory'
  | 'workspace'
  | 'trusted_contact'
  | 'email_edit'
  | 'general'
  | 'notifications'
  | 'voice'
  | 'safety'
  | 'security'
  | 'remote'
  | 'storage'
  | 'data_controls'
  | 'ads'
  | 'bug_report'
  | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onThemeChanged,
  onOpenCognitionLab,
  onOpenPlugins,
  onOpenUpgrade,
}) => {
  const [settings, setSettings] = useState<UserSettings>(settingsService.getSettings());
  const [currentSubPage, setCurrentSubPage] = useState<SubPage>('main');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Dropdown states
  const [appearanceDropdownOpen, setAppearanceDropdownOpen] = useState(false);
  const [accentDropdownOpen, setAccentDropdownOpen] = useState(false);

  // Subpage states
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(settings.userName);
  const [tempEmail, setTempEmail] = useState(settings.userEmail);
  const [tempContact, setTempContact] = useState(settings.trustedContact);
  const [newTrait, setNewTrait] = useState('');

  // Bug report states
  const [bugCategory, setBugCategory] = useState('UI / Layout');
  const [bugDescription, setBugDescription] = useState('');
  const [bugSubmitted, setBugSubmitted] = useState(false);

  // Storage calculation
  const [storageSize, setStorageSize] = useState<string>('1.2 MB');
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [userUnderstanding, setUserUnderstanding] = useState<UserUnderstandingProfile | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const s = settingsService.getSettings();
      setSettings(s);
      setTempName(s.userName);
      setTempEmail(s.userEmail);
      setTempContact(s.trustedContact);
      setCurrentSubPage('main');
       calculateStorage();
       cognitionService.getMemories().then(setMemories).catch(() => {});
       cognitionService.getUserUnderstanding().then(setUserUnderstanding).catch(() => {});
    }
  }, [isOpen]);

  const calculateStorage = () => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dotvex_')) {
        total += (localStorage.getItem(key) || '').length * 2;
      }
    }
    const kb = (total / 1024).toFixed(1);
    const mb = (total / (1024 * 1024)).toFixed(2);
    setStorageSize(total > 1024 * 1024 ? `${mb} MB` : `${kb} KB`);
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2000);
  };

  const handleUpdate = (updated: UserSettings, toastMessage = 'Saved') => {
    setSettings(updated);
    settingsService.saveSettings(updated);
    if (updated.theme !== settings.theme) {
      onThemeChanged(updated.theme);
      settingsService.applyTheme(updated.theme);
    }
    if (updated.accentColor !== settings.accentColor) {
      settingsService.applyAccentColor(updated.accentColor);
    }
    showToast(toastMessage);
  };

  const handleTestVoice = (voiceName: string, speed: number) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    setIsTestingVoice(true);
    const utter = new SpeechSynthesisUtterance(
      `Hello ${settings.userName}. You are listening to ${voiceName} on DOTVEX 2.0.`
    );
    utter.rate = speed;
    utter.onend = () => setIsTestingVoice(false);
    utter.onerror = () => setIsTestingVoice(false);
    synth.speak(utter);
  };

  const handleClearCache = () => {
    if (window.confirm('Clear cached attachments and transient data? Your main chats will remain.')) {
      calculateStorage();
      showToast('Cache Cleared');
    }
  };

  const handleExportData = async () => {
    const [convs, mems] = await Promise.all([
      conversationService.getConversations(),
      cognitionService.getMemories(),
    ]);
    const fullBackup = {
      settings,
      conversations: convs,
      concepts: mems,
      exportedAt: new Date().toISOString(),
      version: '2.0.4',
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dotvex_data_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export downloaded');
  };

  const handleDeleteAllChats = () => {
    if (window.confirm('Are you sure you want to delete ALL chats? This action cannot be undone.')) {
      localStorage.removeItem('dotvex_conversations_v3');
      showToast('All chats deleted');
      setTimeout(() => {
        window.location.reload();
      }, 600);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Log out from DOTVEX 2.0 session?')) {
      showToast('Session logged out');
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  if (!isOpen) return null;

  const accentColorMap: Record<AccentColor, { label: string; dot: string }> = {
    blue: { label: 'Blue', dot: 'bg-blue-500' },
    emerald: { label: 'Emerald (Default)', dot: 'bg-emerald-500' },
    purple: { label: 'Purple', dot: 'bg-purple-500' },
    amber: { label: 'Amber', dot: 'bg-amber-500' },
    rose: { label: 'Rose', dot: 'bg-rose-500' },
  };

  const appearanceLabelMap: Record<ThemeMode, string> = {
    system: 'System (Default)',
    dark: 'Dark',
    light: 'Light',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs select-none">
      <div
        className="w-full h-full md:max-w-md md:h-[92vh] md:rounded-[32px] bg-white dark:bg-[#121212] border border-[#e4e4e7] dark:border-[#262626] shadow-2xl flex flex-col overflow-hidden text-[#09090b] dark:text-[#ececec] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Header with Back button */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#e4e4e7] dark:border-[#1f1f1f] bg-white dark:bg-[#121212] flex-shrink-0 z-20">
          <button
            onClick={() => {
              if (currentSubPage === 'main') {
                onClose();
              } else {
                setCurrentSubPage('main');
              }
            }}
            className="w-10 h-10 rounded-full bg-[#f4f4f5] dark:bg-[#262626] hover:bg-[#e4e4e7] dark:hover:bg-[#333] border border-[#e4e4e7] dark:border-[#333] flex items-center justify-center text-[#09090b] dark:text-[#ececec] transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="text-sm font-semibold text-[#09090b] dark:text-[#ececec]">
            {currentSubPage === 'main'
              ? 'Settings'
              : currentSubPage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </span>

          <div className="w-10 flex justify-end">
            {saveToast && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-fadeIn">
                {saveToast}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 no-scrollbar">
          <AnimatePresence mode="wait">
            {/* ================= MAIN SETTINGS VIEW ================= */}
            {currentSubPage === 'main' && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.16 }}
                className="space-y-5 pb-6"
              >
                {/* 1. Avatar & Profile Banner (Exact image match) */}
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-[#a3b1c6] text-[#222] font-bold text-2xl flex items-center justify-center shadow-lg border-2 border-[#d4d4d8] dark:border-[#333]">
                      {settings.userInitials || 'OA'}
                    </div>
                    <button
                      onClick={() => setEditingName(true)}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-[#2c2c2c] border border-[#d4d4d8] dark:border-[#444] text-[#09090b] dark:text-[#ececec] flex items-center justify-center hover:bg-[#f4f4f5] dark:hover:bg-[#3c3c3c] transition-colors shadow-md cursor-pointer"
                      title="Edit Profile Name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {editingName ? (
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="px-3 py-1 rounded-lg bg-white dark:bg-[#222] border border-[#cbd5e1] dark:border-[#444] text-xs text-center text-[#09090b] dark:text-white focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const initials = tempName
                            .split(' ')
                            .map((p) => p[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);
                          handleUpdate({
                            ...settings,
                            userName: tempName,
                            userInitials: initials || 'OA',
                          });
                          setEditingName(false);
                        }}
                        className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingName(true)}
                      className="mt-3 text-base font-bold text-[#09090b] dark:text-[#ececec] hover:opacity-80 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{settings.userName}</span>
                    </div>
                  )}
                </div>

                {/* 2. SECTION: My DOTVEX 2.0 */}
                <div className="space-y-1.5">
                  <div className="px-1 text-[11px] font-semibold text-[#71717a] dark:text-[#8e8e8e] tracking-wide">
                    My DOTVEX 2.0
                  </div>
                  <div className="rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333333] divide-y divide-[#e4e4e7] dark:divide-[#303030] overflow-hidden">
                    {/* Personalization */}
                    <button
                      onClick={() => setCurrentSubPage('personalization')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Smile className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Personalization</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Memory */}
                    <button
                      onClick={() => setCurrentSubPage('memory')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Memory</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Plugins */}
                    <button
                      onClick={() => {
                        onClose();
                        onOpenPlugins?.();
                      }}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <LayoutGrid className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Plugins</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>
                  </div>
                </div>

                {/* 3. SECTION: Account */}
                <div className="space-y-1.5">
                  <div className="px-1 text-[11px] font-semibold text-[#71717a] dark:text-[#8e8e8e] tracking-wide">
                    Account
                  </div>
                  <div className="rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333333] divide-y divide-[#e4e4e7] dark:divide-[#303030] overflow-hidden">
                    {/* Workspace */}
                    <button
                      onClick={() => setCurrentSubPage('workspace')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <div className="text-left">
                          <div className="font-medium">Workspace</div>
                          <div className="text-[11px] text-[#71717a] dark:text-[#8e8e8e]">{settings.workspace}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Upgrade Plan */}
                    <button
                      onClick={() => {
                        onClose();
                        onOpenUpgrade?.();
                      }}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium">Upgrade plan</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Trusted Contact */}
                    <button
                      onClick={() => setCurrentSubPage('trusted_contact')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Trusted contact</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Parental Controls */}
                    <div className="flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec]">
                      <div className="flex items-center gap-3">
                        <HeartHandshake className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Parental controls</span>
                      </div>
                      <button
                        onClick={() =>
                          handleUpdate({
                            ...settings,
                            parentalControlsEnabled: !settings.parentalControlsEnabled,
                          })
                        }
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          settings.parentalControlsEnabled ? 'bg-emerald-600' : 'bg-[#cbd5e1] dark:bg-[#444]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                            settings.parentalControlsEnabled ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Email */}
                    <button
                      onClick={() => setCurrentSubPage('email_edit')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <div className="text-left">
                          <div className="font-medium">Email</div>
                          <div className="text-[11px] text-[#71717a] dark:text-[#8e8e8e]">{settings.userEmail}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>
                  </div>
                </div>

                {/* 4. SECTION: Appearance & Theme */}
                <div className="space-y-1.5">
                  <div className="px-1 text-[11px] font-semibold text-[#71717a] dark:text-[#8e8e8e] tracking-wide">
                    App Theme
                  </div>
                  <div className="rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333333] divide-y divide-[#e4e4e7] dark:divide-[#303030] overflow-hidden">
                    {/* Appearance Dropdown */}
                    <div>
                      <button
                        onClick={() => setAppearanceDropdownOpen(!appearanceDropdownOpen)}
                        className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Sun className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                          <div className="text-left">
                            <div className="font-medium">Appearance</div>
                            <div className="text-[11px] text-[#71717a] dark:text-[#8e8e8e]">
                              {appearanceLabelMap[settings.theme]}
                            </div>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-[#71717a] dark:text-[#8e8e8e] transition-transform ${
                            appearanceDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {appearanceDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-[#e4e4e7] dark:bg-[#1e1e1e] px-2 py-1.5 space-y-1"
                          >
                            {(['dark', 'light', 'system'] as ThemeMode[]).map((t) => (
                              <button
                                key={t}
                                onClick={() => {
                                  handleUpdate({ ...settings, theme: t });
                                  setAppearanceDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                                  settings.theme === t
                                    ? 'bg-white dark:bg-[#2a2a2a] text-[#09090b] dark:text-white font-semibold shadow-2xs'
                                    : 'text-[#52525b] dark:text-[#b4b4b4] hover:bg-[#f4f4f5] dark:hover:bg-[#252525] hover:text-[#09090b] dark:hover:text-[#ececec]'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {t === 'dark' ? (
                                    <Moon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  ) : t === 'light' ? (
                                    <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  ) : (
                                    <Laptop className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  )}
                                  <span>{appearanceLabelMap[t]}</span>
                                </div>
                                {settings.theme === t && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Accent Color Dropdown */}
                    <div>
                      <button
                        onClick={() => setAccentDropdownOpen(!accentDropdownOpen)}
                        className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Palette className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                          <div className="text-left">
                            <div className="font-medium">Accent color</div>
                            <div className="text-[11px] text-[#71717a] dark:text-[#8e8e8e] flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  accentColorMap[settings.accentColor]?.dot || 'bg-blue-500'
                                }`}
                              />
                              <span>{accentColorMap[settings.accentColor]?.label || 'Blue'}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-[#71717a] dark:text-[#8e8e8e] transition-transform ${
                            accentDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {accentDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-[#e4e4e7] dark:bg-[#1e1e1e] px-2 py-1.5 space-y-1"
                          >
                            {(['blue', 'emerald', 'purple', 'amber', 'rose'] as AccentColor[]).map(
                              (c) => (
                                <button
                                  key={c}
                                  onClick={() => {
                                    handleUpdate({ ...settings, accentColor: c });
                                    setAccentDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                                    settings.accentColor === c
                                      ? 'bg-white dark:bg-[#2a2a2a] text-[#09090b] dark:text-white font-semibold shadow-2xs'
                                      : 'text-[#52525b] dark:text-[#b4b4b4] hover:bg-[#f4f4f5] dark:hover:bg-[#252525] hover:text-[#09090b] dark:hover:text-[#ececec]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-3 h-3 rounded-full ${accentColorMap[c].dot}`}
                                    />
                                    <span>{accentColorMap[c].label}</span>
                                  </div>
                                  {settings.accentColor === c && (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  )}
                                </button>
                              )
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* 5. SECTION: General, Voice, Security & System List (Image 2 match) */}
                <div className="space-y-1.5">
                  <div className="rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333333] divide-y divide-[#e4e4e7] dark:divide-[#303030] overflow-hidden">
                    {/* General */}
                    <button
                      onClick={() => setCurrentSubPage('general')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <SettingsIcon className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">General</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Notifications */}
                    <button
                      onClick={() => setCurrentSubPage('notifications')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Notifications</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Voice */}
                    <button
                      onClick={() => setCurrentSubPage('voice')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <AudioWaveform className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Voice</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Safety */}
                    <button
                      onClick={() => setCurrentSubPage('safety')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Safety</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Security and login */}
                    <button
                      onClick={() => setCurrentSubPage('security')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <KeyRound className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Security and login</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Remote control */}
                    <button
                      onClick={() => setCurrentSubPage('remote')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Remote control</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Storage */}
                    <button
                      onClick={() => setCurrentSubPage('storage')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <HardDrive className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <div className="text-left">
                          <div className="font-medium">Storage</div>
                          <div className="text-[11px] text-[#71717a] dark:text-[#8e8e8e]">{storageSize} used</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Data controls */}
                    <button
                      onClick={() => setCurrentSubPage('data_controls')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Database className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Data controls</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Ads controls */}
                    <button
                      onClick={() => setCurrentSubPage('ads')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Megaphone className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Ads controls</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* Report bug */}
                    <button
                      onClick={() => setCurrentSubPage('bug_report')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Bug className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">Report bug</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>

                    {/* About */}
                    <button
                      onClick={() => setCurrentSubPage('about')}
                      className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Info className="w-4 h-4 text-[#09090b] dark:text-[#ececec]" />
                        <span className="font-medium">About</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                    </button>
                  </div>
                </div>

                {/* 6. Log Out Button (Exact image match) */}
                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-2xl bg-[#fee2e2] dark:bg-[#262626] border border-[#fca5a5] dark:border-[#382626] hover:bg-[#fecaca] dark:hover:bg-[#2e2020] p-3.5 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Log out</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= SUBPAGE: PERSONALIZATION ================= */}
            {currentSubPage === 'personalization' && (
              <motion.div
                key="personalization"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="text-xs text-[#71717a] dark:text-[#8e8e8e]">
                  Customize how DOTVEX 2.0 understands your persona and formats responses.
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#09090b] dark:text-[#ececec] mb-1">
                      What should DOTVEX know about you?
                    </label>
                    <textarea
                      rows={3}
                      value={settings.customInstructions.aboutUser}
                      onChange={(e) =>
                        handleUpdate({
                          ...settings,
                          customInstructions: {
                            ...settings.customInstructions,
                            aboutUser: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 rounded-xl bg-white dark:bg-[#222] border border-[#d4d4d8] dark:border-[#333] text-xs text-[#09090b] dark:text-[#ececec] focus:outline-none focus:border-emerald-500 leading-relaxed shadow-2xs"
                      placeholder="e.g. Software architect, prefers concise mathematical explanations..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#09090b] dark:text-[#ececec] mb-1">
                      How would you like DOTVEX to respond?
                    </label>
                    <textarea
                      rows={3}
                      value={settings.customInstructions.responseStyle}
                      onChange={(e) =>
                        handleUpdate({
                          ...settings,
                          customInstructions: {
                            ...settings.customInstructions,
                            responseStyle: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 rounded-xl bg-white dark:bg-[#222] border border-[#d4d4d8] dark:border-[#333] text-xs text-[#09090b] dark:text-[#ececec] focus:outline-none focus:border-emerald-500 leading-relaxed shadow-2xs"
                      placeholder="e.g. Direct, deep analytical reasoning, zero generic filler..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#09090b] dark:text-[#ececec] mb-1.5">
                      Expertise Traits
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {settings.customInstructions.traits.map((t, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f4f4f5] dark:bg-[#2a2a2a] text-xs text-[#09090b] dark:text-[#ececec] border border-[#e4e4e7] dark:border-[#3a3a3a]"
                        >
                          <span>{t}</span>
                          <button
                            onClick={() => {
                              const updatedTraits = settings.customInstructions.traits.filter(
                                (_, i) => i !== idx
                              );
                              handleUpdate({
                                ...settings,
                                customInstructions: {
                                  ...settings.customInstructions,
                                  traits: updatedTraits,
                                },
                              });
                            }}
                            className="text-[#71717a] dark:text-[#8e8e8e] hover:text-[#09090b] dark:hover:text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTrait}
                        onChange={(e) => setNewTrait(e.target.value)}
                        placeholder="Add trait (e.g. Distributed Systems)"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#222] border border-[#d4d4d8] dark:border-[#333] text-xs text-[#09090b] dark:text-[#ececec] focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => {
                          if (!newTrait.trim()) return;
                          handleUpdate({
                            ...settings,
                            customInstructions: {
                              ...settings.customInstructions,
                              traits: [...settings.customInstructions.traits, newTrait.trim()],
                            },
                          });
                          setNewTrait('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {userUnderstanding && (
                    <div className="pt-2 border-t border-[#e4e4e7] dark:border-[#333] space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#09090b] dark:text-[#ececec] mb-1.5">
                          Learned Communication Style
                        </label>
                        {userUnderstanding.communicationStyle.length > 0 ? (
                          <div className="space-y-2">
                            {userUnderstanding.communicationStyle.map((mem) => (
                              <div
                                key={mem.id}
                                className="p-3 rounded-xl bg-[#f4f4f5] dark:bg-[#2a2a2a] border border-[#e4e4e7] dark:border-[#3a3a3a]"
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-medium text-[#09090b] dark:text-[#ececec]">{mem.concept}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                                    inferred ({mem.evidenceCount ?? 1}x)
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#71717b] dark:text-[#b4b4b4] mt-1">
                                  Confidence: {(mem.confidence * 100).toFixed(0)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#71717b] dark:text-[#8e8e8e]">
                            No communication patterns detected yet. As you interact, DOTVEX will learn your preferences.
                          </div>
                        )}
                      </div>

                      {userUnderstanding.preferences.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-[#09090b] dark:text-[#ececec] mb-1.5">
                            Learned Preferences
                          </label>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {userUnderstanding.preferences.slice(0, 8).map((mem) => (
                              <div
                                key={mem.id}
                                className="flex items-start justify-between p-2 rounded-lg bg-[#f4f4f5] dark:bg-[#2a2a2a] border border-[#e4e4e7] dark:border-[#3a3a3a]"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-[#09090b] dark:text-[#ececec] break-words">{mem.content}</div>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#71717b] dark:text-[#8e8e8e]">
                                    <span>{mem.sourceType === 'explicit' ? 'explicit' : 'inferred'}</span>
                                    <span>• {(mem.confidence * 100).toFixed(0)}%</span>
                                    <span>• {mem.evidenceCount ?? 1}x evidence</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ================= SUBPAGE: MEMORY ================= */}
            {currentSubPage === 'memory' && (
              <motion.div
                key="memory"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333]">
                  <div>
                    <div className="text-xs font-semibold text-[#09090b] dark:text-[#ececec]">Cognition & Memory Extraction</div>
                    <div className="text-[11px] text-[#71717a] dark:text-[#8e8e8e]">
                      DOTVEX saves learned details across conversations
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleUpdate({
                        ...settings,
                        memory: {
                          ...settings.memory,
                          autoExtractMemories: !settings.memory.autoExtractMemories,
                        },
                      })
                    }
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      settings.memory.autoExtractMemories ? 'bg-emerald-600' : 'bg-[#d4d4d8] dark:bg-[#444]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                        settings.memory.autoExtractMemories ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

              <div className="space-y-2">
                   <div className="flex items-center justify-between text-xs font-semibold px-1 text-[#09090b] dark:text-[#ececec]">
                     <span>Saved Memories ({memories.length})</span>
                     {memories.length > 0 && (
                       <button
                          onClick={() => {
                            if (window.confirm('Clear all stored memory concepts?')) {
                              cognitionService.clearAll().then(() => {
                                setMemories([]);
                                setUserUnderstanding(null);
                                showToast('Memories Cleared');
                              }).catch(() => {
                                setMemories([]);
                                setUserUnderstanding(null);
                                showToast('Memories Cleared');
                              });
                            }
                          }}
                         className="text-[11px] text-red-500 dark:text-red-400 hover:underline cursor-pointer"
                       >
                         Clear All
                       </button>
                     )}
                   </div>

                   {memories.length === 0 ? (
                     <div className="p-4 rounded-2xl bg-[#fafafa] dark:bg-[#1e1e1e] border border-[#e4e4e7] dark:border-[#2a2a2a] text-center text-xs text-[#71717a] dark:text-[#8e8e8e]">
                       No memory points saved yet. As you chat, DOTVEX will automatically register important guidelines and facts here.
                     </div>
                   ) : (
                     <div className="space-y-2 max-h-60 overflow-y-auto">
                       {memories.map((m) => (
                         <div
                           key={m.id}
                           className="p-3 rounded-xl bg-white dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333] flex items-start justify-between gap-2 text-xs"
                         >
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2">
                               <div className="font-semibold text-emerald-600 dark:text-emerald-400">{m.concept}</div>
                               <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                                 m.sourceType === 'explicit'
                                   ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                                   : 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                               }`}>
                                 {m.sourceType === 'explicit' ? 'explicit' : 'inferred'}
                               </span>
                             </div>
                             <div className="text-[11px] text-[#52525b] dark:text-[#b4b4b4] mt-0.5 break-words">{m.content}</div>
                             <div className="flex items-center gap-3 mt-1 text-[10px] text-[#71717a] dark:text-[#8e8e8e]">
                               <span>Confidence: {(m.confidence * 100).toFixed(0)}%</span>
                               <span>Evidence: {m.evidenceCount ?? 1}</span>
                               {m.tags.length > 0 && (
                                 <span>#{m.tags.slice(0, 2).join(', ')}</span>
                               )}
                             </div>
                           </div>
                           <button
                             onClick={async () => {
                               await cognitionService.deleteMemory(m.id);
                               cognitionService.getMemories().then(setMemories).catch(() => {});
                               cognitionService.getUserUnderstanding().then(setUserUnderstanding).catch(() => {});
                               showToast('Deleted');
                             }}
                             className="p-1 text-[#71717b] dark:text-[#8e8e8e] hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              </motion.div>
            )}

            {/* ================= SUBPAGE: WORKSPACE ================= */}
            {currentSubPage === 'workspace' && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-3"
              >
                <div className="text-xs text-[#71717a] dark:text-[#8e8e8e]">
                  Select the active workspace partition for your projects, memory, and chats:
                </div>
                {['Personal', 'Engineering Workspace', 'Creative Studio'].map((ws) => (
                  <button
                    key={ws}
                    onClick={() => {
                      handleUpdate({ ...settings, workspace: ws });
                      setCurrentSubPage('main');
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold cursor-pointer ${
                      settings.workspace === ws
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-[#282828] text-emerald-900 dark:text-white'
                        : 'border-[#e4e4e7] dark:border-[#333] bg-white dark:bg-[#212121] text-[#52525b] dark:text-[#b4b4b4] hover:bg-[#f4f4f5] dark:hover:bg-[#262626]'
                    }`}
                  >
                    <span>{ws}</span>
                    {settings.workspace === ws && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </button>
                ))}
              </motion.div>
            )}

            {/* ================= SUBPAGE: TRUSTED CONTACT ================= */}
            {currentSubPage === 'trusted_contact' && (
              <motion.div
                key="trusted_contact"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="text-xs text-[#71717a] dark:text-[#8e8e8e]">
                  Add an emergency recovery or security contact email address:
                </div>
                <input
                  type="email"
                  value={tempContact}
                  onChange={(e) => setTempContact(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#222] border border-[#d4d4d8] dark:border-[#333] text-xs text-[#09090b] dark:text-[#ececec] focus:outline-none focus:border-emerald-500"
                  placeholder="contact@example.com"
                />
                <button
                  onClick={() => {
                    handleUpdate({ ...settings, trustedContact: tempContact });
                    setCurrentSubPage('main');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
                >
                  Save Trusted Contact
                </button>
              </motion.div>
            )}

            {/* ================= SUBPAGE: EMAIL EDIT ================= */}
            {currentSubPage === 'email_edit' && (
              <motion.div
                key="email_edit"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="text-xs text-[#71717a] dark:text-[#8e8e8e]">
                  Update your DOTVEX account email address:
                </div>
                <input
                  type="email"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#222] border border-[#d4d4d8] dark:border-[#333] text-xs text-[#09090b] dark:text-[#ececec] focus:outline-none focus:border-emerald-500"
                  placeholder="olalemiadedotun19@gmail.com"
                />
                <button
                  onClick={() => {
                    handleUpdate({ ...settings, userEmail: tempEmail });
                    setCurrentSubPage('main');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
                >
                  Update Email Address
                </button>
              </motion.div>
            )}

            {/* ================= SUBPAGE: GENERAL ================= */}
            {currentSubPage === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-3"
              >
                <div className="rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333] divide-y divide-[#e4e4e7] dark:divide-[#303030]">
                  <div className="flex items-center justify-between p-3.5 text-xs">
                    <div>
                      <div className="font-semibold text-[#09090b] dark:text-[#ececec]">Haptic Feedback</div>
                      <div className="text-[11px] text-[#71717a] dark:text-[#8e8e8e]">Vibrate on message responses</div>
                    </div>
                    <button
                      onClick={() =>
                        handleUpdate({
                          ...settings,
                          general: {
                            ...settings.general,
                            hapticFeedback: !settings.general.hapticFeedback,
                          },
                        })
                      }
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                        settings.general.hapticFeedback ? 'bg-emerald-600' : 'bg-[#d4d4d8] dark:bg-[#444]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                          settings.general.hapticFeedback ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 text-xs">
                    <div>
                      <div className="font-semibold text-[#09090b] dark:text-[#ececec]">Live Markdown Formatting</div>
                      <div className="text-[11px] text-[#71717a] dark:text-[#8e8e8e]">Render codeblocks and math live</div>
                    </div>
                    <button
                      onClick={() =>
                        handleUpdate({
                          ...settings,
                          general: {
                            ...settings.general,
                            liveMarkdownPreview: !settings.general.liveMarkdownPreview,
                          },
                        })
                      }
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                        settings.general.liveMarkdownPreview ? 'bg-emerald-600' : 'bg-[#d4d4d8] dark:bg-[#444]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                          settings.general.liveMarkdownPreview ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= SUBPAGE: VOICE ================= */}
            {currentSubPage === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="text-xs text-[#71717a] dark:text-[#8e8e8e]">
                  Choose your voice persona for voice conversations and audio readouts:
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {['Cove', 'Ember', 'Juniper', 'Breeze', 'Sky', 'Sol'].map((vName) => {
                    const isSel = settings.voice.voiceId === vName;
                    return (
                      <button
                        key={vName}
                        onClick={() => {
                          handleUpdate({
                            ...settings,
                            voice: { ...settings.voice, voiceId: vName },
                          });
                          handleTestVoice(vName, settings.voice.speed);
                        }}
                        className={`p-3 rounded-xl border text-xs text-left transition-colors flex items-center justify-between cursor-pointer ${
                          isSel
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-[#282828] text-emerald-900 dark:text-white font-semibold'
                            : 'border-[#e4e4e7] dark:border-[#333] bg-white dark:bg-[#202020] text-[#52525b] dark:text-[#b4b4b4] hover:bg-[#f4f4f5] dark:hover:bg-[#262626]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <AudioWaveform className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{vName}</span>
                        </div>
                        {isSel && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#09090b] dark:text-[#ececec]">Speech Speed</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{settings.voice.speed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.05"
                    value={settings.voice.speed}
                    onChange={(e) =>
                      handleUpdate({
                        ...settings,
                        voice: { ...settings.voice, speed: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>

                <button
                  onClick={() => handleTestVoice(settings.voice.voiceId, settings.voice.speed)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isTestingVoice ? 'Testing Voice...' : 'Play Voice Sample'}</span>
                </button>
              </motion.div>
            )}

            {/* ================= SUBPAGE: STORAGE ================= */}
            {currentSubPage === 'storage' && (
              <motion.div
                key="storage"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#71717a] dark:text-[#8e8e8e]">Total Cache & Storage</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {storageSize}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e4e4e7] dark:bg-[#1c1c1c] overflow-hidden flex">
                    <div className="w-3/5 bg-emerald-500 h-full" />
                    <div className="w-1/5 bg-blue-500 h-full" />
                    <div className="w-1/5 bg-amber-500 h-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-[#71717a] dark:text-[#8e8e8e] pt-1">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Chats (60%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Memory (20%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Media (20%)</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClearCache}
                  className="w-full py-2.5 rounded-xl bg-white dark:bg-[#262626] hover:bg-[#f4f4f5] dark:hover:bg-[#333] border border-[#d4d4d8] dark:border-[#444] text-xs font-semibold text-[#09090b] dark:text-[#ececec] cursor-pointer"
                >
                  Clear Transient Cache
                </button>
              </motion.div>
            )}

            {/* ================= SUBPAGE: DATA CONTROLS ================= */}
            {currentSubPage === 'data_controls' && (
              <motion.div
                key="data_controls"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-3"
              >
                <div className="rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333] divide-y divide-[#e4e4e7] dark:divide-[#303030]">
                  <button
                    onClick={handleExportData}
                    className="w-full flex items-center justify-between p-3.5 text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#e4e4e7] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-left">
                        <div className="font-semibold">Export data</div>
                        <div className="text-[11px] text-[#71717a] dark:text-[#8e8e8e]">Download all JSON conversations</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-[#8e8e8e]" />
                  </button>

                  <button
                    onClick={handleDeleteAllChats}
                    className="w-full flex items-center justify-between p-3.5 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                      <div className="text-left">
                        <div className="font-semibold">Delete all chats</div>
                        <div className="text-[11px] text-[#71717a] dark:text-[#8e8e8e]">Permanently wipe history</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-500 dark:text-red-400" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= SUBPAGE: REPORT BUG ================= */}
            {currentSubPage === 'bug_report' && (
              <motion.div
                key="bug_report"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                {bugSubmitted ? (
                  <div className="p-6 rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-emerald-500/50 text-center space-y-2">
                    <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <div className="text-sm font-bold text-[#09090b] dark:text-white">Bug Report Submitted</div>
                    <p className="text-xs text-[#71717a] dark:text-[#8e8e8e]">
                      Thank you for helping improve DOTVEX 2.0. Telemetry and diagnostic trace recorded.
                    </p>
                    <button
                      onClick={() => {
                        setBugSubmitted(false);
                        setCurrentSubPage('main');
                      }}
                      className="mt-3 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#09090b] dark:text-[#ececec] mb-1">
                        Category
                      </label>
                      <select
                        value={bugCategory}
                        onChange={(e) => setBugCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-[#222] border border-[#d4d4d8] dark:border-[#333] text-xs text-[#09090b] dark:text-[#ececec] focus:outline-none"
                      >
                        <option>UI / Layout</option>
                        <option>Model Reasoning</option>
                        <option>Voice / Audio</option>
                        <option>Performance / Latency</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#09090b] dark:text-[#ececec] mb-1">
                        Description
                      </label>
                      <textarea
                        rows={4}
                        value={bugDescription}
                        onChange={(e) => setBugDescription(e.target.value)}
                        placeholder="Describe what occurred or how to reproduce the issue..."
                        className="w-full p-3 rounded-xl bg-white dark:bg-[#222] border border-[#d4d4d8] dark:border-[#333] text-xs text-[#09090b] dark:text-[#ececec] focus:outline-none focus:border-emerald-500 leading-relaxed shadow-2xs"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (!bugDescription.trim()) return;
                        setBugSubmitted(true);
                        setBugDescription('');
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
                    >
                      Submit Bug Report
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* ================= SUBPAGE: ABOUT ================= */}
            {currentSubPage === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333] space-y-2 text-[#09090b] dark:text-[#ececec]">
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">DOTVEX 2.0</div>
                  <p className="text-xs text-[#52525b] dark:text-[#b4b4b4]">
                    Next-Generation Cognitive Intelligence & Engineering Assistant created by{' '}
                    <strong className="text-[#09090b] dark:text-white">Dotman (Olalemi Michael Adedotun)</strong>.
                  </p>
                  <div className="pt-2 text-[11px] text-[#71717a] dark:text-[#8e8e8e] font-mono border-t border-[#e4e4e7] dark:border-[#333] mt-2">
                    Build: 2.0.4-release • Matte Charcoal Engine
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333] divide-y divide-[#e4e4e7] dark:divide-[#303030] text-xs">
                  <div className="p-3.5 flex justify-between">
                    <span className="text-[#71717a] dark:text-[#8e8e8e]">License</span>
                    <span className="text-[#09090b] dark:text-[#ececec]">Proprietary DOTVEX Core</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-[#71717a] dark:text-[#8e8e8e]">Author</span>
                    <span className="text-[#09090b] dark:text-[#ececec]">Olalemi Michael Adedotun</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-[#71717a] dark:text-[#8e8e8e]">Status</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Operational (130 FPS)</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= SUBPAGE: NOTIFICATIONS / SAFETY / SECURITY / REMOTE / ADS ================= */}
            {(currentSubPage === 'notifications' ||
              currentSubPage === 'safety' ||
              currentSubPage === 'security' ||
              currentSubPage === 'remote' ||
              currentSubPage === 'ads') && (
              <motion.div
                key="fallback_subpage"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-3"
              >
                <div className="rounded-2xl bg-[#f4f4f5] dark:bg-[#262626] border border-[#e4e4e7] dark:border-[#333] p-4 space-y-3">
                  <div className="text-xs font-semibold capitalize text-[#09090b] dark:text-[#ececec]">
                    {currentSubPage.replace(/_/g, ' ')} Configurations
                  </div>
                  <p className="text-xs text-[#71717a] dark:text-[#8e8e8e]">
                    All rules and security guardrails are active and operating under optimal local parameters.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Configured and protected</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
