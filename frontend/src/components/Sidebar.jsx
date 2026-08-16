import { NavLink } from "react-router-dom";
import {
  MessageSquareText,
  User,
  LogOut,
  Sparkles,
  X  
} from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";

const navItems = [
  { to: "/chat", label: "Chat", icon: MessageSquareText },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Sidebar({ open, onClose, onSignOut }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-slate-950 border-r border-slate-900 p-5 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#e84d4f,#f8c646_38%,#31a66a_68%,#4785f4)]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="text-white font-semibold">Menu</p>
              <p className="text-slate-400 text-xs">Quick access</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  isActive
                    ? "bg-[linear-gradient(135deg,#e84d4f,#f8c646_38%,#31a66a_68%,#4785f4)] text-white shadow-lg"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        <a
          href="https://www.linkedin.com/in/gopal-karankar-bb7730377"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-slate-900 px-4 py-3 text-slate-200 transition-all duration-200 hover:border-emerald-400/40 hover:bg-slate-800 hover:text-white group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0A66C2,#31a66a)] shadow-md">
            <FaLinkedin className="h-5 w-5 text-white" />
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 group-hover:text-emerald-300">
              Connect on
            </span>
            <span className="font-medium">Gopal Karankar</span>
          </div>
        </a>

        <button
          onClick={() => {
            onClose();
            onSignOut();
          }}
          className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-800 px-4 py-3 text-slate-200 hover:bg-slate-700"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>
    </>
  );
}
