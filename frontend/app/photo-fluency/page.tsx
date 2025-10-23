"use client";

import { AppNav } from "@/components/nav";
import { AppProvider } from "@/components/providers/app-provider";
import PhotoFluencyTrainer from "@/app/exercises/PhotoFluencyTrainer";

// Photo Fluency Page (Default Export)
export default function PhotoFluencyPage() {
  return (
    <AppProvider>
      <AppNav />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8">
        <section className="grid gap-4">
          <PhotoFluencyTrainer />
        </section>
      </main>
    </AppProvider>
  );
}