"use client";

import type { ComponentProps } from "react";
import { Button } from "./ui";

/** A submit button that asks before doing something that can't be undone. */
export function ConfirmSubmit({ message, ...props }: ComponentProps<typeof Button> & { message: string }) {
  return (
    <Button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...props}
    />
  );
}
