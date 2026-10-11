"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { createSingleFlight } from "@/lib/client/single-flight";

export function useMutation() {
  const [isPending, setPending] = useState(false);
  const flight = useRef(createSingleFlight());

  const run = useCallback((operation: () => Promise<void>) => {
    void flight.current(async () => {
      setPending(true);
      try {
        await operation();
      } catch {
        toast.error("Request failed. Please try again.");
      } finally {
        setPending(false);
      }
    });
  }, []);

  return [isPending, run] as const;
}
