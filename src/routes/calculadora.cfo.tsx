import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/calculadora/cfo")({
  component: () => <Placeholder title="Calculadora CFO as a Service" />,
});
