'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/shared/GlassCard';
import { Skeleton } from '@/components/shared/Skeleton';
import { Users, Shield, Crown, Star, Award, Gamepad2, Headphones, Loader2 } from 'lucide-react';

const iconMap = {
  crown: <Crown className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
  award: <Award className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
  gamepad: <Gamepad2 className="w-5 h-5" />,
  headphones: <Headphones className="w-5 h-5" />,
};

function getRoleBadgeStyle(roleName) {
  switch (roleName) {
    case 'Projektinhaber': return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' };
    case 'Stl. Projektinhaber': return { bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.2)' };
    case 'Teamkoordination': return { bg: 'rgba(234,179,8,0.1)', color: '#eab308', border: 'rgba(234,179,8,0.2)' };
    case 'Qualitätsmanagement': return { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', border: 'rgba(168,85,247,0.2)' };
    case 'Teamvertretung': return { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' };
    case 'Teamleitung': return { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.2)' };
    case 'Stl. Teamleitung': return { bg: 'rgba(45,212,191,0.1)', color: '#2dd4bf', border: 'rgba(45,212,191,0.2)' };
    case 'Roblox Manager': return { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'rgba(99,102,241,0.2)' };
    case 'Discord Manager': return { bg: 'rgba(88,101,242,0.1)', color: '#5865F2', border: 'rgba(88,101,242,0.2)' };
    case 'Roblox Team': return { bg: 'rgba(99,102,241,0.08)', color: '#818cf8', border: 'rgba(99,102,241,0.15)' };
    case 'Discord Team': return { bg: 'rgba(88,101,242,0.08)', color: '#7c8af2', border: 'rgba(88,101,242,0.15)' };
    default: return { bg: 'rgba(var(--theme-accent-rgb),0.1)', color: 'var(--theme-accent)', border: 'rgba(var(--theme-accent-rgb),0.2)' };
  }
}

const categoryOrder = ['Leitung', 'Management', 'Führung', 'Roblox', 'Discord'];

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchTeam = async () => {
      try {
        const res = await fetch('/api/team/members', {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (!cancelled) {
          setMembers(data.members || []);
          setRoles(data.roles || []);
        }
      } catch (e) {
        if (e.name !== 'AbortError' && !cancelled) {
          console.error('Team fetch error:', e);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTeam();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Group roles by category
  const groupedByCategory = {};
  roles.forEach(role => {
    if (!groupedByCategory[role.category]) groupedByCategory[role.category] = [];
    groupedByCategory[role.category].push(role);
  });

  // Sort categories
  const sortedCategories = categoryOrder.filter(c => groupedByCategory[c]);

  // Find members for a role
  const getMembersForRole = (roleName) => {
    return members.filter(m => m.roleName === roleName);
  };

  const totalMembers = members.length;
  const totalRoles = roles.length;

  return (
    <div className="min-h-screen px-6 py-24 page-transition-enter">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Users className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
            <span className="text-xs tracking-wider uppercase font-medium" style={{ color: 'rgba(var(--theme-accent-rgb), 0.6)' }}>Unser Team</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Das Team</h1>
          <p className="text-lg max-w-lg mx-auto" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
            Die Menschen hinter Hamburg Horizon Roleplay
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-16">
          <GlassCard className="p-5 text-center">
            <div className="text-3xl font-bold text-white">{totalMembers || '-'}</div>
            <div className="text-xs mt-1" style={{ color: 'rgba(var(--theme-accent-rgb), 0.35)' }}>Teammitglieder</div>
          </GlassCard>
          <GlassCard className="p-5 text-center">
            <div className="text-3xl font-bold text-white">{totalRoles}</div>
            <div className="text-xs mt-1" style={{ color: 'rgba(var(--theme-accent-rgb), 0.35)' }}>Rollen</div>
          </GlassCard>
          <GlassCard className="p-5 text-center">
            <div className="text-3xl font-bold text-white">{sortedCategories.length}</div>
            <div className="text-xs mt-1" style={{ color: 'rgba(var(--theme-accent-rgb), 0.35)' }}>Abteilungen</div>
          </GlassCard>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="space-y-8">
            {[1,2,3].map(g => (
              <div key={g}>
                <Skeleton height="1.5rem" width="12rem" className="mb-4" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4">
                      <Skeleton width="3.5rem" height="3.5rem" rounded="xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton height="1rem" width="60%" />
                        <Skeleton height="0.75rem" width="40%" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {sortedCategories.map(category => {
              const categoryRoles = groupedByCategory[category];
              // Deduplicate roles by name
              const uniqueRoles = [];
              const seen = new Set();
              categoryRoles.forEach(r => {
                if (!seen.has(r.name)) {
                  seen.add(r.name);
                  uniqueRoles.push(r);
                }
              });

              return (
                <div key={category}>
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1" style={{ background: `linear-gradient(to right, rgba(var(--theme-accent-rgb), 0.15), transparent)` }} />
                    <h2 className="text-sm tracking-wider uppercase font-bold px-3" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>{category}</h2>
                    <div className="h-px flex-1" style={{ background: `linear-gradient(to left, rgba(var(--theme-accent-rgb), 0.15), transparent)` }} />
                  </div>

                  <div className="space-y-6">
                    {uniqueRoles.map(role => {
                      const badgeStyle = getRoleBadgeStyle(role.name);
                      const roleIcon = iconMap[role.icon] || <Shield className="w-5 h-5" />;
                      const roleMembers = getMembersForRole(role.name);

                      return (
                        <div key={role.name}>
                          {/* Role Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center" 
                              style={{ background: badgeStyle.bg, border: `1px solid ${badgeStyle.border}`, color: badgeStyle.color }}
                            >
                              {roleIcon}
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-white">{role.name}</h3>
                              <p className="text-xs" style={{ color: 'rgba(var(--theme-accent-rgb), 0.3)' }}>
                                {role.desc}
                                {roleMembers.length > 0 && ` · ${roleMembers.length} Mitglied${roleMembers.length !== 1 ? 'er' : ''}`}
                              </p>
                            </div>
                          </div>

                          {/* Members */}
                          {roleMembers.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 pl-4 ml-4" style={{ borderLeft: `2px solid ${badgeStyle.border}` }}>
                              {roleMembers.map((member, i) => (
                                <GlassCard key={i} className="p-4" hover>
                                  <div className="flex items-center gap-3">
                                    {member.avatar ? (
                                      <img 
                                        src={member.avatar} 
                                        alt={member.username}
                                        className="w-12 h-12 rounded-xl object-cover"
                                        style={{ border: `1px solid ${badgeStyle.border}` }}
                                      />
                                    ) : (
                                      <div 
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                                        style={{ background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.border}` }}
                                      >
                                        {member.username?.charAt(0)?.toUpperCase() || '?'}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-semibold text-white truncate text-sm">{member.username}</h4>
                                      <span 
                                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md mt-0.5"
                                        style={{ background: badgeStyle.bg, color: badgeStyle.color }}
                                      >
                                        {role.name}
                                      </span>
                                    </div>
                                  </div>
                                </GlassCard>
                              ))}
                            </div>
                          ) : (
                            <div className="pl-4 ml-4 py-3" style={{ borderLeft: `2px solid ${badgeStyle.border}` }}>
                              <p className="text-xs" style={{ color: 'rgba(var(--theme-accent-rgb), 0.2)' }}>
                                Mitglieder werden über Discord-Rollen zugewiesen
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Discord CTA */}
        <GlassCard className="mt-16 p-8 text-center">
          <Users className="w-8 h-8 mx-auto mb-4" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }} />
          <h3 className="text-xl font-bold text-white mb-2">Teil des Teams werden?</h3>
          <p className="mb-6" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>Bewirb dich jetzt und werde Teil von Hamburg Horizon RP!</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/bewerbung"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ background: 'var(--theme-accent)', color: '#000' }}
            >
              Jetzt bewerben
            </Link>
            <a
              href="https://discord.gg/g784tka9sh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold glass transition-all hover:scale-[1.02]"
              style={{ color: 'rgba(var(--theme-accent-rgb), 0.6)' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/></svg>
              Discord beitreten
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
