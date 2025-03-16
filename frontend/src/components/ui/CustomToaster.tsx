import { Toaster } from "sonner";

export function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "text-lg p-2 rounded-lg shadow-lg",
        style: {
          fontSize: "1.25rem",
        },
      }}
      richColors
      theme="light"
    />
  );
}
