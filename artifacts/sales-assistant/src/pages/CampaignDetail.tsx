import { useParams } from "wouter";
import { useGetCampaign, getGetCampaignQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, Mail, Reply, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CampaignDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: campaign, isLoading } = useGetCampaign(id, { 
    query: { enabled: !!id, queryKey: getGetCampaignQueryKey(id) } 
  });

  if (isLoading) {
    return <div className="space-y-8">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-3 gap-4"><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/></div>
    </div>;
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <Badge variant="secondary" className="capitalize">{campaign.status}</Badge>
          </div>
          {campaign.description && (
            <p className="text-muted-foreground mt-2">{campaign.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prospects</CardTitle>
            <Users className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{campaign.prospectCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{campaign.emailCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Replies</CardTitle>
            <Reply className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{campaign.replyCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
            <Calendar className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatDistanceToNow(new Date(campaign.createdAt))} ago</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Prospects in this Campaign</h2>
        <div className="text-muted-foreground text-sm border p-8 text-center rounded-md bg-secondary/20">
          Campaign prospect management is coming soon.
        </div>
      </div>
    </div>
  );
}
