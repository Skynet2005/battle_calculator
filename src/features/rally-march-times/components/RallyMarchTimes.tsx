'use client';

import HamburgerNav from '@/shared/ui/HamburgerNav';
import { useEffect, useState } from 'react';
import { toast } from '@/shared/utils/toast';

interface RallyLead {
  id: string;
  name: string;
  marchTime: string; // seconds
}

export default function RallyMarchTimes() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [rallyLeads, setRallyLeads] = useState<RallyLead[]>([
    { id: '1', name: '', marchTime: '' },
    { id: '2', name: '', marchTime: '' }
  ]);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownTime, setCountdownTime] = useState(10);
  const [launchSchedule, setLaunchSchedule] = useState<{ second: number; leads: string[] }[]>([]);
  const [landLastLeadId, setLandLastLeadId] = useState<string | null>(null);

  // Initialize time only on client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate launch schedule whenever rally leads or land last selection change
  useEffect(() => {
    const calculateLaunchSchedule = () => {
      // Check if all rally leads have names and march times
      const allFilled = rallyLeads.every(lead => lead.name.trim() && lead.marchTime.trim());
      if (!allFilled || rallyLeads.length === 0) {
        setLaunchSchedule([]);
        return;
      }

      // Sort rally leads by march time (fastest first)
      const sortedLeads = [...rallyLeads].sort((a, b) => {
        const timeA = parseInt(a.marchTime) || 0;
        const timeB = parseInt(b.marchTime) || 0;
        return timeA - timeB;
      });

      // Calculate launch times so all rallies arrive together at the slowest march time
      const slowestMarchTime = Math.max(...sortedLeads.map(lead => parseInt(lead.marchTime) || 0));

      let launchTimes: { lead: string; launchAt: number }[] = sortedLeads.map((lead) => {
        const marchTime = parseInt(lead.marchTime) || 0;
        const launchAt = slowestMarchTime - marchTime; // Launch time relative to slowest arrival
        return {
          lead: lead.name,
          launchAt: launchAt
        };
      });

      // If land last is selected, adjust launch times so the land last rally launches last
      if (landLastLeadId) {
        const landLastLead = sortedLeads.find(lead => lead.id === landLastLeadId);
        if (landLastLead) {
          const landLastLaunchTime = launchTimes.find(lt => lt.lead === landLastLead.name)?.launchAt || 0;
          const maxLaunchTime = Math.max(...launchTimes.map(lt => lt.launchAt));
          const offset = maxLaunchTime - landLastLaunchTime;

          // Add offset to all launch times so land last launches last
          launchTimes = launchTimes.map(lt => ({
            ...lt,
            launchAt: lt.launchAt + offset
          }));
        }
      }

      // Group leads by their launch time and sort by launch time descending
      const schedule: { second: number; leads: string[] }[] = [];
      const maxLaunchTime = Math.max(...launchTimes.map(lt => lt.launchAt));

      // Ensure minimum countdown of 10 seconds
      const countdownDuration = Math.max(10, maxLaunchTime + 1);

      for (let second = countdownDuration; second >= 0; second--) {
        const leadsLaunching = launchTimes
          .filter(lt => lt.launchAt === second)
          .map(lt => lt.lead);

        if (leadsLaunching.length > 0) {
          schedule.push({ second, leads: leadsLaunching });
        }
      }

      setLaunchSchedule(schedule);
    };

    calculateLaunchSchedule();
  }, [rallyLeads, landLastLeadId]);

  // Countdown timer
  useEffect(() => {
    if (countdownActive && countdownTime > 0) {
      const timer = setTimeout(() => {
        setCountdownTime(countdownTime - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdownActive && countdownTime === 0) {
      // Countdown finished - could add sound or visual effect here
      setTimeout(() => {
        setCountdownActive(false);
        setCountdownTime(10);
      }, 2000);
    }
  }, [countdownActive, countdownTime]);

  const addRallyLead = () => {
    if (rallyLeads.length < 10) {
      setRallyLeads([...rallyLeads, {
        id: Date.now().toString(),
        name: '',
        marchTime: ''
      }]);
    }
  };

  const removeRallyLead = (id: string) => {
    if (rallyLeads.length > 2) {
      setRallyLeads(rallyLeads.filter(lead => lead.id !== id));
    }
  };

  const parseMarchTime = (input: string): string => {
    // If input contains ':' and looks like MM:SS format, convert to seconds
    if (input.includes(':')) {
      const parts = input.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        // Validate that it's a reasonable time (seconds < 60)
        if (seconds < 60 && parts[1].length > 0) {
          return (minutes * 60 + seconds).toString();
        }
      }
    }
    // Otherwise, return as-is
    return input;
  };

  const updateRallyLead = (id: string, field: 'name' | 'marchTime', value: string) => {
    // For march time, only convert on blur (when user finishes typing)
    setRallyLeads(rallyLeads.map(lead =>
      lead.id === id ? { ...lead, [field]: value } : lead
    ));
  };

  const handleMarchTimeBlur = (id: string) => {
    setRallyLeads(rallyLeads.map(lead =>
      lead.id === id ? { ...lead, marchTime: parseMarchTime(lead.marchTime) } : lead
    ));
  };

  const startCountdown = () => {
    // Check if all rally leads have names and march times
    const allFilled = rallyLeads.every(lead => lead.name.trim() && lead.marchTime.trim());
    if (!allFilled) {
      toast.error('Validation Error', 'Please fill in all rally lead names and march times (in seconds or MM:SS format) before starting countdown.');
      return;
    }

    // Get the countdown duration from the current schedule and add 3 seconds padding
    const maxCountdown = Math.max(...launchSchedule.map(item => item.second));
    const countdownDuration = Math.max(10, maxCountdown + 3);

    setCountdownActive(true);
    setCountdownTime(countdownDuration);
  };

  const formatTime = (date: Date) => {
    return date.toISOString().split('T')[1].substring(0, 8); // HH:MM:SS format
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70 sticky top-0 backdrop-blur">
        <HamburgerNav
          links={[
            { href: '/', label: 'Home' },
            { href: '/leaderboard', label: 'Leaderboard' },
            { href: '/rally-march-times', label: 'Rally March Times' },
          ]}
        />
        <h1 className="text-xl font-semibold tracking-tight">Rally March Times</h1>
        <div className="text-xs text-slate-400">Castle Event Coordination</div>
      </header>

      <section className="px-6 py-6 space-y-6">
        {/* UTC Time Display */}
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {isClient && currentTime ? formatTime(currentTime) : '--:--:--'}
          </div>
          <div className="text-sm text-slate-400">
            UTC Time - {isClient && currentTime ? formatDate(currentTime) : 'Loading...'}
          </div>
        </div>

        {/* Rally Leads Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Rally Leads ({rallyLeads.length})</h2>
            <button
              onClick={addRallyLead}
              disabled={rallyLeads.length >= 10}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white text-sm rounded transition-colors"
            >
              Add Rally Lead
            </button>
          </div>

          <div className="grid gap-4">
            {rallyLeads.map((lead, index) => (
              <div key={lead.id} className="flex items-center gap-4 p-4 border border-slate-700 rounded-lg bg-slate-800/50">
                <div className="shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      Rally Lead Name
                    </label>
                    <input
                      type="text"
                      value={lead.name}
                      onChange={(e) => updateRallyLead(lead.id, 'name', e.target.value)}
                      placeholder="Enter rally lead name"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      March Time (seconds or MM:SS)
                    </label>
                    <input
                      type="text"
                      value={lead.marchTime}
                      onChange={(e) => updateRallyLead(lead.id, 'marchTime', e.target.value)}
                      onBlur={() => handleMarchTimeBlur(lead.id)}
                      placeholder="80 or 1:20"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => removeRallyLead(lead.id)}
                  disabled={rallyLeads.length <= 2}
                  className="shrink-0 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 disabled:text-slate-500 disabled:hover:bg-transparent rounded transition-colors"
                  title="Remove rally lead"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Land Last Selection */}
        {rallyLeads.some(lead => lead.name.trim() && lead.marchTime.trim()) && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Rally Lead to Land Last</h2>
            <div className="grid gap-2">
              {rallyLeads
                .filter(lead => lead.name.trim() && lead.marchTime.trim())
                .map(lead => (
                  <label key={lead.id} className="flex items-center gap-3 p-3 border border-slate-700 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 cursor-pointer">
                    <input
                      type="radio"
                      name="landLastLead"
                      value={lead.id}
                      checked={landLastLeadId === lead.id}
                      onChange={(e) => setLandLastLeadId(e.target.value)}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-slate-200 font-medium">{lead.name}</span>
                    <span className="text-slate-400 text-sm">({lead.marchTime}s march time)</span>
                  </label>
                ))}
              <label className="flex items-center gap-3 p-3 border border-slate-700 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 cursor-pointer">
                <input
                  type="radio"
                  name="landLastLead"
                  value=""
                  checked={landLastLeadId === null}
                  onChange={() => setLandLastLeadId(null)}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-slate-200 font-medium">No selection (fastest lands last)</span>
              </label>
            </div>
          </div>
        )}

        {/* Countdown Section */}
        <div className="text-center space-y-4">
          {!countdownActive ? (
            <div className="space-y-4">
              <button
                onClick={startCountdown}
                disabled={launchSchedule.length === 0}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-xl font-bold rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Start Countdown
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`text-6xl font-bold ${countdownTime <= 3 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                {countdownTime}
              </div>
              <div className="text-lg text-slate-300">
                {countdownTime === 0 ? 'LAUNCH!' : 'Get ready to send rallies...'}
              </div>
              {launchSchedule
                .filter(item => item.second === countdownTime)
                .map(item => (
                  <div key={item.second} className="text-xl font-bold text-yellow-400 animate-pulse">
                    🚀 {item.leads.join(', ')} - LAUNCH NOW!
                  </div>
                ))}
            </div>
          )}

          {launchSchedule.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-200">Launch Schedule:</h3>
                <button
                  onClick={() => {
                    const scheduleText = launchSchedule
                      .map(item => {
                        const leadsWithTimes = item.leads.map(leadName => {
                          const lead = rallyLeads.find(r => r.name === leadName);
                          const marchTime = lead ? parseInt(lead.marchTime) || 0 : 0;
                          return `${leadName} (${marchTime}s)`;
                        }).join(', ');
                        return `Countdown ${item.second}: ${leadsWithTimes}`;
                      })
                      .join('\n');
                    navigator.clipboard.writeText(scheduleText);
                  }}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded transition-colors"
                  title="Copy launch schedule to clipboard"
                >
                  📋 Copy
                </button>
              </div>
              <div className="grid gap-1 max-w-md mx-auto text-left">
                {launchSchedule.map(item => (
                  <div key={item.second} className="flex justify-between text-sm">
                    <span className="text-slate-300">Countdown {item.second}:</span>
                    <span className="text-yellow-400 font-semibold">
                      {item.leads.map(leadName => {
                        const lead = rallyLeads.find(r => r.name === leadName);
                        const marchTime = lead ? parseInt(lead.marchTime) || 0 : 0;
                        return `${leadName} (${marchTime}s)`;
                      }).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {launchSchedule.length === 0 && rallyLeads.some(lead => lead.name.trim() && lead.marchTime.trim()) && (
            <div className="text-sm text-slate-400">
              Fill in all rally lead names and march times to see the launch schedule.
            </div>
          )}

          <div className="text-sm text-slate-400 max-w-md mx-auto">
            Enter march times in seconds (80) or MM:SS format (1:20). Rallies launch at calculated times to arrive sequentially based on march time differences.
          </div>
        </div>
      </section>
    </main>
  );
}
