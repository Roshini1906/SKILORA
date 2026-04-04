import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function CareerAnalysis() {
  const { profile } = useProfile();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const run = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.functions.invoke("career-analysis", {
          body: {
            career_goals: profile.career_goals,
            education: profile.education,
            extracted_skills: profile.extracted_skills,
            resume_text: profile.resume_text,
          },
        });
        if (data) setAnalysis(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Analyzing your career profile...</span>
      </div>
    );
  }

  if (!analysis) return <p className="text-muted-foreground">No analysis available. Complete your profile first.</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" /> Career Analysis
        </h1>
        <p className="text-muted-foreground text-sm">Deep AI-powered analysis of your profile</p>
      </div>

      <Card className="bg-card border-border card-glow">
        <CardHeader>
          <CardTitle className="font-display text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Readiness Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-display font-bold text-foreground mb-3">{analysis.readiness_score}%</p>
          <Progress value={analysis.readiness_score} className="h-3" />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold text-foreground mb-2">Profile Summary</h3>
          <p className="text-muted-foreground">{analysis.summary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-success flex items-center gap-2">
              <Target className="h-4 w-4" /> Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths?.map((s: string, i: number) => (
                <li key={i} className="text-sm text-foreground/80">✓ {s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-warning flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.weaknesses?.map((w: string, i: number) => (
                <li key={i} className="text-sm text-foreground/80">○ {w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm text-foreground">Your Skills</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {analysis.extracted_skills?.map((s: string) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm text-foreground">Missing Skills</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {analysis.missing_skills?.map((s: string) => (
                <Badge key={s} variant="outline" className="border-warning/50 text-warning">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
