import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/calculadora/assessoria")({
  component: () => <Placeholder title="Calculadora Assessoria Estratégica" />,
});
