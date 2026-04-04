import { useState, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, FileText, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ResumeAnalysis {
  skills: string[];
  projects: string[];
  experience_level: string;
  summary: string;
}

export default function ResumeUpload() {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    try {
      // Extract text client-side (basic approach for PDF)
      const text = await file.text();

      // Upload file to storage
      const path = `${user.id}/${file.name}`;
      await supabase.storage.from("resumes").upload(path, file, { upsert: true });

      // Send to AI for analysis
      const { data, error } = await supabase.functions.invoke("career-analysis", {
        body: { type: "resume", resume_text: text },
      });
      if (error) throw error;

      setAnalysis(data);

      // Save to profile
      await updateProfile({
        resume_text: text,
        extracted_skills: data?.skills ?? [],
      });

      toast({ title: "Resume analyzed successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Resume Upload</h1>
        <p className="text-muted-foreground text-sm">Upload your resume for AI-powered analysis</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-8">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">
              {file ? file.name : "Click to upload your resume"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, TXT, DOC supported</p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {file && (
            <Button className="w-full mt-4" onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Analyze Resume
            </Button>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <Card className="bg-card border-border animate-slide-up">
          <CardHeader>
            <CardTitle className="font-display text-foreground flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" /> Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Experience Level</h4>
              <Badge>{analysis.experience_level}</Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Extracted Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.skills.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Projects Found</h4>
              <ul className="space-y-1">
                {analysis.projects.map((p, i) => (
                  <li key={i} className="text-sm text-foreground/80">• {p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
