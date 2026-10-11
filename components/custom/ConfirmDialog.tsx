"use client";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useEffect, useState } from "react";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [present, setPresent] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPresent(true);
      setIsClosing(false);
      return;
    }

    if (!present) return;

    setIsClosing(true);

    const timeout = window.setTimeout(() => {
      setPresent(false);
      setIsClosing(false);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [open, present]);

  return (
    <Dialog open={present} onOpenChange={(nextOpen) => { if (!isPending) onOpenChange(nextOpen); }}>
      <DialogContent
        disableDefaultAnimation
        showCloseButton={false}
        className={`confirm-dialog-shell ${
          isClosing ? "is-closing" : ""
        } w-full max-w-md border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-md`}
      >
        <div className="confirm-dialog-panel rounded-xl border border-primary/20 bg-background/95 p-6 text-white shadow-[0_0_44px_rgba(139,92,246,0.22)] backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="max-w-sm text-sm leading-6 text-white/50">
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="-mx-6 -mb-6 mt-6 border-white/10 bg-transparent px-6 py-5">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="text-white/55 hover:bg-white/5 hover:text-white"
            >
              {cancelText}
            </Button>

            <Button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="bg-primary text-primary-foreground shadow-[0_0_18px_rgba(139,92,246,0.22)] hover:bg-primary/90"
            >
              {isPending && <LoaderCircle className="size-4 animate-spin" />}
              {confirmText}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
