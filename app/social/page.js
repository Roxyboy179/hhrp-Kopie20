'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Youtube,
  ExternalLink,
  Loader2,
  Eye,
  Heart,
  Users,
  Video,
  Calendar,
  ArrowLeft,
  Play,
} from 'lucide-react';

// TikTok-Logo (offizielle Wortmarke als kompaktes Icon-SVG)
const TikTokIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 256 290"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M189.72 104.42c18.69 13.36 41.6 21.22 66.34 21.22V77.6a67.2 67.2 0 0 1-13.94-1.46v37.81c-24.74 0-47.65-7.86-66.34-21.21v97.36c0 48.7-39.49 88.18-88.21 88.18-18.18 0-35.07-5.5-49.1-14.93 16.01 16.36 38.34 26.5 63.04 26.5 48.71 0 88.21-39.48 88.21-88.18v-97.25Zm17.18-48.46a66.74 66.74 0 0 1-17.18-39.05V11h-13.21a66.93 66.93 0 0 0 30.39 44.96Zm-137.43 165.6a40.4 40.4 0 0 1-8.26-24.49c0-22.35 18.13-40.48 40.49-40.48 4.16 0 8.31.64 12.27 1.9V109.8a89.7 89.7 0 0 0-13.94-.81v38.21a40.34 40.34 0 0 0-12.27-1.9c-22.36 0-40.49 18.13-40.49 40.48 0 15.81 9.07 29.51 22.2 36.18Z"
      fill="#FF004F"
    />
    <path
      d="M175.78 92.74c18.69 13.35 41.6 21.21 66.34 21.21V76.14A66.73 66.73 0 0 1 206.9 55.96 66.93 66.93 0 0 1 176.5 11h-34.94v190.07c-.07 22.3-18.16 40.34-40.49 40.34-13.16 0-24.86-6.27-32.27-15.99-13.13-6.67-22.2-20.37-22.2-36.18 0-22.35 18.13-40.48 40.49-40.48 4.28 0 8.42.66 12.27 1.9v-38.21c-47.85 1-86.34 40.07-86.34 88.16 0 24 9.59 45.76 25.16 61.66 14.03 9.43 30.92 14.93 49.1 14.93 48.72 0 88.21-39.48 88.21-88.18V92.74Z"
      fill="#fff"
    />
    <path
      d="M242.12 76.14V65.92a66.4 66.4 0 0 1-35.22-9.96 66.92 66.92 0 0 0 35.22 20.18ZM176.5 11a67.96 67.96 0 0 1-.73-5.42V0h-48.31v201.07c-.07 22.3-18.16 40.34-40.49 40.34a40.4 40.4 0 0 1-18.79-4.61c7.41 9.72 19.11 15.99 32.27 15.99 22.33 0 40.42-18.04 40.49-40.34V11h34.94c.21.79.39 1.59.62 2.36ZM114.32 109.74V98.85a89.92 89.92 0 0 0-12.06-.81C53.55 98.04 14 137.59 14 186.3c0 30.51 15.55 57.4 39.16 73.23-15.57-15.9-25.16-37.66-25.16-61.66 0-48.09 38.49-87.16 86.32-88.13Z"
      fill="#00F2EA"
    />
  </svg>
);

const formatNumber = (n) => {
  if (n == null) return '–';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

export default function SocialPage() {
  const [yt, setYt] = useState({ loading: true, data: null });
  const [tt, setTt] = useState({ loading: true, data: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/social/youtube-latest', { cache: 'no-store' });
        const d = await r.json();
        if (!cancelled) setYt({ loading: false, data: d });
      } catch {
        if (!cancelled) setYt({ loading: false, data: null });
      }
    })();
    (async () => {
      try {
        const r = await fetch('/api/social/tiktok-latest', { cache: 'no-store' });
        const d = await r.json();
        if (!cancelled) setTt({ loading: false, data: d });
      } catch {
        if (!cancelled) setTt({ loading: false, data: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen page-transition-enter">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white/90 transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>

        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Play className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
            <span
              className="text-xs tracking-wider uppercase font-medium"
              style={{ color: 'rgba(var(--theme-accent-rgb), 0.6)' }}
            >
              Social Media
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
            Folge uns auf YouTube & TikTok
          </h1>
          <p
            className="text-base sm:text-lg max-w-xl mx-auto"
            style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}
          >
            Hier findest du alle aktuellen Videos rund um Hamburg Horizon RP — automatisch immer auf dem neuesten Stand.
          </p>
        </div>

        {/* Grid: Mobile stacked, Desktop 2 cols */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <YouTubeCard yt={yt} />
          <TikTokCard tt={tt} />
        </div>
      </div>
    </div>
  );
}

/* ────────── YouTube ────────── */

function YouTubeCard({ yt }) {
  const data = yt.data;
  const profileUrl =
    data?.profileUrl || 'https://www.youtube.com/@hamburghorizonrphhrp';
  const videos = Array.isArray(data?.videos) ? data.videos : [];
  const latest = videos[0];
  const rest = videos.slice(1, 4);

  return (
    <section
      className="rounded-3xl border border-white/[0.06] overflow-hidden flex flex-col"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,22,0.85) 0%, rgba(14,14,16,0.92) 100%)',
        backdropFilter: 'blur(40px) saturate(160%)',
        WebkitBackdropFilter: 'blur(40px) saturate(160%)',
        boxShadow:
          '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255,0,0,0.2), rgba(255,0,0,0.05))',
              border: '1px solid rgba(255,0,0,0.25)',
              boxShadow: '0 8px 24px rgba(255,0,0,0.18)',
            }}
          >
            <Youtube className="w-6 h-6 text-red-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] sm:text-base font-semibold text-white truncate">
              YouTube
            </h2>
            <p className="text-[11.5px] text-white/45 truncate">
              {data?.handle || '@hamburghorizonrphhrp'}
            </p>
          </div>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium text-white/80 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          Kanal
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col gap-5">
        {yt.loading ? (
          <SkeletonVideo />
        ) : !latest ? (
          <EmptyState
            text="Keine Videos gefunden."
            href={profileUrl}
            cta="Zum YouTube-Kanal"
          />
        ) : (
          <>
            {/* Embed des neuesten Videos */}
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
                Neuestes Video
              </p>
              <div
                className="relative aspect-video rounded-2xl overflow-hidden border border-white/[0.06]"
                style={{ background: '#000' }}
              >
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${latest.videoId}?rel=0&modestbranding=1`}
                  title={latest.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <div className="px-1">
                <h3 className="text-[14.5px] font-semibold text-white leading-snug line-clamp-2">
                  {latest.title}
                </h3>
                <div className="flex items-center gap-3 mt-1.5 text-[11.5px] text-white/45">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(latest.publishedAt)}
                  </span>
                  {latest.views != null && (
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(latest.views)} Aufrufe
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Weitere Videos */}
            {rest.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
                  Weitere Videos
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {rest.map((v) => (
                    <a
                      key={v.videoId}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/20 transition-all"
                      style={{ background: '#000' }}
                    >
                      <div className="aspect-video relative">
                        <img
                          src={v.thumbnail}
                          alt={v.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-red-500/90 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <p className="text-[11.5px] font-medium text-white line-clamp-2 leading-snug">
                            {v.title}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ────────── TikTok ────────── */

function TikTokCard({ tt }) {
  const data = tt.data;
  const profileUrl =
    data?.profileUrl || 'https://www.tiktok.com/@hamburghorizonrp';
  const profile = data?.profile || null;
  const videos = Array.isArray(data?.videos) ? data.videos : [];
  const latest = videos[0];
  const rest = videos.slice(1, 4);

  return (
    <section
      className="rounded-3xl border border-white/[0.06] overflow-hidden flex flex-col"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,22,0.85) 0%, rgba(14,14,16,0.92) 100%)',
        backdropFilter: 'blur(40px) saturate(160%)',
        WebkitBackdropFilter: 'blur(40px) saturate(160%)',
        boxShadow:
          '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0,242,234,0.18), rgba(255,0,79,0.12))',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <TikTokIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] sm:text-base font-semibold text-white truncate">
              TikTok
            </h2>
            <p className="text-[11.5px] text-white/45 truncate">
              {data?.handle || '@hamburghorizonrp'}
            </p>
          </div>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium text-white/80 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          Profil
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col gap-5">
        {tt.loading ? (
          <SkeletonVideo />
        ) : (
          <>
            {/* Profile Hero-Card */}
            <div
              className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
              style={{
                background:
                  'radial-gradient(ellipse at top right, rgba(255,0,79,0.18), transparent 55%), radial-gradient(ellipse at bottom left, rgba(0,242,234,0.12), transparent 55%), rgba(255,255,255,0.02)',
              }}
            >
              <div className="p-5 flex flex-col items-center text-center gap-4 sm:gap-5">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.nickname || 'TikTok'}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white/15"
                    referrerPolicy="no-referrer"
                    style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }}
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/15">
                    <TikTokIcon className="w-10 h-10" />
                  </div>
                )}
                <div>
                  <p className="text-[16px] sm:text-[17px] font-semibold text-white">
                    {profile?.nickname || 'Hamburg Horizon RP'}
                  </p>
                  <p className="text-[12px] text-white/50 mt-0.5">
                    {data?.handle || '@hamburghorizonrp'}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                  <Stat icon={<Users className="w-3.5 h-3.5" />} label="Follower" value={formatNumber(profile?.followerCount)} />
                  <Stat icon={<Video className="w-3.5 h-3.5" />} label="Videos" value={formatNumber(profile?.videoCount)} />
                  <Stat icon={<Heart className="w-3.5 h-3.5" />} label="Likes" value={formatNumber(profile?.heartCount)} />
                </div>

                {/* CTA */}
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-medium text-[13px] text-white transition-all active:scale-[0.98] mt-1"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,0,79,0.95), rgba(220,0,60,0.95))',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow:
                      '0 10px 30px rgba(255,0,79,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
                  }}
                >
                  <TikTokIcon className="w-4 h-4" />
                  Auf TikTok ansehen
                </a>
              </div>
            </div>

            {/* Videos via API (falls vorhanden) */}
            {videos.length > 0 ? (
              <>
                {latest && (
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
                      Neuestes Video
                    </p>
                    <a
                      href={latest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/20 transition-all"
                      style={{ background: '#000', aspectRatio: '9 / 16', maxHeight: 520 }}
                    >
                      {latest.thumbnail && (
                        <img
                          src={latest.thumbnail}
                          alt={latest.title || 'TikTok Video'}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                          <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-[13px] font-medium text-white line-clamp-3 leading-snug">
                          {latest.title || 'Auf TikTok ansehen'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/70">
                          {latest.publishedAt && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(latest.publishedAt)}
                            </span>
                          )}
                          {latest.stats?.views != null && (
                            <span className="inline-flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatNumber(latest.stats.views)}
                            </span>
                          )}
                          {latest.stats?.likes != null && (
                            <span className="inline-flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {formatNumber(latest.stats.likes)}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  </div>
                )}

                {rest.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
                      Weitere Videos
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {rest.map((v) => (
                        <a
                          key={v.videoId}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/20 transition-all"
                          style={{ background: '#000', aspectRatio: '9 / 16' }}
                        >
                          {v.thumbnail && (
                            <img
                              src={v.thumbnail}
                              alt={v.title || ''}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          {v.stats?.views != null && (
                            <div className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 text-[10px] text-white/90 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm">
                              <Eye className="w-2.5 h-2.5" />
                              {formatNumber(v.stats.views)}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Hinweis, dass TikTok-Videofeed nur direkt auf TikTok abrufbar ist */
              <p className="text-[11px] text-white/35 text-center leading-relaxed px-2">
                TikTok schützt seine Video-Listen serverseitig — die neuesten Clips
                findest du immer direkt auf dem Profil.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div
      className="rounded-xl border border-white/[0.06] py-2.5 px-2 text-center"
      style={{ background: 'rgba(255,255,255,0.025)' }}
    >
      <div className="flex items-center justify-center gap-1 text-white/55">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[15px] font-semibold text-white mt-1 tabular-nums">{value}</p>
    </div>
  );
}

/* ────────── Helpers ────────── */

function SkeletonVideo() {
  return (
    <div className="space-y-3">
      <div className="aspect-video rounded-2xl bg-white/[0.04] animate-pulse" />
      <div className="h-3.5 w-3/4 bg-white/[0.04] rounded animate-pulse" />
      <div className="h-3 w-1/2 bg-white/[0.04] rounded animate-pulse" />
    </div>
  );
}

function EmptyState({ text, href, cta }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
      <Loader2 className="w-5 h-5 text-white/30" />
      <p className="text-[13px] text-white/55">{text}</p>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] text-white border border-white/15 hover:bg-white/5 transition"
        >
          {cta}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
