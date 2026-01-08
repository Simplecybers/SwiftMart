import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTrackingLog } from "@shared/schema";

export function useTracking(trackingNumber: string) {
  return useQuery({
    queryKey: [api.tracking.get.path, trackingNumber],
    queryFn: async () => {
      const url = buildUrl(api.tracking.get.path, { trackingNumber });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch tracking info");
      return api.tracking.get.responses[200].parse(await res.json());
    },
    enabled: !!trackingNumber,
  });
}

export function useUpdateTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ trackingNumber, ...data }: { trackingNumber: string } & Omit<InsertTrackingLog, "shipmentId" | "timestamp">) => {
      const url = buildUrl(api.tracking.update.path, { trackingNumber });
      const validated = api.tracking.update.input.parse(data);
      
      const res = await fetch(url, {
        method: api.tracking.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error("Shipment not found");
        throw new Error("Failed to update tracking");
      }
      return api.tracking.update.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.tracking.get.path, variables.trackingNumber] 
      });
    },
  });
}
