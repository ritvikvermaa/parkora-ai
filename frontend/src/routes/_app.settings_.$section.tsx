import { createFileRoute } from "@tanstack/react-router";

import ProtectedRoute from "../components/ProtectedRoute";
import { SettingsPage, type SettingsView } from "./_app.settings";

const validSections: SettingsView[] = [
  "profile",
  "appearance",
  "notifications",
  "society",
];

export const Route = createFileRoute("/_app/settings_/$section")({
  head: ({ params }) => ({
    meta: [{ title: `${formatTitle(params.section)} Settings — Parkora AI` }],
  }),
  component: SettingsSectionRoute,
});

function SettingsSectionRoute() {
  const { section } = Route.useParams();
  const view = validSections.includes(section as SettingsView)
    ? (section as SettingsView)
    : "profile";

  return (
    <ProtectedRoute roles={["admin", "guard", "resident"]}>
      <SettingsPage view={view} />
    </ProtectedRoute>
  );
}

function formatTitle(section = "") {
  return section.charAt(0).toUpperCase() + section.slice(1);
}
