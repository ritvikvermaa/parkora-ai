import { createFileRoute } from "@tanstack/react-router";

import ProtectedRoute from "../components/ProtectedRoute";
import { GuardDashboard, type GuardView } from "./_app.guard";

const validSections: GuardView[] = [
  "entry",
  "exit",
  "search",
  "visitors",
  "residents",
];

export const Route = createFileRoute("/_app/guard_/$section")({
  head: ({ params }) => ({
    meta: [{ title: `${formatTitle(params.section)} — Parkora AI` }],
  }),
  component: GuardSectionRoute,
});

function GuardSectionRoute() {
  const { section } = Route.useParams();
  const view = validSections.includes(section as GuardView)
    ? (section as GuardView)
    : "entry";

  return (
    <ProtectedRoute roles={["guard", "admin"]}>
      <GuardDashboard view={view} />
    </ProtectedRoute>
  );
}

function formatTitle(section = "") {
  return section.charAt(0).toUpperCase() + section.slice(1);
}
