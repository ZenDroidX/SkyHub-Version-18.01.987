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
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { format, subDays, subMinutes, isAfter, startOfMinute } from 'date-fns';
import { Loader2, Activity, Users, Download, Eye, Cpu, Network, Terminal, Binary, Database } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ActivityLog() {
  const db = useFirestore();
  const [now, setNow] = React.useState(new Date());

  // Update "now" every 30 seconds to slide the graph
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const activityQuery = useMemoFirebase(() => query(
    collection(db, 'userActivity'), 
    orderBy('timestamp', 'desc'),
    limit(2000)
  ), [db]);
  
  const { data: activities, isLoading } = useCollection(activityQuery);

  const stats = useMemo(() => {
    if (!activities) return null;

    // Data Flow (last 30 minutes, per minute)
    const trafficData: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const time = subMinutes(now, i);
      trafficData[format(time, 'HH:mm')] = 0;
    }

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
      const dateStrDay = format(date, 'MMM dd');
      const dateStrMin = format(date, 'HH:mm');
      
      if (dailyData[dateStrDay] !== undefined) {
        dailyData[dateStrDay]++;
      }

      if (trafficData[dateStrMin] !== undefined) {
        trafficData[dateStrMin]++;
      }

      const action = act.action || 'Unknown';
      const actionBase = action.split(' ')[0];
      actionTypes[actionBase] = (actionTypes[actionBase] || 0) + 1;

      const userId = act.userId || 'Anonymous';
      topUsers[userId] = (topUsers[userId] || 0) + 1;
    });

    const chartData = Object.entries(dailyData).map(([name, value]) => ({ name, value }));
    const pulseData = Object.entries(trafficData).map(([name, value]) => ({ name, value }));
    const pieData = Object.entries(actionTypes).map(([name, value]) => ({ name, value }));
    
    return {
      chartData,
      pulseData,
      pieData,
      totalCount: activities.length,
      downloadCount: activities.filter((a: any) => a.action?.toLowerCase().includes('download')).length,
      userCount: Object.keys(topUsers).length
    };
  }, [activities, now]);

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
      {/* Tech Data Traffic Flow */}
      <Card className="rounded-[2.5rem] border-primary/20 bg-black/95 overflow-hidden border-2 relative">
        <div className="absolute top-6 right-8 flex items-center gap-2">
          <div className="flex gap-1 items-end h-3">
             <div className="w-1 bg-primary animate-[bounce_1.2s_infinite_0ms]" style={{ height: '60%' }}></div>
             <div className="w-1 bg-primary animate-[bounce_1.2s_infinite_300ms]" style={{ height: '100%' }}></div>
             <div className="w-1 bg-primary animate-[bounce_1.2s_infinite_600ms]" style={{ height: '40%' }}></div>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary">I/O Streams Active</span>
        </div>
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 font-mono">
            <Terminal className="w-4 h-4 text-primary" /> System Traffic Monitor
          </CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Real-time repository throughput / registry polling</p>
        </CardHeader>
        <CardContent className="h-[250px] w-full p-0 relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="h-full w-full px-2 pt-4">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <BarChart data={stats.pulseData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }} interval={4} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgb(10, 10, 10)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px' }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6" 
                  radius={[1, 1, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2.5rem] border-border bg-card shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1 font-mono">Operations</p>
              <h4 className="text-2xl font-black font-mono">{stats.totalCount}</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[2.5rem] border-border bg-card shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1 font-mono">Acquisitions</p>
              <h4 className="text-2xl font-black font-mono">{stats.downloadCount}</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[2.5rem] border-border bg-card shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1 font-mono">Registry Nodes</p>
              <h4 className="text-2xl font-black font-mono">{stats.userCount}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-[2.5rem] border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 font-mono">
              <Network className="w-4 h-4 text-primary" /> Repository Activity (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'black', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontFamily: 'monospace' }}
                  itemStyle={{ color: 'white', fontWeight: 'bold' }}
                />
                <Area type="stepAfter" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDaily)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 font-mono">
              <Binary className="w-4 h-4 text-blue-500" /> Interaction Vectors
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
                  stroke="none"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'black', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontFamily: 'monospace' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-border bg-black/95 overflow-hidden border-2 border-primary/10">
        <CardHeader className="border-b border-primary/5 bg-primary/5">
          <CardTitle className="text-sm font-black uppercase tracking-widest font-mono flex items-center gap-2">
            <Binary className="w-4 h-4 text-primary" /> Transmission Kernel Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="font-mono text-[11px] p-6 space-y-2 max-h-[400px] overflow-y-auto bg-black text-emerald-500/90 selection:bg-primary selection:text-black">
            {(activities || []).slice(0, 20).map((act: any, idx: number) => (
              <div key={act.id} className="flex gap-4 group hover:bg-primary/5 p-1 rounded transition-colors">
                <span className="text-muted-foreground/30 select-none">[{idx.toString().padStart(2, '0')}]</span>
                <span className="text-blue-400">[{act.timestamp ? format(act.timestamp.toDate(), 'HH:mm:ss') : '00:00:00'}]</span>
                <span className="text-primary font-bold">EVENT_LOG::{act.action?.toUpperCase().replace(/\s+/g, '_')}</span>
                <span className="text-muted-foreground truncate max-w-[200px]">PID: {act.userId?.slice(0, 8)}...</span>
                <span className="flex-1 text-emerald-400/70 italic opacity-0 group-hover:opacity-100 transition-opacity">
                  {'>'} execution_success
                </span>
              </div>
            ))}
            <div className="animate-pulse text-primary mt-2">_</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
