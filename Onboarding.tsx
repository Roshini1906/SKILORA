import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CAREER_OPTIONS = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Scientist", "ML Engineer", "DevOps Engineer",
  "Mobile Developer", "UI/UX Designer", "Product Manager",
  "Cloud Architect", "Cybersecurity Analyst", "QA Engineer",
  "Data Analyst", "Blockchain Developer", "AI Researcher",
];

export default function Onboarding() {
  const { updateProfile } = useProfile();
  const [fullName, setFullName] = useState("");
  const [education, setEducation] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [targetType, setTargetType] = useState<string>("job");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toast } = useToast();

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoals.length === 0) {
      toast({ title: "Select at least one career goal", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        full_name: fullName,
        education,
        career_goals: selectedGoals,
        target_type: targetType,
      });
      toast({ title: "Profile saved!" });
      // Force full reload so ProtectedRoutes re-fetches the updated profile
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-display text-foreground">Complete Your Profile</CardTitle>
          <p className="text-muted-foreground text-sm">
            Tell us about yourself so we can tailor your career insights.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-secondary border-border text-foreground" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Education</label>
              <Input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="e.g. B.Tech in Computer Science" required className="bg-secondary border-border text-foreground" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Career Goals (multi-select)</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                >
                  {selectedGoals.length > 0 ? `${selectedGoals.length} selected` : "Select career goals..."}
                </button>
                {dropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-card border border-border shadow-lg">
                    {CAREER_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleGoal(opt)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${
                          selectedGoals.includes(opt) ? "text-primary font-medium" : "text-foreground"
                        }`}
                      >
                        {selectedGoals.includes(opt) ? "✓ " : ""}{opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedGoals.map((g) => (
                  <Badge key={g} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleGoal(g)}>
                    {g} <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Target Type</label>
              <div className="flex gap-2">
                {["job", "internship", "both"].map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={targetType === t ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setTargetType(t)}
                    className="capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Started
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
