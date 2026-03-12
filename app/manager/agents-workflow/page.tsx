import { getSupabaseAdmin } from "@/lib/supabase-admin";
import WorkflowClient from "./WorkflowClient";

export const dynamic = "force-dynamic";

export default async function AgentsWorkflowPage() {
  const supabase = getSupabaseAdmin();
  
  // Real data fetching directly from the V1 backend schema
  const [
    workflowsRes,
    runsRes,
    findingsRes,
    briefsRes,
    casesRes
  ] = await Promise.all([
    supabase.from("agent_workflows").select("*"),
    supabase.from("agent_runs").select("id, workflow_id, status, started_at, finished_at").order("started_at", { ascending: false }).limit(2000),
    supabase.from("agent_findings").select("id, finding_type, status, created_at").order("created_at", { ascending: false }).limit(2000),
    supabase.from("review_briefs").select("id, status, created_at").order("created_at", { ascending: false }),
    supabase.from("review_cases").select("id, case_type, decision_status, created_at").order("created_at", { ascending: false })
  ]);

  return (
    <WorkflowClient 
      workflows={workflowsRes.data || []} 
      runs={runsRes.data || []} 
      findings={findingsRes.data || []} 
      briefs={briefsRes.data || []} 
      cases={casesRes.data || []} 
    />
  );
}
