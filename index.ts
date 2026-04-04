import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { type = "analysis", career_goals, education, extracted_skills, resume_text, job_title, job_description } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    // Build tool schema based on type
    let tools: any[] = [];
    let tool_choice: any = undefined;

    if (type === "resume") {
      systemPrompt = "You are a resume analysis expert. Analyze the resume and extract structured data.";
      userPrompt = `Analyze this resume:\n\n${resume_text}`;
      tools = [{
        type: "function",
        function: {
          name: "resume_analysis",
          description: "Return structured resume analysis",
          parameters: {
            type: "object",
            properties: {
              skills: { type: "array", items: { type: "string" }, description: "Technical and soft skills found" },
              projects: { type: "array", items: { type: "string" }, description: "Projects mentioned" },
              experience_level: { type: "string", enum: ["Entry Level", "Junior", "Mid-Level", "Senior", "Lead"] },
              summary: { type: "string", description: "Brief professional summary" },
            },
            required: ["skills", "projects", "experience_level", "summary"],
          },
        },
      }];
      tool_choice = { type: "function", function: { name: "resume_analysis" } };
    } else if (type === "enhance") {
      systemPrompt = "You are an expert resume writer. Transform weak resume text into a polished, professional version. Keep the same information but improve wording, structure, and impact. Use strong action verbs and quantify achievements where possible.";
      userPrompt = `Enhance this resume text:\n\n${resume_text}`;
      tools = [{
        type: "function",
        function: {
          name: "enhanced_resume",
          description: "Return enhanced resume text",
          parameters: {
            type: "object",
            properties: {
              enhanced_text: { type: "string", description: "The improved resume text" },
            },
            required: ["enhanced_text"],
          },
        },
      }];
      tool_choice = { type: "function", function: { name: "enhanced_resume" } };
    } else if (type === "roadmap") {
      systemPrompt = "You are a career development expert. Create a personalized learning roadmap.";
      userPrompt = `Create a career roadmap for someone with:
- Career goals: ${(career_goals || []).join(", ")}
- Education: ${education || "Not specified"}
- Current skills: ${(extracted_skills || []).join(", ")}
- Resume summary: ${resume_text ? resume_text.substring(0, 500) : "Not provided"}

Generate 5-7 actionable steps in priority order.`;
      tools = [{
        type: "function",
        function: {
          name: "career_roadmap",
          description: "Return career roadmap steps",
          parameters: {
            type: "object",
            properties: {
              steps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    step: { type: "number" },
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["High", "Medium", "Low"] },
                    suggested_projects: { type: "array", items: { type: "string" } },
                    duration: { type: "string" },
                  },
                  required: ["step", "title", "description", "priority", "suggested_projects", "duration"],
                },
              },
            },
            required: ["steps"],
          },
        },
      }];
      tool_choice = { type: "function", function: { name: "career_roadmap" } };
    } else if (type === "eligibility") {
      systemPrompt = "You are a job eligibility assessment expert.";
      userPrompt = `Assess eligibility for this job:
Job: ${job_title}
Description: ${job_description}

Candidate:
- Goals: ${(career_goals || []).join(", ")}
- Education: ${education || "Not specified"}
- Skills: ${(extracted_skills || []).join(", ")}
- Resume: ${resume_text ? resume_text.substring(0, 500) : "Not provided"}`;
      tools = [{
        type: "function",
        function: {
          name: "eligibility_check",
          description: "Return eligibility assessment",
          parameters: {
            type: "object",
            properties: {
              eligible: { type: "boolean" },
              match_score: { type: "number", description: "0-100 match percentage" },
              missing_skills: { type: "array", items: { type: "string" } },
              explanation: { type: "string" },
            },
            required: ["eligible", "match_score", "missing_skills", "explanation"],
          },
        },
      }];
      tool_choice = { type: "function", function: { name: "eligibility_check" } };
    } else {
      // Default career analysis
      systemPrompt = "You are a career analysis AI. Provide comprehensive career analysis.";
      userPrompt = `Analyze this career profile:
- Career goals: ${(career_goals || []).join(", ")}
- Education: ${education || "Not specified"}
- Skills: ${(extracted_skills || []).join(", ")}
- Resume: ${resume_text ? resume_text.substring(0, 500) : "Not provided"}`;
      tools = [{
        type: "function",
        function: {
          name: "career_analysis",
          description: "Return career analysis",
          parameters: {
            type: "object",
            properties: {
              readiness_score: { type: "number", description: "0-100 career readiness score" },
              extracted_skills: { type: "array", items: { type: "string" } },
              missing_skills: { type: "array", items: { type: "string" } },
              summary: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
            },
            required: ["readiness_score", "extracted_skills", "missing_skills", "summary", "strengths", "weaknesses"],
          },
        },
      }];
      tool_choice = { type: "function", function: { name: "career_analysis" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: return content as text
    const content = aiData.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ text: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
