import { createFileRoute } from "@tanstack/react-router";
import { HomeRoute } from "../main";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});
