import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/calculadora/coordenador")({
  component: () => <Placeholder title="Calculadora Coordenador as a Service" />,
});
