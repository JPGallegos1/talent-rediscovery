import { createFileRoute } from "@tanstack/react-router";
import { MatchDetailRoute } from "../main";

export const Route = createFileRoute("/matches/$matchId")({
  component: () => {
    const { matchId } = Route.useParams();
    return <MatchDetailRoute matchId={matchId} />;
  },
});
