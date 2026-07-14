export const metadata = {
  title: "Sign In",
};

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-dvh flex" style={{ background: "var(--color-bg)" }}>
      {/* Left: Brand panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col relative overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #3B1A06 0%, #1C0A00 40%, #0D0400 100%)",
          }}
        />
        {/* Amber glow orb */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(212,133,10,0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        {/* Beer foam drip at top */}
        <div
          className="absolute top-0 inset-x-0 h-1 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, #D4850A 40%, #F5C842 60%, #D4850A 80%, transparent)",
            boxShadow: "0 0 20px rgba(212,133,10,0.6)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{
                background: "linear-gradient(135deg, #D4850A, #6B3318)",
                boxShadow: "0 4px 16px rgba(212,133,10,0.3)",
              }}
            >
              🍺
            </div>
            <span
              className="text-xl font-display font-bold"
              style={{ color: "#F9EDD8" }}
            >
              SmartMenu AI
            </span>
          </div>

          {/* Main copy */}
          <div className="flex-1 flex flex-col justify-center max-w-sm">
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ color: "#D4850A" }}
            >
              Premium Hospitality Platform
            </p>
            <h2
              className="text-4xl xl:text-5xl font-display font-bold leading-tight mb-6"
              style={{ color: "#F9EDD8" }}
            >
              The smarter way to run your restaurant
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "#8B6038" }}>
              QR menus, live orders, waiter calls, and staff management — all
              beautifully unified for your team and your guests.
            </p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3">
              {[
                "Digital menus with QR codes per table",
                "Real-time orders and waiter alerts",
                "Multi-branch staff management",
                "Revenue reports and insights",
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{
                      background: "rgba(212,133,10,0.2)",
                      color: "#D4850A",
                      border: "1px solid rgba(212,133,10,0.3)",
                    }}
                  >
                    ✓
                  </span>
                  <span className="text-sm" style={{ color: "#D4A872" }}>
                    {feat}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom tagline */}
          <p className="text-xs" style={{ color: "#5F3E22" }}>
            © {new Date().getFullYear()} SmartMenu AI · Built for hospitality
          </p>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #D4850A, #6B3318)",
              boxShadow: "0 4px 16px rgba(212,133,10,0.3)",
            }}
          >
            🍺
          </div>
          <span
            className="text-lg font-display font-bold"
            style={{ color: "#F9EDD8" }}
          >
            SmartMenu AI
          </span>
        </div>

        {/* Subtle top gradient line */}
        <div
          className="lg:hidden absolute top-0 inset-x-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(212,133,10,0.3), transparent)",
          }}
        />

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
