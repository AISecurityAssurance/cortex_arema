import { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">{children}</main>
  );
}
