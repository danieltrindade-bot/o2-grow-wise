import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/calculadora/oxy")({
  component: () => <Placeholder title="Calculadora Plataforma Oxy" />,
});
