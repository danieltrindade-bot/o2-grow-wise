import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/resultados")({
  component: () => <Placeholder title="Resultados" />,
});
