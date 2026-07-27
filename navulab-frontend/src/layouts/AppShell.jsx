import { createContext, useContext, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import "./AppShell.css";

const ROLE_LABELS = {
  ADMIN: "Admin",
  CEO: "CEO",
  CTO: "CTO",
  HR: "HR",
  FINANCE: "Finance",
  TEAM_LEAD: "Team Lead",
  EMPLOYEE: "Employee",
};

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: "fa-solid fa-chart-pie", end: true, hover: "group-hover:rotate-12" },
  { to: "/tasks", label: "Tasks", icon: "fa-solid fa-list-check", badgeKey: "tasks", hover: "group-hover:-translate-y-0.5" },
  { to: "/attendance", label: "Attendance", icon: "fa-solid fa-user-clock", hover: "group-hover:rotate-45" },
  { to: "/leaves", label: "Leaves", icon: "fa-solid fa-calendar-minus", hover: "group-hover:-rotate-12" },
  { to: "/reports", label: "Daily Reports", icon: "fa-solid fa-file-invoice", hover: "group-hover:translate-x-0.5" },
  { to: "/chat", label: "Chat", icon: "fa-solid fa-comments", badgeKey: "live", hover: "" },
];

const PAGE_TITLES = {
  "/": "Overview",
  "/tasks": "Tasks",
  "/attendance": "Attendance",
  "/leaves": "Leaves",
  "/reports": "Daily Reports",
  "/chat": "Chat",
  "/payroll": "Payroll",
  "/employees": "Employees",
};

const ShellToastContext = createContext(() => {});
export function useShellToast() {
  return useContext(ShellToastContext);
}

export default function AppShell() {
  const { user, logout, canSeeAllDepartments, isFinance, isHR, isAdmin, isTeamLead } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/tasks/tasks/")
      .then(({ data }) => {
        if (cancelled) return;
        const tasks = data.results || data;
        setPendingTasksCount(tasks.filter((t) => t.status === "PENDING").length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const canvasRef = useRef(null);
  const isDarkModeRef = useRef(isDarkMode);
  useEffect(() => {
    isDarkModeRef.current = isDarkMode;
  }, [isDarkMode]);

  function showToast(message, type = "info") {
    setToast({ visible: true, message, type });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  function toggleTheme() {
    setIsDarkMode((v) => !v);
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // ---- Interactive canvas background with cursor trail (ported 1:1 from the HTML) ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width = window.innerWidth || 1000;
    let height = window.innerHeight || 800;
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetX = mouseX;
    let targetY = mouseY;

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));
    const cursorTrail = [];

    function resizeCanvas() {
      width = canvas.width = window.innerWidth || 1000;
      height = canvas.height = window.innerHeight || 800;
    }
    function onMouseMove(e) {
      if (!e || typeof e.clientX !== "number") return;
      targetX = e.clientX;
      targetY = e.clientY;

      cursorTrail.push({ x: e.clientX, y: e.clientY, radius: Math.random() * 4 + 2, alpha: 1 });
      if (cursorTrail.length > 20) cursorTrail.shift();

      document.querySelectorAll(".novu-shell .glass-card").forEach((card) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });
    }

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", onMouseMove);
    resizeCanvas();

    let frameId;
    function render() {
      const dark = isDarkModeRef.current;

      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const radius = Math.max(width, height) * 0.75;
      const grad1 = ctx.createRadialGradient(mouseX, mouseY, 40, mouseX, mouseY, Math.max(50, radius));
      if (dark) {
        grad1.addColorStop(0, "rgba(28, 74, 115, 0.85)");
        grad1.addColorStop(0.5, "rgba(18, 50, 84, 0.95)");
        grad1.addColorStop(1, "rgba(10, 36, 64, 0.98)");
      } else {
        grad1.addColorStop(0, "rgba(235, 245, 255, 0.9)");
        grad1.addColorStop(0.5, "rgba(243, 248, 252, 0.95)");
        grad1.addColorStop(1, "rgba(230, 240, 250, 0.98)");
      }
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const orb1X = width * 0.2 + (mouseX - width / 2) * 0.12;
      const orb1Y = height * 0.3 + (mouseY - height / 2) * 0.12;
      const gradOrb1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, 350);
      if (dark) {
        gradOrb1.addColorStop(0, "rgba(102, 232, 255, 0.18)");
        gradOrb1.addColorStop(1, "transparent");
      } else {
        gradOrb1.addColorStop(0, "rgba(2, 132, 199, 0.12)");
        gradOrb1.addColorStop(1, "transparent");
      }
      ctx.fillStyle = gradOrb1;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < cursorTrail.length; i++) {
        const pt = cursorTrail[i];
        pt.alpha -= 0.04;
        pt.radius *= 0.95;
        if (pt.alpha > 0) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(0.5, pt.radius), 0, Math.PI * 2);
          ctx.fillStyle = dark ? `rgba(102, 232, 255, ${pt.alpha})` : `rgba(2, 132, 199, ${pt.alpha * 0.5})`;
          ctx.fill();
        }
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          p.x -= (dx / dist) * 1.5;
          p.y -= (dy / dist) * 1.5;
        }
      });

      // Constellation mesh: thin lines between particles that are near each other
      const linkDistance = 150;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDistance) {
            const alpha = (1 - dist / linkDistance) * (dark ? 0.35 : 0.2);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = dark ? `rgba(102, 232, 255, ${alpha})` : `rgba(2, 132, 199, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = dark ? "rgba(102, 232, 255, 0.5)" : "rgba(2, 132, 199, 0.35)";
        ctx.fill();
      });

      frameId = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const initial = (user?.username || "?").charAt(0).toUpperCase();
  const hour = new Date().getHours();
  const dateText = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const pageTitle = PAGE_TITLES[location.pathname] || "Overview";

  return (
    <ShellToastContext.Provider value={showToast}>
      <div
        className={`novu-shell ${isDarkMode ? "dark" : ""} min-h-screen relative flex overflow-x-hidden selection:bg-electric-cyan selection:text-navy-900`}
        style={{
          background: isDarkMode
            ? "linear-gradient(180deg, #0A2440 0%, #123254 45%, #1C4A73 100%)"
            : "linear-gradient(180deg, #EBF5FF 0%, #F3F8FC 45%, #E6F0FA 100%)",
          color: isDarkMode ? "#f0f9ff" : "#071B2E",
        }}
      >
        <canvas ref={canvasRef} id="novuShellCanvas" />

        {/* Mobile drawer backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-navy-900/80 backdrop-blur-md z-30 lg:hidden"
          />
        )}

        <aside
          className={`fixed lg:sticky top-0 left-0 h-screen w-72 glass-card border-r border-electric-cyan/20 z-40 flex flex-col justify-between p-5 transition-transform duration-300 shrink-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-electric-cyan/20">
              <NavLink to="/" className="flex items-center gap-3.5 group">
                <div className="relative w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <svg className="w-full h-full drop-shadow-[0_0_12px_rgba(102,232,255,0.5)]" viewBox="0 0 100 100" fill="none">
                    <path d="M20 75L48 20L68 55L90 20V75L68 75L48 40L28 75H20Z" fill="url(#logoGrad1)" />
                    <path d="M48 20L68 55H90L68 20H48Z" fill="url(#logoGrad2)" />
                    <defs>
                      <linearGradient id="logoGrad1" x1="20" y1="20" x2="90" y2="75" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#1C73C9" />
                        <stop offset="1" stopColor="#66E8FF" />
                      </linearGradient>
                      <linearGradient id="logoGrad2" x1="48" y1="20" x2="90" y2="55" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#55E6F8" />
                        <stop offset="1" stopColor="#1D78D7" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-outfit font-black text-xl tracking-tight text-white leading-none">Novu</span>
                    <span className="font-outfit font-black text-xl tracking-tight text-electric-cyan leading-none">Labs</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-electric-sky uppercase mt-1">Ops Console</span>
                </div>
              </NavLink>
              <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl transition" aria-label="Close menu">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <nav className="space-y-1.5 flex-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `nav-pill flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition group ${
                      isActive ? "nav-pill-active" : "text-slate-300 hover:bg-navy-700/60 hover:text-electric-cyan"
                    }`
                  }
                >
                  <i className={`${item.icon} text-sm w-5 text-center transition-transform group-hover:scale-125 ${item.hover || ""}`}></i>
                  <span>{item.label}</span>
                  {item.badgeKey === "live" && (
                    <span className="ml-auto bg-emerald-500/15 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Live</span>
                  )}
                  {item.badgeKey === "tasks" && (
                    <span className="ml-auto bg-amber-500/15 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingTasksCount}</span>
                  )}
                </NavLink>
              ))}

              {(isFinance || isHR || isAdmin) && (
                <NavLink
                  to="/payroll"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `nav-pill flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition group ${
                      isActive ? "nav-pill-active" : "text-slate-300 hover:bg-navy-700/60 hover:text-electric-cyan"
                    }`
                  }
                >
                  <i className="fa-solid fa-money-check-dollar text-sm w-5 text-center transition-transform group-hover:scale-125"></i>
                  <span>Payroll</span>
                </NavLink>
              )}

              {(canSeeAllDepartments || isTeamLead) && (
                <NavLink
                  to="/employees"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `nav-pill flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition group ${
                      isActive ? "nav-pill-active" : "text-slate-300 hover:bg-navy-700/60 hover:text-electric-cyan"
                    }`
                  }
                >
                  <i className="fa-solid fa-users text-sm w-5 text-center transition-transform group-hover:scale-125"></i>
                  <span>Employees</span>
                </NavLink>
              )}
            </nav>
          </div>

          <div className="pt-4 border-t border-electric-cyan/20">
            <div className="p-3 rounded-2xl bg-navy-800/80 border border-electric-cyan/20 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-electric-azure to-electric-cyan text-navy-900 font-extrabold flex items-center justify-center text-sm shadow-md shrink-0">
                  {initial}
                </div>
                <div className="leading-tight min-w-0">
                  <span className="block text-xs font-extrabold text-white truncate">{user?.username}</span>
                  <span className="block text-[10px] font-bold text-electric-sky">{ROLE_LABELS[user?.role] || user?.role}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0" title="Logout">
                <i className="fa-solid fa-right-from-bracket text-xs"></i>
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col relative z-10 min-h-screen">
          <header className="sticky top-0 z-20 glass-card border-b border-electric-cyan/20 px-4 sm:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2.5 rounded-2xl bg-navy-800 border border-electric-cyan/30 text-electric-cyan hover:bg-electric-azure hover:text-white transition"
                aria-label="Open menu"
              >
                <i className="fa-solid fa-bars text-sm"></i>
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <span>{pageTitle}</span>
                </h1>
                <p className="text-[11px] text-electric-sky hidden sm:block">{dateText}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <button
                onClick={toggleTheme}
                className="px-3.5 py-2 rounded-2xl bg-navy-800/80 text-electric-cyan hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 border border-electric-cyan/30"
                aria-label="Toggle theme"
              >
                <i className={`fa-solid ${isDarkMode ? "fa-moon text-electric-cyan" : "fa-sun text-amber-500"} text-xs`}></i>
                <span className="text-xs font-bold hidden md:inline">{isDarkMode ? "Dark Theme" : "Light Theme"}</span>
              </button>

              <button
                onClick={() => showToast("No new notifications", "info")}
                className="anim-icon-wiggle p-2.5 rounded-2xl bg-navy-800/80 border border-electric-cyan/30 text-electric-cyan hover:text-white transition relative group"
              >
                <i className="fa-regular fa-bell text-sm"></i>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-electric-cyan rounded-full animate-ping"></span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>

          <footer className="mt-auto border-t border-electric-cyan/20 px-4 sm:px-8 py-5 text-xs text-electric-sky flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>© 2026 NovuLabs Software Solutions. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span className="text-electric-cyan font-bold">Ops Console v2.4</span>
              <span className="w-1.5 h-1.5 rounded-full bg-electric-azure"></span>
              <span>Enterprise Core</span>
            </div>
          </footer>
        </div>

        <div
          className={`fixed bottom-6 right-6 z-50 glass-card px-5 py-3.5 rounded-2xl shadow-2xl border border-electric-cyan/40 transition-all duration-300 flex items-center gap-3 max-w-sm ${
            toast.visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
          }`}
        >
          <i
            className={`fa-solid text-sm shrink-0 ${
              toast.type === "success"
                ? "fa-circle-check text-emerald-400"
                : toast.type === "error"
                ? "fa-circle-xmark text-rose-400"
                : "fa-circle-info text-electric-cyan"
            }`}
          ></i>
          <span className="text-xs font-extrabold text-white whitespace-nowrap">{toast.message}</span>
        </div>
      </div>
    </ShellToastContext.Provider>
  );
}
