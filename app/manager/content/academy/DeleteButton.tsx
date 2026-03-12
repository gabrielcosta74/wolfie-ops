"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteResourceById } from "./actions";

type Props = {
  id: number;
  redirectTo: string;
  confirmMessage?: string;
};

export function DeleteButton({
  id,
  redirectTo,
  confirmMessage = "Tens a certeza que queres eliminar este item?",
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(confirmMessage)) return;
    startTransition(async () => {
      await deleteResourceById(id, redirectTo);
    });
  }

  return (
    <button
      type="button"
      className="ac-icon-btn ac-icon-btn--danger"
      title="Eliminar"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? <span className="ac-spinner" style={{ width: "12px", height: "12px" }} /> : <Trash2 size={14} />}
    </button>
  );
}
