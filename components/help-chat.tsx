"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { MessageCircle, Send, Sprout, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating help assistant, fixed to the bottom-right of the shop.
 * It answers the most common questions (orders, returns, delivery,
 * care, payments) with canned replies and quick links; anything else
 * points the customer to the contact page.
 */

interface ChatLink {
  href: string;
  label: string;
}

interface ChatMessage {
  id: number;
  from: "bot" | "user";
  text: string;
  links?: ChatLink[];
  suggestions?: string[];
}

const initialSuggestions = [
  "Track my order",
  "Return a plant",
  "Delivery info",
  "Plant care help",
  "Talk to a human",
];

function findAnswer(input: string, firstName: string): Omit<ChatMessage, "id" | "from"> {
  const query = input.toLowerCase();

  if (/(hi|hello|hey|hola)/.test(query)) {
    return {
      text: `Hello again, ${firstName}! 🌱 How can I help you today? Pick a topic below or type your question.`,
      suggestions: initialSuggestions,
    };
  }

  if (/(track|where.*(order|parcel)|order status|status)/.test(query)) {
    return {
      text: "You can follow every order from your account. Open My Orders, pick the order and tap Track — you'll see the live status from confirmed to delivered.",
      links: [
        { href: "/account/orders", label: "Open My Orders" },
        { href: "/policies/shipping", label: "Shipping policy" },
      ],
    };
  }

  if (/(return|refund|damag|broken|replace)/.test(query)) {
    return {
      text: "If a plant arrived damaged, write in as soon as you unbox it (with a photo of the plant and packaging) so we can help inside the claim window. Returns are reviewed by our team and handled with a replacement or refund.",
      links: [
        { href: "/policies/returns", label: "Returns policy" },
        { href: "/contact", label: "Report a problem" },
      ],
    };
  }

  if (/(deliver|shipping|ship|pincode|charge|dispatch)/.test(query)) {
    return {
      text: "We deliver to valid Indian pincodes. Orders are packed within 24–48 hours, the delivery charge and free-shipping threshold are shown at checkout, and estimates appear on each product page.",
      links: [
        { href: "/policies/shipping", label: "Full shipping policy" },
        { href: "/shop", label: "Start shopping" },
      ],
    };
  }

  if (/(care|water|light|repot|fertilis|fertiliz|yellow|leaves)/.test(query)) {
    return {
      text: "Every product page has a care guide covering light, water and difficulty level. For a specific worry — droopy leaves, repotting, pests — our plant doctors will help within a day.",
      links: [
        { href: "/shop", label: "Browse plant care guides" },
        { href: "/contact", label: "Ask a plant expert" },
      ],
    };
  }

  if (/(pay|payment|cod|upi|card|cashfree|wallet|refund money)/.test(query)) {
    return {
      text: "Online payments (UPI, cards, netbanking and wallets) run through Cashfree — secure and encoded on their servers. Cash on delivery is also available where enabled. Nothing is charged until the payment completes or the delivery happens.",
      links: [{ href: "/policies/shipping", label: "Payment & delivery details" }],
    };
  }

  if (/(cancel)/.test(query)) {
    return {
      text: "Orders can be cancelled while they're still in processing or packed status — open the order in My Orders and use Cancel order. After dispatch we can't intercept the parcel, but returns are always available.",
      links: [{ href: "/account/orders", label: "Open My Orders" }],
    };
  }

  if (/(human|agent|person|contact|phone|email|support|complain)/.test(query)) {
    return {
      text: "Of course — one small team reads every message. Write to us through the contact page or email us and you'll hear back within one working day.",
      links: [{ href: "/contact", label: "Contact the team" }],
    };
  }

  if (/(coupon|discount|offer|promo|free ship)/.test(query)) {
    return {
      text: "Coupons and offers are shown in the shop — the discount applies automatically or via code at checkout. Free shipping unlocks above the threshold shown on the bag page.",
      links: [{ href: "/shop", label: "See current offers" }],
    };
  }

  return {
    text: "I'm still a little green on that one 🌱 You can ask me about orders, returns, delivery, plant care or payments — or the team will happily help directly.",
    links: [{ href: "/contact", label: "Talk to a human" }],
    suggestions: initialSuggestions,
  };
}

export function HelpChat({ firstName = "there" }: { firstName?: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      from: "bot",
      text: `Hi ${firstName}! 🌿 I'm Leafy, the Leaf & Pot helper. What can I do for you?`,
      suggestions: initialSuggestions,
    },
  ]);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const respond = (userText: string) => {
    const answer = findAnswer(userText, firstName);
    setBusy(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { id: nextId.current++, from: "bot", ...answer }]);
      setBusy(false);
    }, 450);
  };

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setMessages((current) => [...current, { id: nextId.current++, from: "user", text }]);
    setInput("");
    respond(text);
  };

  const quickAsk = (topic: string) => {
    if (busy) return;
    setMessages((current) => [...current, { id: nextId.current++, from: "user", text: topic }]);
    respond(topic);
  };

  return (
    <div className="fixed right-4 bottom-32 z-40 lg:right-6 lg:bottom-6" data-help-chat>
      {open && (
        <div className="mb-3 flex h-[min(66vh,500px)] w-[min(92vw,360px)] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-lift">
          {/* Header */}
          <div className="flex items-center gap-3 bg-leaf-deep px-4 py-3.5 text-white">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">
              <Sprout className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold">Leafy — Help desk</p>
              <p className="flex items-center gap-1.5 text-[10.5px] text-white/75">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden /> Online · answers instantly
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close help chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.from === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed",
                    message.from === "user"
                      ? "rounded-br-sm bg-forest-800 text-white"
                      : "rounded-bl-sm border border-leaf-sage/60 bg-leaf-mint text-forest-900",
                  )}
                >
                  <p>{message.text}</p>
                  {message.links && message.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.links.map((link) => (
                        <Link
                          key={link.href + link.label}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-forest-700 shadow-sm ring-1 ring-leaf-sage/60 transition hover:bg-forest-800 hover:text-white"
                        >
                          {link.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => quickAsk(suggestion)}
                          className="rounded-full border border-forest-300/70 bg-white px-2.5 py-1 text-[10.5px] font-semibold text-forest-700 transition hover:bg-forest-800 hover:text-white"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-leaf-sage/60 bg-leaf-mint px-3.5 py-3">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-forest-400"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={send} className="flex items-center gap-2 border-t border-line bg-leaf-cream px-3 py-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your question…"
              aria-label="Ask the help assistant"
              className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-white px-3.5 text-[12.5px] outline-none transition placeholder:text-muted/70 focus:border-forest-400 focus:ring-4 focus:ring-forest-100"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest-800 text-white transition hover:bg-forest-900 disabled:pointer-events-none disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Close help chat" : "Open help chat"}
        className="relative grid h-14 w-14 place-items-center rounded-full bg-leaf-deep text-white shadow-lift ring-2 ring-white transition duration-200 hover:scale-105 hover:bg-forest-900"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-amber text-[8px] font-bold text-forest-950" aria-hidden>
            ?
          </span>
        )}
      </button>
    </div>
  );
}
