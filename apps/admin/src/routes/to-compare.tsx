import { createFileRoute } from "@tanstack/react-router";
import { ComparisonReportRoute } from "../main";

export const Route = createFileRoute("/to-compare")({
  component: ComparisonReportRoute,
});
