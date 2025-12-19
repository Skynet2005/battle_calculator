import ThemeToggle from '../../lib/ThemeToggle';
import type { UserProfile } from '../types';

interface HeaderProps {
  currentProfile: UserProfile | null;
  onSave: () => void;
  authEmail?: string | null;
  authUsername?: string | null;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onProfileOpen?: () => void;
}

export default function Header({
  currentProfile,
  onSave,
  authEmail,
  authUsername,
  onLogout,
  onDeleteAccount,
  onProfileOpen,
}: HeaderProps) {
  return (
    <header className="text-center mb-10 text-white relative">
      <div className="absolute top-0 right-0 z-10">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl mb-3 font-extrabold bg-linear-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Expedition Battle Calculator
      </h1>
      <p className="text-lg sm:text-xl text-gray-300 font-medium">Whiteout Survival - Accurate Battle Planning Tool</p>
      {currentProfile && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
          <div className="text-base sm:text-lg text-gray-300">
            Profile: <strong className="font-bold text-white">{currentProfile.name}</strong>
          </div>
          <button
            className="button px-5 py-2.5 text-sm shadow-lg"
            onClick={onSave}
          >
            💾 Save Profile
          </button>
          {(authEmail || authUsername || onLogout || onDeleteAccount) && (
            <div className="flex flex-col sm:flex-row items-center gap-2 text-sm">
              <div className="text-gray-300">
                Signed in{authUsername ? ` as ${authUsername}` : ''}{authEmail ? ` (${authEmail})` : ''}
              </div>
              {onLogout && (
                <button
                  className="button px-3 py-2 text-xs bg-slate-700/80 hover:bg-slate-700"
                  onClick={onLogout}
                  title="Sign out"
                >
                  Sign out
                </button>
              )}
              {onProfileOpen && (
                <button
                  className="button px-3 py-2 text-xs bg-slate-800/80 hover:bg-slate-800"
                  onClick={onProfileOpen}
                  title="Open profile manager"
                >
                  Profile
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

