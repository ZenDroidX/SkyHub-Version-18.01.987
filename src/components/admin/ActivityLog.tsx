'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { Loader2, Activity, Users, Download, Eye } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ActivityLog() {
  const db = useFirestore();
  const activityQuery = useMemoFirebase(() => query(
    collection(db, 'userActivity'), 
    orderBy('timestamp', 'desc'),
    limit(1000)
  ), [db]);
  
  const { data: activities, isLoading } = useCollection(activityQuery);

  const stats = useMemo(() => {
    if (!activities) return null;

    // Daily activity data for line chart
    const dailyData: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      dailyData[format(date, 'MMM dd')] = 0;
    }

    // Action types for pie chart
    const actionTypes: Record<string, number> = {};
    
    // Top users
    const topUsers: Record<string, number> = {};

    activities.forEach((act: any) => {
      if (!act.timestamp) return;
      const date = act.timestamp.toDate();
      const dateStr = format(date, 'MMM dd');
      
      if (dailyData[dateStr] !== undefined) {
        dailyData[dateStr]++;
      }

      const action = act.action || 'Unknown';
      const actionBase = action.split(' ')[0];
      actionTypes[actionBase] = (actionTypes[actionBase] || 0) + 1;

      const userId = act.userId || 'Anonymous';
      topUsers[userId] = (topUsers[userId] || 0) + 1;
    });

    const chartData = Object.entries(dailyData).map(([name, value]) => ({ name, value }));
    const pieData = Object.entries(actionTypes).map(([name, value]) => ({ name, value }));
    const userBarData = Object.entries(topUsers)
      .map(([name, value]) => ({ name: name.substring(0, 8), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      chartData,
      pieData,
      userBarData,
      totalCount: activities.length,
      downloadCount: activities.filter((a: any) => a.action?.toLowerCase().includes('download')).length,
      userCount: Object.keys(topUsers).length
    };
  }, [activities]);

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return <div>No activity recorded.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-border bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Total Pulses</p>
              <h4 className="text-2xl font-black">{stats.totalCount}</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Acquisitions</p>
              <h4 className="text-2xl font-black">{stats.downloadCount}</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Active Nodes</p>
              <h4 className="text-2xl font-black">{stats.userCount}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-[2.5rem] border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Activity Pulse (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'black', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: 'white', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" /> Action Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'black', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest">
            Recent Transmissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.slice(0, 10).map((act: any) => (
              <div key={act.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black uppercase">
                    {act.action?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">{act.action}</p>
                    <p className="text-[10px] text-muted-foreground">{act.userId}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {act.timestamp ? format(act.timestamp.toDate(), 'PPP p') : 'Pending...'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
