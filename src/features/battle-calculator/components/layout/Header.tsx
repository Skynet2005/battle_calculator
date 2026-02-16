import ThemeToggle from '@/shared/ui/ThemeToggle';
import type { UserProfile } from '@/shared/types';
import HamburgerNav from '@/shared/ui/HamburgerNav';

interface HeaderProps {
  currentProfile: UserProfile | null;
  onSave: () => void;
  authEmail?: string | null;
  authUsername?: string | null;
  gameData?: {
    roleId: string;
    gameId: string;
    state: string | null;
    furnaceLevel: number | null;
    profilePicture: string | null;
  } | null;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onProfileOpen?: () => void;
}

export default function Header({
  currentProfile,
  onSave,
  authEmail,
  authUsername,
  gameData,
  onLogout,
  onDeleteAccount,
  onProfileOpen,
}: HeaderProps) {
  return (
    <header className="text-center mb-10 text-white relative">
      <div className="absolute top-0 left-0 z-10">
        <HamburgerNav
          links={[
            { href: '/', label: 'Home' },
            { href: '/leaderboard', label: 'Leaderboard' },
            { href: '/rally-march-times', label: 'Rally March Times' },
          ]}
        />
      </div>
      <div className="absolute top-0 right-0 z-10 flex items-center gap-2">
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
          {(authEmail || authUsername || gameData || onLogout || onDeleteAccount) && (
            <div className="flex flex-col sm:flex-row items-center gap-2 text-sm">
              {gameData && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
                  {gameData.profilePicture && (
                    <img
                      src={gameData.profilePicture}
                      alt="Profile"
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="text-gray-300 text-xs">
                    <div className="font-semibold">{authUsername || `ID: ${gameData.roleId}`}</div>
                    <div className="text-gray-400">
                      {gameData.state && `State: ${gameData.state}`}
                      {gameData.furnaceLevel && ` • Furnace: ${gameData.furnaceLevel}`}
                    </div>
                  </div>
                </div>
              )}
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
                <div className="flex items-center gap-2">
                  <button
                    className="button px-3 py-2 text-xs bg-slate-800/80 hover:bg-slate-800"
                    onClick={onProfileOpen}
                    title="Open profile manager"
                  >
                    Profile
                  </button>
                  <a
                    href="https://github.com/Skynet2005/battle_calculator/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="button px-3 py-2 text-xs bg-slate-800/80 hover:bg-slate-800"
                    title="Open GitHub issues to report bugs or give feedback"
                  >
                    <span className="flex items-center gap-1">
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        height="14"
                        width="14"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="opacity-80"
                      >
                        <path d="M8 0C3.58 0 0 3.64 0 8.13c0 3.59 2.29 6.64 5.47 7.72.4.08.55-.18.55-.39 0-.19-.01-.82-.01-1.48-2.01.44-2.53-.5-2.69-.96-.09-.24-.48-.97-.82-1.17-.28-.15-.68-.52-.01-.53.63-.01 1.08.59 1.23.84.72 1.23 1.87.88 2.33.67.07-.53.28-.88.51-1.08-1.78-.21-3.64-.9-3.64-3.99 0-.88.31-1.59.82-2.15-.08-.21-.36-1.06.08-2.21 0 0 .67-.22 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.05 2.2-.82 2.2-.82.44 1.15.16 2 .08 2.21.51.56.82 1.27.82 2.15 0 3.1-1.87 3.78-3.65 3.99.29.25.54.74.54 1.5 0 1.08-.01 1.95-.01 2.22 0 .21.15.47.55.39A8.15 8.15 0 0 0 16 8.13C16 3.64 12.42 0 8 0Z" />
                      </svg>
                      Feedback
                    </span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

