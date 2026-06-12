import { createFileRoute } from "@tanstack/react-router";

import ProtectedRoute from "../components/ProtectedRoute";
import { SlotsPage, type SlotsView } from "./_app.slots";

const validSections: SlotsView[] = [
  "summary",
  "search",
  "jade",
  "topaz",
  "nest",
  "opal",
];

export const Route = createFileRoute("/_app/slots_/$section")({
  head: ({ params }) => ({
    meta: [{ title: `${formatTitle(params.section)} Parking — Parkora AI` }],
  }),
  component: SlotsSectionRoute,
});

function SlotsSectionRoute() {
  const { section } = Route.useParams();
  const view = validSections.includes(section as SlotsView)
    ? (section as SlotsView)
    : "summary";

  return (
    <ProtectedRoute roles={["admin", "guard"]}>
      <SlotsPage view={view} />
    </ProtectedRoute>
  );
}

function formatTitle(section = "") {
  return section.charAt(0).toUpperCase() + section.slice(1);
}
