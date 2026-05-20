export function createSearchRequestFailureOutput(error: unknown) {
  return {
    applied: false,
    error: {
      category: "server_error",
      message: error instanceof Error ? error.message : "The Search Request could not be created.",
    },
    guidance: "Retry the Search Request. The current Talent Pool and Shortlist were not changed.",
  };
}
