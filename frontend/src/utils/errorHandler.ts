export const extractErrorMessage = (error: any): string => {
  if (error.response) {
    return error.response.data?.message || "An unexpected error occurred.";
  } else if (error.request) {
    return "No response from the server. Please try again later.";
  } else {
    return error.message || "Something went wrong.";
  }
};
