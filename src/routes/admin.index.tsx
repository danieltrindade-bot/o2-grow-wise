import { createFileRoute, redirect } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    // Auth será implementada em prompts posteriores. Por enquanto, sempre redireciona.
    const authed = typeof window !== "undefined" && sessionStorage.getItem("o2-admin-auth") === "1";
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: () => <Placeholder title="Painel Admin" />,
});
