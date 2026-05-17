import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useLogin, getGetMeQueryKey } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Lock, Shield, ExternalLink, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  publicKey: z.string().min(1, "Public key is required"),
  password: z.string().min(1, "Password is required"),
  twoFaPin: z.string().optional(),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const UTOPIA_DOWNLOADS = [
  { platform: "Windows",    icon: "🪟", url: "https://update.u.is/downloads/windows/latest/UtopiaX64.exe",                  label: "Windows" },
  { platform: "macOS",      icon: "🍎", url: "https://update.u.is/downloads/macos/utopia-latest.dmg",                       label: "macOS" },
  { platform: "Linux",      icon: "🐧", url: "https://update.u.is/downloads/linux/utopia-latest.amd64.deb",                 label: "Linux (.deb)" },
  { platform: "Android",    icon: "▶",  url: "https://play.google.com/store/apps/details?id=is.u.utopia",                   label: "Google Play" },
  { platform: "Android APK",icon: "📦", url: "https://update.u.is/downloads/mobile/android/utopia-arm64_v8a.apk",           label: "Android APK" },
  { platform: "iOS",        icon: "📱", url: "https://apps.apple.com/us/app/utopia-mobile/id6737908646",                    label: "App Store" },
];

function SignUpPanel() {
  return (
    <motion.div
      key="signup"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">How to get started</p>
        {[
          { n: "1", title: "Download Utopia", desc: "Install the Utopia P2P app on your device." },
          { n: "2", title: "Get your Public Key", desc: "Open Utopia, create an account, copy your Public Key." },
          { n: "3", title: "Register on CRP.IS", desc: "Go to crp.is and create a trading account with your key." },
          { n: "4", title: "Sign in here", desc: "Return to this page and sign in with your credentials." },
        ].map((step) => (
          <div key={step.n} className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {step.n}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{step.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
          <Download className="w-3 h-3" /> Download Utopia
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {UTOPIA_DOWNLOADS.map((d) => (
            <a
              key={d.platform}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/20 transition-all text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <span className="text-xs">{d.icon}</span>
              {d.label}
            </a>
          ))}
        </div>
      </div>

      <a href="https://crp.is" target="_blank" rel="noopener noreferrer" className="w-full block">
        <button className="w-full flex items-center justify-center gap-1.5 h-8 rounded border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/8 transition-colors">
          Register on CRP.IS
          <ExternalLink className="w-3 h-3" />
        </button>
      </a>

      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
        GHOSTD is an independent interface built on{" "}
        <a href="https://crp.is" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary">CRP Exchange</a>.
      </p>
    </motion.div>
  );
}

export function Login() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data: { ...data, twoFaPin: data.twoFaPin || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/dashboard");
        }
      }
    );
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* ── Left editorial panel ── */}
      <div className="hidden lg:flex flex-col justify-between bg-[#070709] border-r border-white/[0.04] p-14 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-primary/3 blur-[80px]" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-12">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-[11px] font-semibold tracking-widest uppercase">Live Markets</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl font-bold text-white leading-[1.05] tracking-tight">
              Trade.<br />
              <span className="text-primary">Precisely.</span>
            </h1>
            <p className="mt-6 text-base text-white/40 max-w-sm leading-relaxed font-normal">
              A precision-built interface for Crypton markets — real-time order book, chart depth, and instant execution.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            { label: "Decentralized Identity", sub: "Powered by Utopia P2P" },
            { label: "Real-time Order Book", sub: "5s refresh, full depth" },
            { label: "Non-custodial Trading", sub: "Your keys, your funds" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-primary/60" />
              <div>
                <span className="text-xs font-semibold text-white/70">{item.label}</span>
                <span className="text-[10px] text-white/30 ml-2">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right sign-in panel ── */}
      <div className="flex flex-col justify-center px-8 py-12 md:px-16 lg:px-20 overflow-y-auto">
        <div className="w-full max-w-xs mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <h2 className="text-2xl font-bold tracking-widest uppercase text-foreground">
              Ghost<span className="text-primary">D</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Trade. Precisely.</p>
          </div>

          {/* Tab switcher — underline style */}
          <div className="flex gap-5 border-b border-white/[0.06] mb-8">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "pb-2.5 text-xs font-semibold transition-all border-b-2 -mb-px",
                  tab === t
                    ? "text-foreground border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground/70"
                )}
              >
                {t === "signin" ? "Sign In" : "Get Started"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "signin" ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground">Welcome back</h2>
                  <p className="text-muted-foreground text-xs mt-0.5">Access your trading account.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1">
                    <Input
                      {...register("publicKey")}
                      ghost
                      autoComplete="username"
                      icon={<KeyRound className="w-3.5 h-3.5" />}
                      placeholder="Utopia Public Key"
                    />
                    {errors.publicKey && <p className="text-danger text-[11px] font-medium">{errors.publicKey.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Input
                      {...register("password")}
                      ghost
                      type="password"
                      autoComplete="current-password"
                      icon={<Lock className="w-3.5 h-3.5" />}
                      placeholder="Password"
                    />
                    {errors.password && <p className="text-danger text-[11px] font-medium">{errors.password.message}</p>}
                  </div>

                  <div>
                    <Input
                      {...register("twoFaPin")}
                      ghost
                      autoComplete="one-time-code"
                      icon={<Shield className="w-3.5 h-3.5" />}
                      placeholder="2FA PIN (optional)"
                    />
                  </div>

                  {loginMutation.isError && (
                    <div className="py-2 text-danger text-xs text-center border border-danger/20 rounded bg-danger/5">
                      {loginMutation.error?.error || "Login failed. Check your credentials."}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full mt-2 h-8 rounded-sm border-b border-primary/50 bg-transparent text-primary text-xs font-semibold hover:bg-primary/8 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 tracking-wide uppercase"
                  >
                    {loginMutation.isPending ? (
                      <div className="w-4 h-4 border border-primary/40 border-t-primary rounded-full animate-spin" />
                    ) : "Authenticate Session"}
                  </button>
                </form>

                <p className="text-center text-[11px] text-muted-foreground">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("signup")}
                    className="text-primary hover:underline font-semibold"
                  >
                    Get started →
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="signup-wrapper"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground">Create Account</h2>
                  <p className="text-muted-foreground text-xs mt-0.5">Start trading in minutes.</p>
                </div>
                <SignUpPanel />
                <p className="text-center text-[11px] text-muted-foreground mt-5">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("signin")}
                    className="text-primary hover:underline font-semibold"
                  >
                    Sign in →
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              <span className="block mb-2 font-mono text-muted-foreground/50">
                  build {(import.meta.env.VITE_BUILD_SHA ?? "dev").slice(0, 7)}
                  {import.meta.env.VITE_BUILD_TIME ? ` · ${import.meta.env.VITE_BUILD_TIME.replace("T", " ").replace("Z", " UTC")}` : ""}
                </span>
                GHOSTD is an interface for{" "}
              <a href="https://crp.is" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary hover:underline">CRP.is</a>.
              For account or transaction issues, contact{" "}
              <a href="https://crp.is/profile/support" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary hover:underline">CRP.is Support ↗</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
