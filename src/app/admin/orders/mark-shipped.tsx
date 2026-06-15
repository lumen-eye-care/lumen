"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { Alert, Field, Select } from "../_components/admin-ui";
import { COURIERS } from "@/lib/frame-schemas";
import { markShipped, type MarkShippedState } from "./actions";

const initial: MarkShippedState = {};

export function MarkShipped({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(markShipped, initial);

  if (state.success) {
    return (
      <div className="flex flex-col gap-2">
        <Alert kind="success">{state.success}</Alert>
        {state.warning && <Alert kind="error">{state.warning}</Alert>}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <Select label="Courier" name="courier" defaultValue="">
        <option value="">Not specified</option>
        {COURIERS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Field
        label="Tracking number"
        name="tracking_number"
        placeholder="Optional"
        maxLength={120}
      />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Marking…" : "Mark as shipped"}
        </Button>
      </div>
      <p className="text-xs text-lumen-ink/55">
        Sets the order to shipped and emails the customer.
      </p>
    </form>
  );
}
