import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGenerateEmailDraft, useListProspects, useUpdateEmail, useSendEmail, useListCampaigns } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Send, Save, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Compose() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialProspectId = searchParams.get("prospectId");
  
  const { data: prospects } = useListProspects();
  const { data: campaigns } = useListCampaigns();
  const generateMutation = useGenerateEmailDraft();
  const sendMutation = useSendEmail();
  const updateMutation = useUpdateEmail();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [prospectId, setProspectId] = useState<string>(initialProspectId || "");
  const [campaignId, setCampaignId] = useState<string>("none");
  const [tone, setTone] = useState<string>("persuasive");
  const [context, setContext] = useState("");
  
  const [draftId, setDraftId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!prospectId) {
      toast({ title: "Please select a prospect first", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    generateMutation.mutate({
      data: {
        prospectId: parseInt(prospectId, 10),
        campaignId: campaignId === "none" ? null : parseInt(campaignId, 10),
        tone: tone as any,
        context: context || undefined
      }
    }, {
      onSuccess: (data) => {
        setDraftId(data.id);
        setSubject(data.subject);
        setBody(data.body);
        setIsGenerating(false);
        toast({ title: "Draft generated successfully" });
      },
      onError: () => {
        setIsGenerating(false);
        toast({ title: "Failed to generate draft", variant: "destructive" });
      }
    });
  };

  const handleSend = () => {
    if (!draftId) return;
    
    // First update the draft with any manual edits
    updateMutation.mutate({
      id: draftId,
      data: { subject, body }
    }, {
      onSuccess: () => {
        // Then send it
        sendMutation.mutate({ id: draftId }, {
          onSuccess: () => {
            toast({ title: "Email sent successfully!" });
            setLocation("/emails");
          }
        });
      }
    });
  };

  const handleSave = () => {
    if (!draftId) return;
    updateMutation.mutate({
      id: draftId,
      data: { subject, body }
    }, {
      onSuccess: () => {
        toast({ title: "Draft saved" });
        setLocation("/emails");
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compose AI Draft</h1>
          <p className="text-muted-foreground mt-1">Generate a highly personalized outreach email.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-4 border-border bg-card/50 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Generation Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Prospect</Label>
              <Select value={prospectId} onValueChange={setProspectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select prospect" />
                </SelectTrigger>
                <SelectContent>
                  {prospects?.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.firstName} {p.lastName} ({p.company})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Campaign (Optional)</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="No campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {campaigns?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional Context</Label>
              <Textarea 
                placeholder="E.g. Mention our new AI feature or that we met at SaaStr..." 
                className="h-24 resize-none bg-background"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            <Button 
              className="w-full mt-2" 
              onClick={handleGenerate}
              disabled={isGenerating || !prospectId}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isGenerating ? "Generating..." : "Generate Draft"}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-8 border-border bg-card/50 shadow-sm flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg">Draft Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col">
            {!subject && !body && !isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground text-center px-6">
                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-foreground">Awaiting Generation</p>
                <p className="text-sm mt-2 max-w-sm">Select a prospect and click Generate Draft to create a personalized email using AI.</p>
              </div>
            ) : isGenerating ? (
               <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-8 h-8 mb-4 animate-spin text-primary" />
                <p className="animate-pulse">Crafting the perfect email...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-border/50">
                  <Input 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    className="font-semibold text-lg bg-transparent border-transparent px-0 shadow-none focus-visible:ring-0 rounded-none h-auto"
                    placeholder="Subject line"
                  />
                </div>
                <div className="flex-1 p-4">
                  <Textarea 
                    value={body} 
                    onChange={(e) => setBody(e.target.value)} 
                    className="min-h-[300px] h-full resize-none border-none bg-transparent shadow-none focus-visible:ring-0 p-0"
                    placeholder="Email body"
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-border/50 pt-4 flex justify-between bg-card/30">
            <Button variant="outline" onClick={handleSave} disabled={!draftId}>
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button onClick={handleSend} disabled={!draftId || updateMutation.isPending || sendMutation.isPending}>
              {(updateMutation.isPending || sendMutation.isPending) ? (
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Email
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
