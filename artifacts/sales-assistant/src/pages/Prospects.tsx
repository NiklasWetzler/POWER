import { useState } from "react";
import { useListProspects, useCreateProspect, useUpdateProspect, useDeleteProspect, getListProspectsQueryKey, useListCampaigns } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, Edit, Trash2, Building, Mail, Linkedin, Globe } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Prospects() {
  const [search, setSearch] = useState("");
  const { data: prospects, isLoading } = useListProspects({ search: search || undefined });
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prospects</h1>
          <p className="text-muted-foreground mt-1">Manage your contacts and track their status in the pipeline.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search prospects..." 
              className="pl-9 bg-card/50" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ProspectDialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <Button className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add Prospect
            </Button>
          </ProspectDialog>
        </div>
      </div>

      <Card className="border-border bg-card/50 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : prospects?.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="font-medium text-foreground">No prospects found</p>
            <p className="text-sm mt-1 mb-4">Add your first prospect or change your search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects?.map((prospect) => (
                  <ProspectRow key={prospect.id} prospect={prospect} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Users(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

function ProspectRow({ prospect }: { prospect: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteProspect();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({ id: prospect.id }, {
      onSuccess: () => {
        toast({ title: "Prospect deleted" });
        queryClient.invalidateQueries({ queryKey: getListProspectsQueryKey() });
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
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {prospect.firstName[0]}{prospect.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <Link href={`/prospects/${prospect.id}`} className="font-medium hover:text-primary transition-colors">
              {prospect.firstName} {prospect.lastName}
            </Link>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {prospect.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{prospect.company}</span>
          <span className="text-xs text-muted-foreground">{prospect.title || "No title"}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`capitalize ${statusColors[prospect.status] || ''}`}>
          {prospect.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/prospects/${prospect.id}`} className="cursor-pointer flex items-center w-full">
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/compose?prospectId=${prospect.id}`} className="cursor-pointer flex items-center w-full">
                Draft Email
              </Link>
            </DropdownMenuItem>
            <ProspectDialog open={isEditOpen} onOpenChange={setIsEditOpen} prospect={prospect}>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsEditOpen(true); }}>
                Edit Prospect
              </DropdownMenuItem>
            </ProspectDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Prospect</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {prospect.firstName}? This action cannot be undone.
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
      </TableCell>
    </TableRow>
  );
}

function ProspectDialog({ children, open, onOpenChange, prospect }: any) {
  const [formData, setFormData] = useState({
    firstName: prospect?.firstName || "",
    lastName: prospect?.lastName || "",
    email: prospect?.email || "",
    company: prospect?.company || "",
    title: prospect?.title || "",
    industry: prospect?.industry || "",
    website: prospect?.website || "",
    linkedinUrl: prospect?.linkedinUrl || "",
    campaignId: prospect?.campaignId?.toString() || "none",
  });
  
  const createMutation = useCreateProspect();
  const updateMutation = useUpdateProspect();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: campaigns } = useListCampaigns();

  const isEdit = !!prospect;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      campaignId: formData.campaignId === "none" ? null : parseInt(formData.campaignId, 10),
    };

    if (isEdit) {
      updateMutation.mutate({
        id: prospect.id,
        data: dataToSubmit
      }, {
        onSuccess: () => {
          toast({ title: "Prospect updated" });
          queryClient.invalidateQueries({ queryKey: getListProspectsQueryKey() });
          onOpenChange(false);
        }
      });
    } else {
      createMutation.mutate({
        data: dataToSubmit
      }, {
        onSuccess: () => {
          toast({ title: "Prospect created" });
          queryClient.invalidateQueries({ queryKey: getListProspectsQueryKey() });
          onOpenChange(false);
          setFormData({ firstName: "", lastName: "", email: "", company: "", title: "", industry: "", website: "", linkedinUrl: "", campaignId: "none" });
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Prospect" : "Add Prospect"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input id="linkedinUrl" value={formData.linkedinUrl} onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaignId">Campaign</Label>
            <Select value={formData.campaignId} onValueChange={(val) => setFormData({...formData, campaignId: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Campaign</SelectItem>
                {campaigns?.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end pt-4 col-span-2">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? "Save Changes" : "Add Prospect"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
