import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    
    // Remove all authorization checks; show analytics for all sessions in DB

    // Get userId from JWT if present
    let userId = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.userId;
      } catch (e) {
        // Invalid token, ignore
      }
    }

    // If no userId, return empty stats
    if (!userId) {
      return NextResponse.json({
        overview: {
          totalSessions: 0,
          sessionsThisMonth: 0,
          sessionsThisWeek: 0,
          averageDuration: 0,
          totalDuration: 0,
          averageTranscriptLength: 0,
          sessionsWithSummary: 0,
          summaryRate: 0
        },
        topKeywords: [],
        sessionsByDay: { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 },
        sessionsByStatus: {},
        timelineData: [],
        recentActivity: []
      });
    }

    // Get sessions for user
    const sessions = await prisma.session.findMany({
      where: { ownerId: userId },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        title: true,
        summary: true,
        transcript: true,
        status: true,
        startedAt: true,
        endedAt: true,
        ownerId: true,
        clientSessionId: true
      }
    });

    // Calculate stats
    const totalSessions = sessions.length;
    const now = new Date();
    const sessionsThisMonth = sessions.filter(s => s.startedAt.getMonth() === now.getMonth() && s.startedAt.getFullYear() === now.getFullYear()).length;
    const sessionsThisWeek = sessions.filter(s => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return s.startedAt >= weekStart && s.startedAt <= weekEnd;
    }).length;

    const totalDuration = sessions.reduce((sum, session) => {
      if (!session.startedAt || !session.endedAt) return sum;
      const duration = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime();
      return sum + duration;
    }, 0);
    const averageDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions / 1000 / 60) : 0;

    const averageTranscriptLength = totalSessions > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.transcript?.length || 0), 0) / totalSessions) : 0;
    const sessionsWithSummary = sessions.filter(s => !!s.summary).length;
    const summaryRate = totalSessions > 0 ? Math.round((sessionsWithSummary / totalSessions) * 100) : 0;

    // Top keywords (not implemented, placeholder)
    const topKeywords: Array<{ keyword: string; count: number }> = [];

    
    const sessionsByDay = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    sessions.forEach(s => {
      const day = s.startedAt.toLocaleDateString('en-US', { weekday: 'short' });
      switch (day) {
        case 'Sun': sessionsByDay.Sun++; break;
        case 'Mon': sessionsByDay.Mon++; break;
        case 'Tue': sessionsByDay.Tue++; break;
        case 'Wed': sessionsByDay.Wed++; break;
        case 'Thu': sessionsByDay.Thu++; break;
        case 'Fri': sessionsByDay.Fri++; break;
        case 'Sat': sessionsByDay.Sat++; break;
      }
    });

    // Sessions by status
    const sessionsByStatus: Record<string, number> = {};
    sessions.forEach(s => {
      sessionsByStatus[s.status] = (sessionsByStatus[s.status] || 0) + 1;
    });

    // Timeline data (last 30 days)
    const timelineData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = sessions.filter(s => s.startedAt.toDateString() === date.toDateString()).length;
      timelineData.push({ date: dateStr, count });
    }

    // Recent activity
    const recentActivity = sessions.slice(0, 5).map(s => ({
      id: s.id,
      title: s.title,
      startedAt: s.startedAt,
      duration: s.startedAt && s.endedAt
        ? Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000 / 60)
        : 0,
      status: s.status
    }));

    return NextResponse.json({
      overview: {
        totalSessions,
        sessionsThisMonth,
        sessionsThisWeek,
        averageDuration,
        totalDuration: Math.round(totalDuration / 1000 / 60),
        averageTranscriptLength,
        sessionsWithSummary,
        summaryRate
      },
      topKeywords,
      sessionsByDay,
      sessionsByStatus,
      timelineData,
      recentActivity
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
