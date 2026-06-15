"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { Alert } from "../_components/admin-ui";
import { markDelivered, type MarkDeliveredState } from "./actions";

const initial: MarkDeliveredState = {};

export function MarkDelivered({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(markDelivered, initial);

  if (state.success) {
    return (
      <div className="flex flex-col gap-2">
        <Alert kind="success">{state.success}</Alert>
        {state.warning && <Alert kind="error">{state.warning}</Alert>}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Marking…" : "Mark as delivered"}
        </Button>
      </div>
      <p className="text-xs text-lumen-ink/55">
        Completes the order and emails the customer.
      </p>
    </form>
  );
}
