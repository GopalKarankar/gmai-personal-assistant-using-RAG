import {
  Inbox,
  LockKeyhole,
  MessageSquareText,
  Sparkles,
} from "lucide-react";

export default function Login() {

  // const login = googleAuthStoreDetails((s) => s.login);

  // const user = googleAuthStoreDetails((s) => s.user);

  // const { login, user } = googleAuthStoreDetails((s) => ({
  //   login: s.login,
  //   user: s.user,
  // }));


  const highlights = [
    {
      icon: Inbox,
      label: "Priority inbox",
      detail: "Surface the messages that need a decision.",
    },
    {
      icon: MessageSquareText,
      label: "Inbox questions",
      detail: "Ask focused questions about the messages you need to review.",
    },
    {
      icon: LockKeyhole,
      label: "Google auth",
      detail: "Sign in with your Gmail account to continue.",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f5ef] text-slate-950">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(120deg,#e84d4f_0%,#f8c646_42%,#31a66a_72%,#4785f4_100%)] opacity-90" />
      <div className="absolute inset-x-0 top-56 h-40 bg-linear-to-b from-[#f7f5ef]/0 to-[#f7f5ef]" />

      <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div className="space-y-8 pt-16 lg:pt-0">
          <div className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            Gmail personal assistant
          </div>

          <div className="max-w-3xl space-y-5">
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              A calmer command center for your Gmail.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-700">
              Sign in to review priority messages and ask your assistant what
              needs attention next.
            </p>
          </div>
          
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Today</p>
                <h2 className="text-xl font-semibold">Inbox focus</h2>
              </div>
              {/* <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-medium text-emerald-200">
                Live
              </div> */}
            </div>

            <div className="space-y-3">
              {highlights.map(({ icon: Icon, label, detail }) => (
                <div
                  key={label}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
              <p className="text-sm font-medium text-cyan-100">
                Assistant prompt
              </p>
              <p className="mt-2 text-sm leading-6 text-cyan-50/80">
                "Summarize the messages I should answer before lunch."
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
