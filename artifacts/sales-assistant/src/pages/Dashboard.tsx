import { useGetDashboardSummary, useGetDashboardActivity, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mail, Reply, Target, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: activities, isLoading: loadingActivity } = useGetDashboardActivity();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Here is your pipeline health at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Prospects" 
          value={summary?.totalProspects} 
          loading={loadingSummary} 
          icon={Users} 
        />
        <StatCard 
          title="Emails Sent" 
          value={summary?.totalEmailsSent} 
          loading={loadingSummary} 
          icon={Mail} 
        />
        <StatCard 
          title="Reply Rate" 
          value={summary?.replyRate != null ? `${summary.replyRate}%` : "0%"} 
          loading={loadingSummary} 
          icon={Reply} 
        />
        <StatCard 
          title="Active Campaigns" 
          value={summary?.totalCampaigns} 
          loading={loadingSummary} 
          icon={Target} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border bg-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-0">
                {activities.map((activity, i) => (
                  <div key={activity.id} className={`flex items-start gap-4 py-3 ${i !== activities.length - 1 ? 'border-b border-border/50' : ''}`}>
                    <div className="mt-0.5 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/10" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.prospectName && <span className="mr-2">{activity.prospectName}</span>}
                        {activity.campaignName && <span className="mr-2 text-primary/70">{activity.campaignName}</span>}
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent activity. Time to send some emails!
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Pipeline by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="space-y-4 mt-4">
                 {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {[
                  { label: "New", count: summary?.prospectsByStatus?.new || 0, color: "bg-blue-500" },
                  { label: "Contacted", count: summary?.prospectsByStatus?.contacted || 0, color: "bg-yellow-500" },
                  { label: "Replied", count: summary?.prospectsByStatus?.replied || 0, color: "bg-green-500" },
                  { label: "Qualified", count: summary?.prospectsByStatus?.qualified || 0, color: "bg-indigo-500" },
                  { label: "Disqualified", count: summary?.prospectsByStatus?.disqualified || 0, color: "bg-red-500" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</span>
                    </div>
                    <span className="text-sm font-semibold">{stat.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading, icon: Icon }: { title: string; value?: number | string; loading: boolean; icon: any }) {
  return (
    <Card className="border-border shadow-sm hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary/70" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-3xl font-bold tracking-tight">{value !== undefined ? value : "0"}</div>
        )}
      </CardContent>
    </Card>
  );
}
