import { use } from "react";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  return <AnalyticsDashboard eventId={eventId} />;
} 