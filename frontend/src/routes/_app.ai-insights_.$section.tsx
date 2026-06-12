import { createFileRoute } from "@tanstack/react-router";

import ProtectedRoute from "../components/ProtectedRoute";
import { AIInsights, type AiView } from "./_app.ai-insights";

const validSections: AiView[] = ["pressure", "actions", "violations", "counts"];

export const Route = createFileRoute("/_app/ai-insights_/$section")({
  head: ({ params }) => ({
    meta: [{ title: `${formatTitle(params.section)} — Parkora AI` }],
  }),
  component: AiSectionRoute,
});

function AiSectionRoute() {
  const { section } = Route.useParams();
  const view = validSections.includes(section as AiView)
    ? (section as AiView)
    : "pressure";

  return (
    <ProtectedRoute roles={["admin"]}>
      <AIInsights view={view} />
    </ProtectedRoute>
  );
}

function formatTitle(section = "") {
  return section.charAt(0).toUpperCase() + section.slice(1);
}
