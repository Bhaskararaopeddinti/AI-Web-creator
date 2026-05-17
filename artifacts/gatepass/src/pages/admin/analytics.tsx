import Layout from "@/components/layout";
import { useGetAnalyticsSummary, useGetOutingStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];
const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", approved: "#10b981", rejected: "#ef4444",
  out: "#3b82f6", returned: "#6b7280",
};

export default function AdminAnalytics() {
  const { data: summary, isLoading: sumLoading } = useGetAnalyticsSummary();
  const { data: stats, isLoading: statsLoading } = useGetOutingStats();

  const typeData = stats?.byType.map((t) => ({ name: t.type.replace("_", " "), value: t.count })) ?? [];
  const statusData = stats?.byStatus.map((s) => ({ name: s.status, value: s.count, fill: STATUS_COLORS[s.status] ?? "#6b7280" })) ?? [];
  const hostelData = stats?.byHostel.map((h) => ({ name: h.hostelName, passes: h.count })) ?? [];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Gate pass trends and statistics</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Passes", value: summary?.totalPasses },
            { label: "Today's Passes", value: summary?.todayPasses },
            { label: "Currently Outside", value: summary?.currentlyOutside },
            { label: "Late Returns", value: summary?.lateReturns },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {sumLoading ? <Skeleton className="h-8 w-14" /> : (value ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Daily Trend (Last 7 Days)</CardTitle></CardHeader>
            <CardContent>
              {sumLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={summary?.weeklyTrend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} name="Passes" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Pass Status Distribution</CardTitle></CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Outing Types Breakdown</CardTitle></CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                      {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v, name) => [v, name]} />
                    <Legend formatter={(v) => v} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Trend (6 Months)</CardTitle></CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats?.monthlyTrend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Passes" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {hostelData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Passes by Hostel</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hostelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="passes" fill="#8b5cf6" radius={4} name="Passes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
