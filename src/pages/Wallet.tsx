import { apiFetch } from "@/lib/apiFetch";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  useGetCurrencies,
  useGetBalance,
  useGetTicker,
  useGetDepositAddress,
  getGetBalanceQueryKey,
  type Currency,
} from "@/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCrypto, cn } from "@/lib/utils";
import { ArrowDownToLine, ArrowUpFromLine, Ticket, CheckCircle2, AlertCircle, Copy, Check, Loader2, RefreshCw, X, ClipboardPaste, Eye, EyeOff, Wallet2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuLabel, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useClipboard } from "@/hooks/useClipboard";

type GenerateResult = { generated: boolean; address: string } | null;

function InlineDepositPanel({ currency, onClose }: { currency: Currency; onClose: () => void }) {
  const { mutate, data: response, isPending, isError, reset } = useGetDepositAddress();
  const [copied, setCopied] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    reset();
    setGenerateResult(null);
    mutate({ data: { currencyId: currency.id } });
  }, [currency.id]);

  const displayAddress = generateResult?.address ?? response?.address ?? null;

  const copyAddress = () => {
    if (displayAddress) {
      navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateNew = async () => {
    setIsGenerating(true);
    setGenerateResult(null);
    try {
      const res = await apiFetch("/api/wallet/deposit-address/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currencyId: currency.id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed");
      setGenerateResult({ generated: json.generated as boolean, address: json.address as string });
    } catch {
      setGenerateResult(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const curName = currency.name.toUpperCase();

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="border-t border-primary/20 bg-primary/[0.02] px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">Deposit {curName}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground/40 hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {isPending ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border border-primary/30 border-t-primary" />
            <span className="text-xs text-muted-foreground">Fetching address…</span>
          </div>
        ) : isError || !displayAddress ? (
          <div className="flex items-center gap-2 py-3 text-danger text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Failed to retrieve deposit address.</span>
            <button onClick={() => mutate({ data: { currencyId: currency.id } })} className="text-primary hover:underline ml-1">Retry</button>
          </div>
        ) : (
          <div className="flex gap-4 items-start flex-wrap">
            <div className="w-24 h-24 bg-white p-1.5 rounded-lg flex items-center justify-center shadow-lg shrink-0">
              <QRCodeSVG value={displayAddress} size={84} bgColor="#ffffff" fgColor="#000000" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              {generateResult && (
                <div className={cn(
                  "flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded border w-fit",
                  generateResult.generated
                    ? "bg-success/8 border-success/20 text-success"
                    : "bg-primary/8 border-primary/15 text-primary"
                )}>
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  {generateResult.generated ? "New address generated" : "Permanent address"}
                </div>
              )}

              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">{curName} Address</p>
              <div className="bg-white/[0.03] p-2 rounded border border-primary/15 break-all font-mono text-[11px] text-primary font-bold leading-relaxed">
                {displayAddress}
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={copyAddress}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold transition-all",
                    copied ? "text-success bg-success/10" : "text-primary bg-primary/8 hover:bg-primary hover:text-background"
                  )}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy Address"}
                </button>
                <button
                  onClick={generateNew}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold text-muted-foreground bg-white/[0.04] hover:bg-white/[0.08] hover:text-foreground transition-all disabled:opacity-40"
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  {isGenerating ? "Generating…" : "New Address"}
                </button>
              </div>

              <div className="flex gap-4 text-[10px] text-muted-foreground/40 pt-1">
                <span>Min: <span className="text-foreground/50">{currency.depositMin} {curName}</span></span>
                <span>Fee: <span className="text-foreground/50">{currency.depositFee}</span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const withdrawSchema = z.object({
  address: z.string().min(10, "Enter a valid destination address"),
  amount: z.coerce.number().positive("Amount must be positive"),
  twoFaPin: z.string().optional(),
});
type WithdrawFormData = z.infer<typeof withdrawSchema>;

type WithdrawStatus = { paymentId: number; status: Record<string, unknown> | null; checking: boolean; error: string | null };

function InlineWithdrawPanel({ currency, balance, onClose }: { currency: Currency; balance: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState<WithdrawStatus | null>(null);
  const form = useForm<WithdrawFormData>({ resolver: zodResolver(withdrawSchema) });

  const curName = currency.name.toUpperCase();
  const watchedAmount = form.watch("amount");
  const watchedAddress = form.watch("address") ?? "";
  const fee = currency.withdrawFee ?? 0;
  const maxAmount = Math.max(0, balance - fee);
  const estimatedReceive = watchedAmount > 0 ? Math.max(0, watchedAmount - fee) : null;
  const addressIsValid = watchedAddress.length >= 10;
  const addressIsDirty = watchedAddress.length > 0;

  const pasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText();
      form.setValue("address", text.trim(), { shouldValidate: true });
    } catch {
      // clipboard access denied — user must paste manually
    }
  };

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawFormData & { cur: string }) => {
      const res = await apiFetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cur: data.cur, address: data.address, amount: data.amount, twoFaPin: data.twoFaPin }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Withdrawal failed");
      return json as { success: boolean; paymentId?: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
      setSubmitted({ paymentId: data.paymentId ?? 0, status: null, checking: false, error: null });
    },
  });

  const checkStatus = async () => {
    if (!submitted?.paymentId) return;
    setSubmitted((s) => s ? { ...s, checking: true, error: null } : s);
    try {
      const res = await apiFetch(`/api/wallet/withdraw/check?id=${submitted.paymentId}`);
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Status check failed");
      setSubmitted((s) => s ? { ...s, checking: false, status: json.result as Record<string, unknown> } : s);
    } catch (e) {
      setSubmitted((s) => s ? { ...s, checking: false, error: (e as Error).message } : s);
    }
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="border-t border-orange-500/20 bg-orange-500/[0.02] px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">Withdraw {curName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground/50">
              Available: <span className="font-mono font-semibold text-foreground/70">{formatCrypto(balance)} {curName}</span>
            </span>
            <button onClick={onClose} className="text-muted-foreground/40 hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-success font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              Withdrawal Submitted
            </div>
            {submitted.paymentId > 0 && (
              <p className="text-xs text-muted-foreground/50">
                Payment ID: <span className="font-mono font-bold text-foreground">#{submitted.paymentId}</span>
              </p>
            )}
            {submitted.status && (
              <div className="bg-white/[0.03] p-3 rounded border border-white/[0.06] space-y-1 text-xs">
                {Object.entries(submitted.status).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                    <span className="font-mono font-semibold text-foreground text-[11px]">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
            {submitted.error && (
              <div className="flex items-center gap-2 text-danger text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {submitted.error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={checkStatus}
                disabled={submitted.checking}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold text-primary bg-primary/8 hover:bg-primary hover:text-background transition-all disabled:opacity-40"
              >
                {submitted.checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Check Status
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold text-muted-foreground bg-white/[0.04] hover:bg-white/[0.08] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit((d) => withdrawMutation.mutate({ ...d, cur: currency.name }))}
            className="space-y-3"
          >
            {/* Address row */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold mb-1">Address</p>
              <div className="flex gap-1.5">
                <div className="flex-1 relative">
                  <Input
                    placeholder={`${curName} address…`}
                    className={cn(
                      "font-mono text-[11px] h-8 pr-6",
                      addressIsDirty && addressIsValid && "border-success/40 focus-visible:ring-success/20",
                      addressIsDirty && !addressIsValid && "border-danger/40 focus-visible:ring-danger/20",
                    )}
                    {...form.register("address")}
                  />
                  {addressIsDirty && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {addressIsValid
                        ? <Check className="w-3 h-3 text-success" />
                        : <AlertCircle className="w-3 h-3 text-danger/60" />
                      }
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={pasteAddress}
                  className="h-8 px-2.5 rounded border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 text-[10px] font-semibold shrink-0"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  Paste
                </button>
              </div>
              {form.formState.errors.address && (
                <p className="text-danger text-[10px] mt-0.5">{form.formState.errors.address.message}</p>
              )}
            </div>

            {/* Amount + 2FA + Submit row */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">
                    Amount
                    {currency.withdrawMin > 0 && (
                      <span className="text-muted-foreground/30 normal-case font-normal"> · min {currency.withdrawMin}</span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => form.setValue("amount", maxAmount, { shouldValidate: true })}
                    disabled={maxAmount <= 0}
                    className="text-[9px] font-bold uppercase tracking-wide text-orange-400/70 hover:text-orange-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    MAX
                  </button>
                </div>
                <Input placeholder="0.00" type="number" step="any" suffix={curName} className="h-8 text-[11px]" {...form.register("amount")} />
                {form.formState.errors.amount && (
                  <p className="text-danger text-[10px] mt-0.5">{form.formState.errors.amount.message}</p>
                )}
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold mb-1">2FA</p>
                <Input placeholder="PIN" type="password" maxLength={8} className="h-8 w-20 text-[11px]" {...form.register("twoFaPin")} />
              </div>
              <button
                type="submit"
                disabled={withdrawMutation.isPending}
                className="h-8 px-4 rounded border border-orange-500/30 bg-orange-500/8 text-orange-400 text-[11px] font-bold hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
              >
                {withdrawMutation.isPending ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Sending…</>
                ) : (
                  <><ArrowUpFromLine className="w-3 h-3" /> Withdraw</>
                )}
              </button>
            </div>

            {/* Fee + estimated receive */}
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground/40 pt-0.5">
              <span>Fee: <span className="text-foreground/50 font-mono">{fee} {curName}</span></span>
              {estimatedReceive !== null && (
                <span>
                  You receive: <span className={cn("font-mono font-semibold", estimatedReceive > 0 ? "text-success/80" : "text-danger/60")}>
                    {formatCrypto(estimatedReceive)} {curName}
                  </span>
                </span>
              )}
            </div>

            {withdrawMutation.error && (
              <div className="flex items-center gap-2 text-danger text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {withdrawMutation.error.message}
              </div>
            )}
          </form>
        )}
      </div>
    </motion.div>
  );
}

type ExpandedRow = { id: number; mode: "deposit" | "withdraw" } | null;

function AssetRow({
  currency,
  balance,
  reserve,
  expanded,
  onToggle,
  onClose,
}: {
  currency: Currency;
  balance: number;
  reserve: number;
  expanded: "deposit" | "withdraw" | null;
  onToggle: (mode: "deposit" | "withdraw") => void;
  onClose: () => void;
})
 {
  const { copy } = useClipboard();

  return (
    <ContextMenu>
      <div className={cn("border-b border-white/[0.02]", expanded && "border-b-0")}>
        <ContextMenuTrigger asChild>
          <div className={cn(
            "flex items-center h-11 hover:bg-white/[0.02] transition-colors group px-1",
            expanded === "deposit" && "bg-primary/[0.02]",
            expanded === "withdraw" && "bg-orange-500/[0.02]"
          )}>
            <div className="w-44 flex justify-start gap-1 shrink-0">
              <button
                onClick={() => onToggle("deposit")}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold transition-all",
                  expanded === "deposit"
                    ? "bg-primary text-background"
                    : "text-primary hover:bg-primary/10"
                )}
              >
                <ArrowDownToLine className="w-3 h-3" />
                Deposit
              </button>
              <button
                onClick={() => onToggle("withdraw")}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold transition-all",
                  expanded === "withdraw"
                    ? "bg-orange-500 text-white"
                    : "text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10"
                )}
              >
                <ArrowUpFromLine className="w-3 h-3" />
                Withdraw
              </button>
            </div>

            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                {currency.name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide">{currency.name}</p>
                <p className="text-[10px] text-muted-foreground/40">{currency.fullname}</p>
              </div>
            </div>

            <div className="w-28 text-right font-mono font-semibold text-foreground text-[11px] tabular-nums">
              {formatCrypto(balance)}
            </div>

            <div className="w-24 text-right font-mono text-[11px] text-muted-foreground/40 tabular-nums hidden sm:block">
              {formatCrypto(reserve)}
            </div>
          </div>
        </ContextMenuTrigger>

        <AnimatePresence>
          {expanded === "deposit" && (
            <InlineDepositPanel currency={currency} onClose={onClose} />
          )}
          {expanded === "withdraw" && (
            <InlineWithdrawPanel currency={currency} balance={balance} onClose={onClose} />
          )}
        </AnimatePresence>
      </div>
      <ContextMenuContent className="w-44">
        <ContextMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {currency.name.toUpperCase()}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onToggle("deposit")}>
          <ArrowDownToLine className="w-3.5 h-3.5 mr-2 text-success" /> Deposit
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onToggle("withdraw")}>
          <ArrowUpFromLine className="w-3.5 h-3.5 mr-2 text-danger" /> Withdraw
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => copy(String(balance), "Balance copied")}>
          <Copy className="w-3.5 h-3.5 mr-2" /> Copy balance
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function MobileAssetRow({
  currency,
  balance,
  reserve,
  expanded,
  onToggle,
  onClose,
}: {
  currency: Currency;
  balance: number;
  reserve: number;
  expanded: "deposit" | "withdraw" | null;
  onToggle: (mode: "deposit" | "withdraw") => void;
  onClose: () => void;
}) {
  return (
    <div className={cn("border-b border-white/[0.02]", expanded && "border-b-0")}>
      <div className={cn(
        "flex items-center gap-3 py-2.5",
        expanded === "deposit" && "bg-primary/[0.02]",
        expanded === "withdraw" && "bg-orange-500/[0.02]"
      )}>
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0">
          {currency.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs uppercase tracking-wide">{currency.name}</p>
          <p className="text-[11px] text-foreground/60 font-mono tabular-nums">{formatCrypto(balance)}</p>
          {reserve > 0 && (
            <p className="text-[10px] text-muted-foreground/40 font-mono tabular-nums">
              {formatCrypto(reserve)} in orders
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onToggle("deposit")}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded transition-colors",
              expanded === "deposit" ? "bg-primary text-background" : "text-primary hover:bg-primary/10"
            )}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggle("withdraw")}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded transition-colors",
              expanded === "withdraw" ? "bg-orange-500 text-white" : "text-muted-foreground hover:bg-white/[0.05]"
            )}
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded === "deposit" && (
          <InlineDepositPanel currency={currency} onClose={onClose} />
        )}
        {expanded === "withdraw" && (
          <InlineWithdrawPanel currency={currency} balance={balance + reserve} onClose={onClose} />
        )}
      </AnimatePresence>
    </div>
  );
}

const createVoucherSchema = z.object({
  currency: z.enum(["crp", "uusd"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  pin: z.string().optional(),
});
type CreateVoucherForm = z.infer<typeof createVoucherSchema>;

const activateVoucherSchema = z.object({
  currency: z.enum(["crp", "uusd"]),
  code: z.string().min(4, "Enter a valid voucher code"),
});
type ActivateVoucherForm = z.infer<typeof activateVoucherSchema>;

type VoucherSuccess = { type: "created" | "activated"; data: Record<string, unknown> };

function UVoucherPanel() {
  const [mode, setMode] = useState<"create" | "activate">("activate");
  const [success, setSuccess] = useState<VoucherSuccess | null>(null);
  const queryClient = useQueryClient();

  const createForm = useForm<CreateVoucherForm>({ resolver: zodResolver(createVoucherSchema), defaultValues: { currency: "crp" } });
  const activateForm = useForm<ActivateVoucherForm>({ resolver: zodResolver(activateVoucherSchema), defaultValues: { currency: "crp" } });

  const createMutation = useMutation({
    mutationFn: async (data: CreateVoucherForm) => {
      const res = await apiFetch("/api/wallet/voucher/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cur: data.currency, amount: data.amount, pin: data.pin }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to create voucher");
      return json;
    },
    onSuccess: (data) => {
      setSuccess({ type: "created", data: data.result });
      queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
      createForm.reset({ currency: "crp" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (data: ActivateVoucherForm) => {
      const res = await apiFetch("/api/wallet/voucher/activate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: data.code, cur: data.currency }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to activate voucher");
      return json;
    },
    onSuccess: (data) => {
      setSuccess({ type: "activated", data: data.result });
      queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
      activateForm.reset({ currency: "crp" });
    },
  });

  return (
    <Card className="border-white/[0.04]">
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2.5">
        <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Ticket className="w-3.5 h-3.5" />
        </div>
        <div>
          <h2 className="font-semibold text-xs">uVoucher</h2>
          <p className="text-[10px] text-muted-foreground/50">Redeem or create uVouchers for CRP &amp; UUSD</p>
        </div>
      </div>

      <div className="flex gap-5 px-4 border-b border-white/[0.04]">
        {(["activate", "create"] as const).map((m) => (
          <button
            key={m}
            className={cn(
              "py-2.5 text-[11px] font-semibold transition-colors border-b-2 -mb-px",
              mode === m ? "text-primary border-primary" : "text-muted-foreground/40 border-transparent hover:text-muted-foreground"
            )}
            onClick={() => { setMode(m); setSuccess(null); }}
          >
            {m === "activate" ? "Redeem Voucher" : "Create Voucher"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded border border-success/20 bg-success/5 p-3 space-y-2"
          >
            <div className="flex items-center gap-2 text-success font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {success.type === "created" ? "uVoucher Created!" : "uVoucher Redeemed!"}
            </div>
            {success.type === "created" && success.data.voucher && (
              <div>
                <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/40 mb-1">Voucher Code</p>
                <div className="font-mono bg-white/[0.03] p-2 rounded border border-white/[0.04] break-all text-foreground font-bold text-[11px]">
                  {String(success.data.voucher)}
                </div>
              </div>
            )}
            {success.type === "activated" && success.data.amount !== undefined && (
              <p className="text-xs text-muted-foreground">
                Credited: <strong className="text-foreground">{formatCrypto(Number(success.data.amount))} {String(success.data.currency || "").toUpperCase()}</strong>
              </p>
            )}
            <button
              className="text-[11px] text-primary hover:underline font-semibold"
              onClick={() => setSuccess(null)}
            >
              {success.type === "created" ? "Create another →" : "Redeem another →"}
            </button>
          </motion.div>
        )}

        {mode === "activate" && !success && (
          <form onSubmit={activateForm.handleSubmit((d) => activateMutation.mutate(d))} className="space-y-3">
            <p className="text-[11px] text-muted-foreground/50">Enter your voucher code to add funds instantly.</p>
            <div>
              <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/40 mb-1.5">Currency</p>
              <div className="flex gap-2">
                {(["crp", "uusd"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => activateForm.setValue("currency", c)}
                    className={cn(
                      "flex-1 py-2 rounded border font-bold uppercase text-xs transition-all",
                      activateForm.watch("currency") === c
                        ? "border-primary/30 bg-primary/8 text-primary"
                        : "border-white/[0.06] text-muted-foreground/40 hover:border-primary/20 hover:text-muted-foreground"
                    )}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/40 mb-1.5">Voucher Code</p>
              <Input
                placeholder={activateForm.watch("currency") === "crp" ? "UTP..." : "USD..."}
                className="font-mono text-xs"
                {...activateForm.register("code")}
              />
              {activateForm.formState.errors.code && (
                <p className="text-danger text-[11px] mt-1">{activateForm.formState.errors.code.message}</p>
              )}
            </div>
            {activateMutation.error && (
              <div className="flex items-start gap-2 text-danger text-xs bg-danger/5 border border-danger/20 rounded p-2.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{activateMutation.error.message}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={activateMutation.isPending}
              className="w-full h-8 rounded border border-primary/30 bg-primary/8 text-primary text-xs font-semibold hover:bg-primary hover:text-background transition-all disabled:opacity-50"
            >
              {activateMutation.isPending ? "Redeeming…" : `Redeem ${activateForm.watch("currency")?.toUpperCase()} uVoucher`}
            </button>
          </form>
        )}

        {mode === "create" && !success && (
          <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
            <p className="text-[11px] text-muted-foreground/50">Create a transferable uVoucher — no wallet needed.</p>
            <div>
              <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/40 mb-1.5">Currency</p>
              <div className="flex gap-2">
                {(["crp", "uusd"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => createForm.setValue("currency", c)}
                    className={cn(
                      "flex-1 py-2 rounded border font-bold uppercase text-xs transition-all",
                      createForm.watch("currency") === c
                        ? "border-primary/30 bg-primary/8 text-primary"
                        : "border-white/[0.06] text-muted-foreground/40 hover:border-primary/20 hover:text-muted-foreground"
                    )}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/40 mb-1.5">Amount</p>
              <Input
                placeholder="0.00"
                type="number"
                step="any"
                suffix={createForm.watch("currency")?.toUpperCase()}
                {...createForm.register("amount")}
              />
              {createForm.formState.errors.amount && (
                <p className="text-danger text-[11px] mt-1">{createForm.formState.errors.amount.message}</p>
              )}
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/40 mb-1.5">
                2FA PIN <span className="text-muted-foreground/30 font-normal normal-case">(if enabled)</span>
              </p>
              <Input placeholder="Optional" type="password" maxLength={8} {...createForm.register("pin")} />
            </div>
            {createMutation.error && (
              <div className="flex items-start gap-2 text-danger text-xs bg-danger/5 border border-danger/20 rounded p-2.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{createMutation.error.message}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full h-8 rounded border border-primary/30 bg-primary/8 text-primary text-xs font-semibold hover:bg-primary hover:text-background transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating…" : "Create uVoucher"}
            </button>
          </form>
        )}
      </div>
    </Card>
  );
}

export function Wallet() {
  const { data: currencies, isLoading: loadingCurrencies } = useGetCurrencies();
  const { data: balanceData, isLoading: loadingBalances } = useGetBalance();
  const { data: ticker } = useGetTicker();
  const [expandedRow, setExpandedRow] = useState<ExpandedRow>(null);
  const [hideZero, setHideZero] = useState(false);

  const balancesMap = new Map(balanceData?.balances.map((b) => [b.currency.id, b]));
  const isLoading = loadingCurrencies || loadingBalances;

  useEffect(() => {
    if (!currencies) return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get("deposit");
    if (!target) return;
    const match = currencies.find((c) => c.name.toLowerCase() === target.toLowerCase() && c.enable);
    if (match) {
      setExpandedRow({ id: match.id, mode: "deposit" });
      const url = new URL(window.location.href);
      url.searchParams.delete("deposit");
      window.history.replaceState({}, "", url.toString());
    }
  }, [currencies]);

  const handleToggle = (currencyId: number, mode: "deposit" | "withdraw") => {
    if (expandedRow?.id === currencyId && expandedRow.mode === mode) {
      setExpandedRow(null);
    } else {
      setExpandedRow({ id: currencyId, mode });
    }
  };

  const enabledCurrencies = currencies?.filter((c) => c.enable) ?? [];

  // Build price map: currency name (lowercase) → UUSD price
  const priceMap = new Map<string, number>();
  priceMap.set("uusd", 1);
  if (ticker) {
    for (const t of ticker) {
      if (t.ecur === "uusd" && t.enable) priceMap.set(t.cur, t.lastPrice);
      else if (t.cur === "uusd" && t.enable && t.lastPrice > 0) priceMap.set(t.ecur, 1 / t.lastPrice);
    }
  }

  // Compute total portfolio UUSD value
  let totalUusd = 0;
  let assetsWithBalance = 0;
  for (const c of enabledCurrencies) {
    const bal = balancesMap.get(c.id);
    const balance = bal?.balance ?? 0;
    if (balance > 0) {
      assetsWithBalance++;
      const price = priceMap.get(c.name.toLowerCase());
      if (price !== undefined) totalUusd += balance * price;
    }
  }

  const displayedCurrencies = hideZero
    ? enabledCurrencies.filter((c) => (balancesMap.get(c.id)?.balance ?? 0) > 0)
    : enabledCurrencies;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Wallet</h1>
          <p className="text-muted-foreground text-[11px] mt-0.5">Manage assets and transfers</p>
        </div>
        {!isLoading && totalUusd > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold mb-0.5">Total Value</p>
            <p className="font-bold text-lg font-mono tabular-nums text-foreground">
              {totalUusd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] text-muted-foreground/50 font-sans font-normal ml-1">UUSD</span>
            </p>
            <p className="text-[10px] text-muted-foreground/40">{assetsWithBalance} asset{assetsWithBalance !== 1 ? "s" : ""} with balance</p>
          </div>
        )}
      </div>

      {/* Desktop asset table */}
      <div className="hidden md:block">
        <div className="flex items-center px-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 font-semibold border-b border-white/[0.04] pb-2">
          <div className="w-44 shrink-0">Actions</div>
          <div className="flex-1">Asset</div>
          <div className="w-28 text-right">Available</div>
          <div className="w-24 text-right hidden sm:block">In Orders</div>
          <button
            onClick={() => setHideZero((v) => !v)}
            className="ml-3 flex items-center gap-1 text-[9px] font-semibold text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
          >
            {hideZero ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {hideZero ? "Show all" : "Hide zero"}
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-xs">Loading wallet data…</div>
        ) : displayedCurrencies.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-xs">No assets with balance.</div>
        ) : (
          displayedCurrencies.map((c) => {
            const bal = balancesMap.get(c.id);
            const isExpanded = expandedRow?.id === c.id ? expandedRow.mode : null;
            return (
              <AssetRow
                key={c.id}
                currency={c}
                balance={(bal?.balance ?? 0) - (bal?.reserve ?? 0)}
                reserve={bal?.reserve || 0}
                expanded={isExpanded}
                onToggle={(mode) => handleToggle(c.id, mode)}
                onClose={() => setExpandedRow(null)}
              />
            );
          })
        )}
      </div>

      {/* Mobile asset list */}
      <div className="md:hidden">
        <div className="pb-2 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">Assets</span>
          <button
            onClick={() => setHideZero((v) => !v)}
            className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            {hideZero ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {hideZero ? "Show all" : "Hide zero"}
          </button>
        </div>
        {isLoading ? (
          <p className="py-6 text-center text-muted-foreground text-xs">Loading…</p>
        ) : displayedCurrencies.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-xs">No assets with balance.</p>
        ) : (
          displayedCurrencies.map((c) => {
            const bal = balancesMap.get(c.id);
            const isExpanded = expandedRow?.id === c.id ? expandedRow.mode : null;
            return (
              <MobileAssetRow
                key={c.id}
                currency={c}
                balance={(bal?.balance ?? 0) - (bal?.reserve ?? 0)}
                reserve={bal?.reserve || 0}
                expanded={isExpanded}
                onToggle={(mode) => handleToggle(c.id, mode)}
                onClose={() => setExpandedRow(null)}
              />
            );
          })
        )}
      </div>

      <UVoucherPanel />
    </motion.div>
  );
}
