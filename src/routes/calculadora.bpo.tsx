import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/calculadora/bpo")({
  component: () => <Placeholder title="Calculadora BPO Financeiro" />,
});
