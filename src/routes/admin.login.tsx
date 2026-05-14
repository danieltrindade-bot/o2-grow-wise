import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/admin/login")({
  component: () => <Placeholder title="Login Admin" />,
});
