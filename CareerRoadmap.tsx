import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Map, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  priority: string;
  suggested_projects: string[];
  duration: string;
}

export default function CareerRoadmap() {
  const { profile } = useProfile();
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("career-analysis", {
        body: {
          type: "roadmap",
          career_goals: profile?.career_goals,
          education: profile?.education,
          extracted_skills: profile?.extracted_skills,
          resume_text: profile?.resume_text,
        },
      });
      if (error) throw error;
      setRoadmap(data?.steps ?? []);
      setGenerated(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Map className="h-6 w-6 text-primary" /> Career Roadmap
        </h1>
        <p className="text-muted-foreground text-sm">
          Personalized step-by-step plan based on your skill gaps
        </p>
      </div>

      {!generated && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium mb-2">Generate Your Career Roadmap</p>
            <p className="text-muted-foreground text-sm mb-6">
              Based on your profile and skill gaps, we'll create a prioritized learning plan.
            </p>
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Generate Roadmap
            </Button>
          </CardContent>
        </Card>
      )}

      {roadmap.map((step) => (
        <Card key={step.step} className="bg-card border-border hover:border-primary/30 transition-colors animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {step.step}
              </div>
              <div className="flex-1">
                <CardTitle className="font-display text-foreground text-base">{step.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{step.priority} priority</Badge>
                  <span className="text-xs text-muted-foreground">{step.duration}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{step.description}</p>
            {step.suggested_projects.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-foreground mb-1.5">Suggested Projects</h4>
                <ul className="space-y-1">
                  {step.suggested_projects.map((p, i) => (
                    <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
