import { ArrowRight, Inbox, MessageSquareText, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function Homepage() {
  const cards = [
    { icon: Inbox, title: "Triage inbox", copy: "Separate urgent messages from noise so you can focus on what matters." },
    { icon: MessageSquareText, title: "Ask your inbox", copy: "Get concise answers about the emails you need to review." },
    { icon: ShieldCheck, title: "Stay in control", copy: "Keep your Gmail data visible and easy to review." },
  ];

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_25px_80px_rgba(2,6,23,0.35)]">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div className="flex flex-col justify-center space-y-6">
            <p className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-medium text-slate-200">
              Workspace overview
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                Handle Gmail with less tab switching and more focus.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Review your inbox and ask focused questions in one place built for scanning and deciding.
              </p>
            </div>
            <Link
              to="/chat"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Open chat
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
            <div className="space-y-3">
              {cards.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-950">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
