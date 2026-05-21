export function createSearchRequestFailureOutput(error: unknown): {
  applied: false;
  error: {
    category: "server_error";
    message: string;
  };
  guidance: string;
};
