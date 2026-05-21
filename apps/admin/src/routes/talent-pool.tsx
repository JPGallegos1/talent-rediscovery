import { createFileRoute } from "@tanstack/react-router";
import { TalentPoolRoute } from "../main";

export const Route = createFileRoute("/talent-pool")({
  component: TalentPoolRoute,
});
