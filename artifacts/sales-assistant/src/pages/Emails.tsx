import { useState } from "react";
import { useListEmails } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Search, Send, Clock, User, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Emails() {
  const [status, setStatus] = useState<string>("all");
  const { data: emails, isLoading } = useListEmails({ status: status === "all" ? undefined : status });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emails</h1>
          <p className="text-muted-foreground mt-1">Review your drafts and track sent messages.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px] bg-card/50">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-border bg-card/50 shadow-sm flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : emails?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Mail className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium text-foreground text-lg">No emails found</p>
            <p className="text-sm mt-1">Try changing your filters or generate a new draft.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50 overflow-y-auto">
            {emails?.map((email) => (
              <EmailRow key={email.id} email={email} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmailRow({ email }: { email: any }) {
  const statusColors: Record<string, string> = {
    draft: "bg-secondary text-secondary-foreground border-secondary",
    sent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    opened: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    replied: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  const isDraft = email.status === "draft";

  return (
    <div className="flex items-start p-4 hover:bg-muted/50 transition-colors group">
      <div className="mr-4 mt-1">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
            {email.prospect ? `${email.prospect.firstName[0]}${email.prospect.lastName[0]}` : "U"}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-foreground truncate">
              {email.prospect ? `${email.prospect.firstName} ${email.prospect.lastName}` : `Prospect #${email.prospectId}`}
            </span>
            <Badge variant="outline" className={`capitalize text-[10px] h-5 px-1.5 ${statusColors[email.status] || ''}`}>
              {email.status}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(email.sentAt || email.createdAt), { addSuffix: true })}
          </span>
        </div>
        
        <p className="font-medium text-sm text-foreground/90 truncate mb-1">
          {email.subject || "(No subject)"}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {email.body}
        </p>
      </div>

      <div className="ml-4 pl-4 border-l border-border/50 h-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Link href={isDraft ? `/compose?emailId=${email.id}` : "#"}>
          <div className="p-2 rounded-full hover:bg-secondary cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
