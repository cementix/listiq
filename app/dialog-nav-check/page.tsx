"use client";
import NavbarShell from "../(protected)/NavbarShell";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Check() {
  return (
    <main style={{ height: "300vh" }}>
      <NavbarShell><div style={{ padding: 20, background: "green" }}>Navbar check</div></NavbarShell>
      <Dialog>
        <DialogTrigger className="fixed bottom-8 left-8">Open check</DialogTrigger>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Dialog check</DialogTitle>
        </DialogContent>
      </Dialog>
    </main>
  );
}
