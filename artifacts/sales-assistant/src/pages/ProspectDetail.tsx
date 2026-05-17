import { useParams } from "wouter";
import { useGetProspect, getGetProspectQueryKey, useUpdateProspect } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Briefcase, Globe, Linkedin, Target, Calendar, Edit, PenSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function ProspectDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateMutation = useUpdateProspect();
  
  const { data: prospect, isLoading } = useGetProspect(id, { 
    query: { enabled: !!id, queryKey: getGetProspectQueryKey(id) } 
  });

  if (isLoading) {
    return <div className="space-y-8">
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-3 gap-4"><Skeleton className="h-64 col-span-1"/><Skeleton className="h-64 col-span-2"/></div>
    </div>;
  }

  if (!prospect) {
    return <div className="text-center py-12">Prospect not found</div>;
  }

  const handleStatusChange = (status: any) => {
    updateMutation.mutate({
      id: prospect.id,
      data: { status }
    }, {
      onSuccess: () => {
        toast({ title: "Status updated" });
        queryClient.invalidateQueries({ queryKey: getGetProspectQueryKey(id) });
      }
    });
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    contacted: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    replied: "bg-green-500/10 text-green-500 border-green-500/20",
    qualified: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    disqualified: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-card/80 border border-border rounded-xl shadow-sm backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xl font-bold">
              {prospect.firstName[0]}{prospect.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{prospect.firstName} {prospect.lastName}</h1>
            <div className="text-muted-foreground mt-1 flex items-center gap-2">
              <span className="font-medium">{prospect.title || "No Title"}</span>
              <span>at</span>
              <span className="font-medium text-foreground">{prospect.company}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={prospect.status} onValueChange={handleStatusChange}>
            <SelectTrigger className={`w-[140px] capitalize font-medium ${statusColors[prospect.status]}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="disqualified">Disqualified</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href={`/compose?prospectId=${prospect.id}`}>
              <PenSquare className="w-4 h-4 mr-2" /> Draft Email
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border bg-card/50 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Mail} label="Email" value={prospect.email} isLink />
            <InfoItem icon={Briefcase} label="Industry" value={prospect.industry || "Not specified"} />
            <InfoItem icon={Globe} label="Website" value={prospect.website || "Not specified"} isLink />
            <InfoItem icon={Linkedin} label="LinkedIn" value={prospect.linkedinUrl || "Not specified"} isLink />
            <InfoItem icon={Target} label="Campaign ID" value={prospect.campaignId || "None"} />
            <div className="pt-4 mt-4 border-t border-border/50">
              <InfoItem icon={Calendar} label="Added" value={`${formatDistanceToNow(new Date(prospect.createdAt))} ago`} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-md border border-dashed">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Email history will appear here.</p>
              <Button variant="link" asChild className="mt-2 text-primary">
                 <Link href={`/compose?prospectId=${prospect.id}`}>Send them an email</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, isLink = false }: { icon: any, label: string, value: string | number, isLink?: boolean }) {
  const isHttp = typeof value === 'string' && value.startsWith('http');
  const href = isHttp ? value : label === 'Email' ? `mailto:${value}` : '#';
  
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-md bg-secondary/50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {isLink && value !== "Not specified" ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate">
            {value}
          </a>
        ) : (
          <span className="text-sm font-medium text-foreground truncate">{value}</span>
        )}
      </div>
    </div>
  );
}
