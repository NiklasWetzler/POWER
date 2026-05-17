import { useState } from "react";
import { useListCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, Users, Mail, Reply, MoreVertical, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Campaigns() {
  const { data: campaigns, isLoading } = useListCampaigns();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage your outreach sequences and track performance.</p>
        </div>
        <CampaignDialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </CampaignDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mt-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : campaigns?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 rounded-lg border border-dashed">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="font-medium text-foreground">No campaigns yet</p>
            <p className="text-sm mt-1 mb-4">Create your first campaign to start tracking outreach.</p>
            <Button variant="outline" onClick={() => setIsAddOpen(true)}>Create Campaign</Button>
          </div>
        ) : (
          campaigns?.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))
        )}
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteCampaign();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({ id: campaign.id }, {
      onSuccess: () => {
        toast({ title: "Campaign deleted" });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      }
    });
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20",
    paused: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20",
    completed: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20",
  };

  return (
    <Card className="border-border hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm group flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href={`/campaigns/${campaign.id}`} className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
                {campaign.name}
              </Link>
            </div>
            {campaign.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`capitalize ${statusColors[campaign.status] || ''}`}>
              {campaign.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <CampaignDialog open={isEditOpen} onOpenChange={setIsEditOpen} campaign={campaign}>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsEditOpen(true); }}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                </CampaignDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this campaign? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-secondary/50">
            <Users className="w-4 h-4 text-muted-foreground mb-1" />
            <span className="font-semibold">{campaign.prospectCount || 0}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-secondary/50">
            <Mail className="w-4 h-4 text-muted-foreground mb-1" />
            <span className="font-semibold">{campaign.emailCount || 0}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-secondary/50">
            <Reply className="w-4 h-4 text-muted-foreground mb-1" />
            <span className="font-semibold">{campaign.replyCount || 0}</span>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
          <span>Updated {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}</span>
          <Link href={`/campaigns/${campaign.id}`} className="text-primary hover:underline">
            View details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignDialog({ children, open, onOpenChange, campaign }: any) {
  const [name, setName] = useState(campaign?.name || "");
  const [description, setDescription] = useState(campaign?.description || "");
  const [status, setStatus] = useState(campaign?.status || "active");
  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEdit = !!campaign;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateMutation.mutate({
        id: campaign.id,
        data: { name, description, status }
      }, {
        onSuccess: () => {
          toast({ title: "Campaign updated" });
          queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
          onOpenChange(false);
        }
      });
    } else {
      createMutation.mutate({
        data: { name, description, status }
      }, {
        onSuccess: () => {
          toast({ title: "Campaign created" });
          queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
          onOpenChange(false);
          setName("");
          setDescription("");
          setStatus("active");
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Campaign" : "New Campaign"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? "Save Changes" : "Create Campaign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
