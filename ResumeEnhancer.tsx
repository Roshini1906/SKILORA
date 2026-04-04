import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ResumeEnhancer() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const enhance = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("career-analysis", {
        body: { type: "enhance", resume_text: input },
      });
      if (error) throw error;
      setOutput(data?.enhanced_text ?? "");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-accent" /> Resume Enhancer
        </h1>
        <p className="text-muted-foreground text-sm">Paste your resume text and get an AI-enhanced version</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-display text-foreground">Original Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste your resume text here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={16}
              className="bg-secondary border-border text-foreground resize-none"
            />
            <Button className="w-full mt-4" onClick={enhance} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Enhance Resume
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-display text-foreground">Enhanced Version</CardTitle>
            {output && (
              <Button size="sm" variant="ghost" onClick={copyOutput} className="text-muted-foreground">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : output ? (
              <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed max-h-[28rem] overflow-y-auto">
                {output}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-20 text-center">
                Enhanced resume will appear here
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
