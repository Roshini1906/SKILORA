import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate demo job data when no API key is available
function generateDemoJobs(keywords: string, targetType: string) {
  const roles = keywords.split(",").map((k: string) => k.trim()).filter(Boolean);
  const companies = [
    { name: "Google", careers: "https://careers.google.com" },
    { name: "Microsoft", careers: "https://careers.microsoft.com" },
    { name: "Amazon", careers: "https://www.amazon.jobs" },
    { name: "Apple", careers: "https://jobs.apple.com" },
    { name: "Meta", careers: "https://www.metacareers.com" },
    { name: "Netflix", careers: "https://jobs.netflix.com" },
    { name: "Tesla", careers: "https://www.tesla.com/careers" },
    { name: "IBM", careers: "https://www.ibm.com/careers" },
    { name: "Adobe", careers: "https://careers.adobe.com" },
    { name: "Salesforce", careers: "https://careers.salesforce.com" },
  ];
  const locations = [
    "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA",
    "Remote", "London, UK", "Bangalore, India", "Berlin, Germany",
  ];

  const jobs = [];
  for (let i = 0; i < Math.min(8, roles.length * 3); i++) {
    const role = roles[i % roles.length];
    const company = companies[i % companies.length];
    const isInternship = targetType === "internship";
    jobs.push({
      id: `demo-${i}`,
      title: isInternship ? `${role} Intern` : role,
      company: company.name,
      location: locations[i % locations.length],
      description: `We are looking for a talented ${role.toLowerCase()} to join our team. You will work on cutting-edge projects involving ${role.toLowerCase()} technologies, collaborate with cross-functional teams, and contribute to products used by millions.`,
      url: company.careers,
      salary: isInternship ? "$25-40/hr" : `$${80 + i * 15}k - $${120 + i * 15}k`,
    });
  }
  return jobs;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { keywords, target_type } = await req.json();

    if (!keywords) {
      return new Response(JSON.stringify({ jobs: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try Adzuna API if keys are available
    const ADZUNA_APP_ID = Deno.env.get("ADZUNA_APP_ID");
    const ADZUNA_APP_KEY = Deno.env.get("ADZUNA_APP_KEY");

    if (ADZUNA_APP_ID && ADZUNA_APP_KEY) {
      try {
        const searchTerms = keywords.replace(/,/g, " ").trim();
        const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=8&what=${encodeURIComponent(searchTerms)}&content-type=application/json`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const jobs = (data.results || []).map((r: any, i: number) => ({
            id: r.id || `adzuna-${i}`,
            title: r.title || "Untitled",
            company: r.company?.display_name || "Unknown Company",
            location: r.location?.display_name || "Unknown",
            description: r.description || "",
            url: r.redirect_url || "#",
            salary: r.salary_min ? `$${Math.round(r.salary_min / 1000)}k - $${Math.round((r.salary_max || r.salary_min) / 1000)}k` : undefined,
          }));
          return new Response(JSON.stringify({ jobs }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (err) {
        console.error("Adzuna API error:", err);
      }
    }

    // Fallback to demo data
    const jobs = generateDemoJobs(keywords, target_type || "job");
    return new Response(JSON.stringify({ jobs, demo: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", jobs: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
