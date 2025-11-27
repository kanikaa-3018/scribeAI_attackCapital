'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

interface AnalyticsData {
  overview: {
    totalSessions: number;
    sessionsThisMonth: number;
    sessionsThisWeek: number;
    averageDuration: number;
    totalDuration: number;
    averageTranscriptLength: number;
    sessionsWithSummary: number;
    summaryRate: number;
  };
  topKeywords: Array<{ keyword: string; count: number }>;
  sessionsByDay: Record<string, number>;
  sessionsByStatus: Record<string, number>;
  timelineData: Array<{ date: string; count: number }>;
  recentActivity: Array<{
    id: string;
    title: string;
    startedAt: string;
    duration: number;
    status: string;
  }>;
}

export default function InsightsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('scribeai_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/analytics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--nb-bg)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: '4px solid rgba(79,176,122,0.2)',
              borderTop: '4px solid var(--nb-accent)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }}
          />
          <div style={{ fontSize: 14, color: 'rgba(11,47,33,0.6)' }}>Loading insights...</div>
        </div>
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--nb-bg)' }}>
        <Navbar />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
          <p>Failed to load analytics</p>
        </div>
      </div>
    );
  }

  const { overview, topKeywords, sessionsByDay, timelineData, recentActivity } = analytics;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nb-bg)' }}>
      <Navbar />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--nb-accent)" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: 'var(--nb-ink)' }}>
              Meeting Insights
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 16, color: 'rgba(11,47,33,0.6)' }}>
            Analytics and trends from your recorded sessions
          </p>
        </div>

        {/* Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
          <StatCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
            title="This Month"
            value={overview.sessionsThisMonth}
            subtitle="sessions"
            color="#3b82f6"
          />
          <StatCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
            title="Avg Duration"
            value={overview.averageDuration}
            subtitle="minutes"
            color="#10b981"
          />
          <StatCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
            title="Total Time"
            value={Math.round(overview.totalDuration / 60)}
            subtitle="hours"
            color="#f59e0b"
          />
          <StatCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
            title="This Week"
            value={overview.sessionsThisWeek}
            subtitle="sessions"
            color="#8b5cf6"
          />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 24, marginBottom: 32 }}>
          {/* Sessions by Day */}
          <div className="neubrutal-card" style={{ padding: 28 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 900, color: 'var(--nb-ink)' }}>
              Sessions by Day of Week
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                const count = sessionsByDay[day] || 0;
                const maxCount = Math.max(...Object.values(sessionsByDay), 1);
                const width = (count / maxCount) * 100;
                
                return (
                  <div key={day}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                      <span style={{ fontWeight: 700 }}>{day}</span>
                      <span style={{ color: 'rgba(11,47,33,0.6)' }}>{count} sessions</span>
                    </div>
                    <div style={{
                      height: 32,
                      background: 'rgba(79,176,122,0.1)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '2px solid rgba(79,176,122,0.2)'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${width}%`,
                        background: 'linear-gradient(90deg, var(--nb-accent) 0%, #4fb07a 100%)',
                        transition: 'width 0.5s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: count > 0 ? 12 : 0,
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'white'
                      }}>
                        {count > 0 && count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Keywords */}
          <div className="neubrutal-card" style={{ padding: 28 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 900, color: 'var(--nb-ink)' }}>
              Most Discussed Topics
            </h3>
            {topKeywords.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {topKeywords.map(({ keyword, count }, idx) => {
                  const colors = [
                    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
                    '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6'
                  ];
                  const color = colors[idx % colors.length];
                  
                  return (
                    <div
                      key={keyword}
                      style={{
                        padding: '10px 16px',
                        background: `${color}15`,
                        border: `2px solid ${color}40`,
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--nb-ink)' }}>
                        {keyword}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          background: color,
                          color: 'white',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 900
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'rgba(11,47,33,0.5)', fontSize: 14 }}>No keywords found</p>
            )}
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="neubrutal-card" style={{ padding: 28, marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 900, color: 'var(--nb-ink)' }}>
            Activity Timeline (Last 30 Days)
          </h3>
          {timelineData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200 }}>
              {timelineData.slice(-15).map(({ date, count }) => {
                const maxCount = Math.max(...timelineData.map(d => d.count), 1);
                const height = (count / maxCount) * 100;
                
                return (
                  <div
                    key={date}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${height}%`,
                        minHeight: count > 0 ? 20 : 0,
                        background: 'linear-gradient(180deg, var(--nb-accent) 0%, #4fb07a 100%)',
                        borderRadius: '8px 8px 0 0',
                        border: '2px solid rgba(79,176,122,0.3)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: 4,
                        fontSize: 11,
                        fontWeight: 900,
                        color: 'white'
                      }}
                    >
                      {count}
                    </div>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'rgba(11,47,33,0.6)',
                      transform: 'rotate(-45deg)',
                      whiteSpace: 'nowrap'
                    }}>
                      {date}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'rgba(11,47,33,0.5)', fontSize: 14 }}>No activity data</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="neubrutal-card" style={{ padding: 28 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 900, color: 'var(--nb-ink)' }}>
            Recent Sessions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentActivity.map(session => (
              <div
                key={session.id}
                style={{
                  padding: 16,
                  background: 'rgba(79,176,122,0.05)',
                  border: '2px solid rgba(79,176,122,0.2)',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                    {session.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(11,47,33,0.6)' }}>
                    {new Date(session.startedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{
                    padding: '6px 12px',
                    background: session.status === 'COMPLETED' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)',
                    border: `2px solid ${session.status === 'COMPLETED' ? '#10b981' : '#3b82f6'}`,
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    color: session.status === 'COMPLETED' ? '#10b981' : '#3b82f6'
                  }}>
                    {session.status}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(11,47,33,0.7)' }}>
                    {session.duration} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  color: string;
}> = ({ icon, title, value, subtitle, color }) => (
  <div
    className="neubrutal-card"
    style={{
      padding: 24,
      background: `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
      border: `3px solid ${color}40`
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ color }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(11,47,33,0.7)' }}>
        {title}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--nb-ink)' }}>
        {value}
      </div>
      <div style={{ fontSize: 14, color: 'rgba(11,47,33,0.6)' }}>
        {subtitle}
      </div>
    </div>
  </div>
);
