import Image from "next/image"
import Link from "next/link"
import { AppNav } from "@/components/nav"
import { AppProvider } from "@/components/providers/app-provider"
import { QuizCard } from "@/components/quiz/quiz-card"

export default function ExercisesPage() {
  return (
    <AppProvider>
      <AppNav />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <h2 className="text-sm font-semibold">Vocabulary Drills</h2>
            <Image
              src="/images/ex-vocab.jpg"
              alt="Vocabulary drill illustration"
              width={600}
              height={360}
              className="mt-3 h-32 w-full rounded-md object-cover"
            />
            <p className="mt-2 text-sm text-foreground/80">Master essential words and phrases.</p>
            <Link className="mt-2 inline-block text-sm underline" href="#">
              Explore
            </Link>
          </div>

          <div className="rounded-lg border border-border/50 bg-card p-4">
            <h2 className="text-sm font-semibold">Grammar Quizzes</h2>
            <Image
              src="/images/ex-grammar.jpg"
              alt="Grammar quiz illustration"
              width={600}
              height={360}
              className="mt-3 h-32 w-full rounded-md object-cover"
            />
            <p className="mt-2 text-sm text-foreground/80">Build strong grammar foundations.</p>
            <Link className="mt-2 inline-block text-sm underline" href="#">
              Explore
            </Link>
          </div>

          <div className="rounded-lg border border-border/50 bg-card p-4">
            <h2 className="text-sm font-semibold">Pronunciation</h2>
            <Image
              src="/images/ex-pronunciation.jpg"
              alt="Pronunciation practice illustration"
              width={600}
              height={360}
              className="mt-3 h-32 w-full rounded-md object-cover"
            />
            <p className="mt-2 text-sm text-foreground/80">Improve with guided speaking exercises.</p>
            <Link className="mt-2 inline-block text-sm underline" href="#">
              Explore
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <h3 className="text-sm font-semibold">Quick Quiz</h3>
            <p className="mt-1 text-sm text-foreground/80">Choose the correct article for “café” in French:</p>
            <div className="mt-3">
              <QuizCard
                prompt="Select the right article:"
                options={[
                  { id: "a", text: "le café", correct: true },
                  { id: "b", text: "la café" },
                  { id: "c", text: "l' café" },
                ]}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-card p-4">
            <h3 className="text-sm font-semibold">Culture Scenario</h3>
            <p className="mt-2 text-sm text-foreground/80">
              Practice ordering at a Parisian café with roleplay prompts.
            </p>
            <Link className="mt-2 inline-block text-sm underline" href="#">
              Start Scenario
            </Link>
          </div>
        </section>
      </main>
    </AppProvider>
  )
}
