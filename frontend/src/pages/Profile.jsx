import { Link } from "react-router-dom";
import { ArrowLeft, Mail, User, Hash } from "lucide-react";
import { useGmailAuthStoreDetails } from "../store/gmailAuthStore";

export default function Profile() {
  const gmailUser = useGmailAuthStoreDetails((state) => state.gmailUser);

  // if (!gmailUser) {
  //   return <Navigate to="/" replace />;
  // }

  return (
    <main className="mx-auto min-h-[calc(100vh-73px)] max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_25px_80px_rgba(2,6,23,0.45)] backdrop-blur-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              Profile
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Your account details
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Review the Google account currently connected to the assistant and
              manage your profile from one place.
            </p>
          </div>

          <Link
            to="/chat"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chat
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8">
            <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-5">
                {gmailUser?.picture ? (
                  <img
                    src={gmailUser?.picture}
                    alt={gmailUser?.name || "Profile"}
                    className="h-20 w-20 rounded-3xl object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-3xl bg-slate-800 text-white">
                    <User className="h-10 w-10" />
                  </div>
                )}
                <div>
                  <p className="text-xl font-semibold text-white">{gmailUser?.name || "No name available"}</p>
                  <p className="text-sm text-slate-400">Signed in with Google</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-rows-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">Email</p>
                  <div className="mt-3 flex items-center gap-2 text-white">
                    <Mail className="h-4 w-4 text-cyan-300" />
                    <span className="break-all">{gmailUser?.email || "Unavailable"}</span>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">User ID</p>
                  <div className="mt-3 flex items-center gap-2 text-white">
                    <Hash className="h-4 w-4 text-cyan-300" />
                    <span className="break-all">{gmailUser?.id || "Unavailable"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              Helpful info
            </p>
            <div className="mt-6 space-y-4 text-sm leading-6">
              <p>
                Your profile is used only to connect the Gmail account for the assistant.
                It does not store additional personal data beyond the authenticated Google gmailUser details.
              </p>
              <p>
                If you want to switch accounts, sign out from the app and sign in with a different Google account.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
