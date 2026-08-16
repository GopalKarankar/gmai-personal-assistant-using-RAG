import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
  MessageSquareText,  
  LogOut,
  MoreVertical,
  User,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useGmailAuthStoreDetails } from "../store/gmailAuthStore";
import Sidebar from "./Sidebar";
import { useGmailAccessTokenStore } from "../store/gmailAccessTokenStore";

const navItems = [
  { to: "/chat", label: "Chat", icon: MessageSquareText },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const { gmailUser, login, logout, setHasVisited } =
    useGmailAuthStoreDetails();
  const { setAccessToken, clearAccessToken } = useGmailAccessTokenStore();

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  // Gmail Login
  const handleGmailLogin = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/gmail.readonly",

    onSuccess: async (token) => {
      try {
        const res = await fetch(
          "https://www.googleapis.com/oauth2/v1/userinfo",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token.access_token}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error(`Response status: ${res.status}`);
        }

        const userData = await res.json();

        login(userData);
        setAccessToken(token.access_token);
        setHasVisited(false);

        navigate("/chat");

      } catch (error) {
        console.error(error.message);
      }
    },
  });

  // Gmail Logout
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
      // console.log("Logout called");
      logout();
      clearAccessToken();
      setHasVisited(false);

      navigate("/");
    } catch (error) {
      console.log(error.message);
    }
  };

  // console.log("Gmail user : ", gmailUser);

  const displayName = gmailUser?.name || gmailUser?.email || "Account";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-3">
          {gmailUser && (
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 md:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}

          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#e84d4f,#f8c646_38%,#31a66a_68%,#4785f4)] shadow-lg shadow-cyan-500/20">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5 text-white"
                fill="currentColor"
              >
                <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.2-8 5.6L4 8.2V6.5l8 5.6 8-5.6v1.7Z" />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Gmail Assistant
              </p>

              {/* <p className="text-xs text-slate-400">AI inbox companion</p> */}
            </div>
          </Link>
        </div>

        {/* Right */}
        {gmailUser ? (
          <>
            <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 md:flex">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                {gmailUser?.picture ? (
                  <img
                    src={gmailUser.picture}
                    alt={displayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-800">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}

                <span className="hidden max-w-[10rem] truncate sm:inline">
                  {displayName}
                </span>

                <MoreVertical className="h-4 w-4 text-slate-300" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-36 rounded-2xl border border-white/10 bg-slate-950/95 py-2 shadow-lg shadow-black/30 backdrop-blur">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => handleGmailLogin()}
            className="group inline-flex min-h-14 items-center gap-3 rounded-full bg-slate-950 px-4 xs:px-5 py-3 text-base font-semibold text-white shadow-[0_18px_45px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-950/20"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-lg font-bold text-slate-950">
              G
            </span>

            <span className="whitespace-nowrap">
              <span className="xs:hidden">Log in</span>
              {/* <span className="hidden xs:inline">Sign in with Gmail</span>/ */}
            </span>

            
          </button>
        )}
      </div>

      {gmailUser && (
        <Sidebar
          open={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false);
            // console.log(e);
          }}
          onSignOut={handleSignOut}
        />
      )}
    </header>
  );
}
