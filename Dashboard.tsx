import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Briefcase, MapPin, ExternalLink, Loader2, TrendingUp, Target, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
}

interface CareerAnalysis {
  readiness_score: number;
  extracted_skills: string[];
  missing_skills: string[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export default function Dashboard() {
  const { profile } = useProfile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [eligibility, setEligibility] = useState<Record<string, any>>({});
  const [checkingEligibility, setCheckingEligibility] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch jobs
  useEffect(() => {
    if (!profile?.career_goals?.length) return;
    const fetchJobs = async () => {
      setJobsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("search-jobs", {
          body: {
            keywords: profile.career_goals.join(", "),
            target_type: profile.target_type || "job",
          },
        });
        if (error) throw error;
        if (data?.jobs) setJobs(data.jobs);
      } catch (err: any) {
        console.error("Jobs fetch error:", err);
        toast({ title: "Could not fetch jobs", description: err.message, variant: "destructive" });
      } finally {
        setJobsLoading(false);
      }
    };
    fetchJobs();
  }, [profile?.career_goals, profile?.target_type]);

  // Fetch career analysis
  useEffect(() => {
    if (!profile?.career_goals?.length) return;
    const fetchAnalysis = async () => {
      setAnalysisLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("career-analysis", {
          body: {
            career_goals: profile.career_goals,
            education: profile.education,
            extracted_skills: profile.extracted_skills,
            resume_text: profile.resume_text,
          },
        });
        if (error) throw error;
        if (data) setAnalysis(data);
      } catch (err: any) {
        console.error("Analysis error:", err);
      } finally {
        setAnalysisLoading(false);
      }
    };
    fetchAnalysis();
  }, [profile]);

  const checkEligibility = async (job: Job) => {
    setCheckingEligibility(job.id);
    try {
      const { data, error } = await supabase.functions.invoke("career-analysis", {
        body: {
          type: "eligibility",
          job_title: job.title,
          job_description: job.description,
          career_goals: profile?.career_goals,
          education: profile?.education,
          extracted_skills: profile?.extracted_skills,
          resume_text: profile?.resume_text,
        },
      });
      if (error) throw error;
      setEligibility((prev) => ({ ...prev, [job.id]: data }));
    } catch (err: any) {
      toast({ title: "Error checking eligibility", variant: "destructive" });
    } finally {
      setCheckingEligibility(null);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">Your AI-powered career command center</p>
      </div>

      {/* Career Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <>
                <p className="text-3xl font-display font-bold text-foreground">
                  {analysis?.readiness_score ?? "--"}%
                </p>
                <Progress value={analysis?.readiness_score ?? 0} className="mt-2 h-2" />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-success" /> Your Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(analysis?.extracted_skills ?? profile?.extracted_skills ?? []).slice(0, 8).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
                {!analysis?.extracted_skills?.length && !profile?.extracted_skills?.length && (
                  <p className="text-xs text-muted-foreground">Upload a resume to extract skills</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Missing Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(analysis?.missing_skills ?? []).slice(0, 8).map((s) => (
                  <Badge key={s} variant="outline" className="text-xs border-warning/50 text-warning">{s}</Badge>
                ))}
                {!analysis?.missing_skills?.length && (
                  <p className="text-xs text-muted-foreground">Complete analysis to see gaps</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Summary */}
      {analysis && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-foreground">AI Career Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-success mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-foreground/80">✓ {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-warning mb-2">Areas to Improve</h4>
                <ul className="space-y-1">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-foreground/80">○ {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Listings */}
      <div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-4">
          {profile?.target_type === "internship" ? "Internship" : "Job"} Listings
        </h2>
        {jobsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Fetching jobs...</span>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center text-muted-foreground">
              No listings found. Try updating your career goals.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="bg-card border-border hover:border-primary/30 hover:card-glow transition-all duration-300"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{job.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {job.company}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary hover:text-primary"
                      onClick={() => window.open(job.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </p>
                  <p className="text-xs text-foreground/70 line-clamp-2">{job.description}</p>
                  {job.salary && (
                    <Badge variant="secondary" className="text-xs">{job.salary}</Badge>
                  )}

                  <Button
                    size="sm"
                    variant="default"
                    className="w-full mt-1"
                    onClick={() => window.open(job.url, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
