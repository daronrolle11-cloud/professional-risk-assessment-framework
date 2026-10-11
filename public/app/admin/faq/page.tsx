"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronDown, Download, MapPin, Printer, Search, ShieldCheck, Smartphone,
  Wifi, WifiOff, AlertTriangle, Battery, Camera, Clock, HelpCircle, RefreshCcw, CheckCircle2,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { getLocalSession as getStaffSession } from "@/lib/session-store";
import { getSession as getContractorSession } from "@/lib/portal-client";

interface FAQ {
  q: string;
  a: string;
  tag: string;
}

const TAGS = ["All", "App & Login", "Offline / Connectivity", "Photos & Evidence", "Checklist & Submission", "Re-Inspection", "Payments & Fees", "Safety & Professionalism"];

const FAQS: FAQ[] = [
  // ── App & Login ──────────────────────────────────────────────────────────
  { tag: "App & Login", q: "I forgot my access code. What do I do?", a: "Contact your BCSO coordinator immediately. Do not attempt to log in with someone else's code. Your coordinator will revoke the old code and issue a new credential card with a fresh access code within one business day." },
  { tag: "App & Login", q: "I entered my code but the dashboard shows nothing — just a spinner.", a: "This usually means your internet connection is too weak to fetch assignments. Try: (1) Move to a window or go outside for better signal. (2) Switch from cellular data to Wi-Fi if a network is available. (3) Close and reopen the browser. (4) On very old phones, try clearing your browser cache: Settings → Browser → Clear data." },
  { tag: "App & Login", q: "The sign-in page won't open at all on my phone.", a: "Make sure you are opening the correct BCSO portal URL (not the admin dashboard). Try opening the URL in a fresh private/incognito browser window. If you are using a Family Island cellular connection, data may be throttled — connect to the property's Wi-Fi if available." },
  { tag: "App & Login", q: "My access code worked before but now says 'not recognised'.", a: "Your coordinator may have regenerated your code as a security rotation. Check for any recent message or email from BCSO with your new code. If you received no message, call your coordinator — your account may have been temporarily deactivated pending a compliance review." },
  { tag: "App & Login", q: "Can I log in on two phones at the same time?", a: "No. BCSO uses single-session access codes. Logging in on a second device will automatically sign you out of the first. Never share your code — each login is logged with a timestamp and IP address." },

  // ── Offline / Connectivity ────────────────────────────────────────────────
  { tag: "Offline / Connectivity", q: "I am on Exuma / Andros / Cat Island and have almost no cellular signal. Can I still complete an inspection?", a: "Yes. The BCSO portal saves your answers locally in your browser as you go — you do not need a live internet connection to mark items PASS/FAIL or to type finding notes. However, you must be online to (1) load the checklist initially and (2) upload photos. For remote Family Island properties: load the checklist before you leave the ferry dock or airport where you have signal. Complete the checklist offline. Drive to the nearest Wi-Fi hotspot (a hotel, marina, or government office) to upload your photos and submit." },
  { tag: "Offline / Connectivity", q: "I tried to upload a photo but it failed. Have I lost it?", a: "No — photos you take are stored locally on your device until uploaded. As long as you have not cleared your browser data, they are safe. Reconnect to a stable network and the upload will resume automatically. If the upload still fails, go back to that inspection, click the camera icon again, and select the photo from your phone's gallery rather than taking a new one." },
  { tag: "Offline / Connectivity", q: "How large can the photos be? My uploads keep timing out on a slow connection.", a: "The BCSO app automatically compresses photos to a maximum of 1,280 × 960 pixels before uploading — you do not need to manually resize them. If uploads are still timing out on an extremely slow connection (common on some remote islands), try uploading one photo at a time rather than all at once. Move to the strongest signal spot available — standing near the exterior of a building often improves cellular reception." },
  { tag: "Offline / Connectivity", q: "The property has no cellular signal whatsoever and no Wi-Fi. What do I do?", a: "Create a mobile hotspot from a second phone (or a colleague's phone) that has better signal. In areas with no signal at all, record your findings on the BCSO paper backup sheet (available from Nassau administration), take photos with your camera, and contact your coordinator the same day. Do not submit a blank or partially completed digital report — call your coordinator to arrange a manual data entry session." },
  { tag: "Offline / Connectivity", q: "My phone battery died mid-inspection. Do I lose my work?", a: "Your marked items are saved in the browser's local storage after each tap. When you reopen the browser and navigate back to the inspection, your progress should be restored automatically. If you see a blank checklist, your browser may have cleared its data — contact your coordinator immediately with your paper backup notes." },

  // ── Photos & Evidence ──────────────────────────────────────────────────────
  { tag: "Photos & Evidence", q: "Why won't the app let me submit without a photo on every FAIL item?", a: "This is a core BCSO policy requirement and cannot be bypassed. The photo-for-every-FAIL rule is essential because: (1) It provides legal, time-stamped evidence that protects both you and BCSO if a property owner disputes your findings. (2) It ensures that insurance adjusters and property managers can see the exact deficiency. (3) It proves you were physically on-site. Never attempt to submit without evidence photos — your coordinator will return the report and you will need to revisit." },
  { tag: "Photos & Evidence", q: "What makes a good evidence photo?", a: "A good evidence photo should: (1) Be close enough that the specific deficiency is clearly visible. (2) Include some surrounding context so the location within the property is identifiable. (3) Be in focus — shake the camera slightly and retake if blurry. (4) Have adequate lighting — use your phone's torch/flashlight for dark electrical panels or crawlspaces. (5) For electrical panels, capture both the panel overview AND the specific fault. For HVAC issues, capture the unit, the specific problem area, and any visible water damage or mould. For gas lines, capture the full line run plus the specific concern." },
  { tag: "Photos & Evidence", q: "My GPS coordinates are showing as 'No GPS fix' on photos. Is this a problem?", a: "A missing GPS fix is not ideal but is acceptable in locations with no cellular signal (GPS often relies on cellular assistance). The photo timestamp is still recorded and is sufficient evidence. To improve GPS accuracy: enable Location Services on your phone before leaving for the property, and allow 1–2 minutes after arriving for the GPS to lock on to satellite signals." },
  { tag: "Photos & Evidence", q: "How many photos can I upload per failing item?", a: "Up to 4 photos per checklist item. Take multiple angles — an overview shot and a close-up of the specific fault. If you have more than 4 critical photos, combine multiple issues into one photo or mention additional images are available in your written finding note." },

  // ── Checklist & Submission ────────────────────────────────────────────────
  { tag: "Checklist & Submission", q: "I marked an item PASS by mistake. Can I change it?", a: "Yes — simply tap FAIL or N/A over the incorrect selection before you submit. Once you tap Submit, the report is locked. If you have already submitted with an error, do not submit again — call your coordinator immediately so they can return the report for correction." },
  { tag: "Checklist & Submission", q: "What does N/A mean and when should I use it?", a: "N/A (Not Applicable) should be used only when a checklist item genuinely does not apply to the specific property — for example, 'standby generator checks' at a property that has no generator, or 'pool barrier inspection' at a property with no swimming pool. Never use N/A to skip an item you cannot access — mark it FAIL with a note explaining the access issue and contact your coordinator." },
  { tag: "Checklist & Submission", q: "The Submit button is greyed out even though I answered everything.", a: "This most likely means one or more FAIL items are missing their required photo evidence. Scroll back through the checklist — any FAIL item with a red 'Photo required' badge must have a photo before submission is enabled. If all FAIL items have photos and the button is still greyed out, force-refresh the page and check again." },
  { tag: "Checklist & Submission", q: "I submitted but now I see a mistake in my notes. Can I edit after submission?", a: "No — submissions are locked to preserve evidence integrity. Contact your coordinator at once. If the error is minor, the coordinator may add an internal note. If it materially affects compliance findings, they will return the report for correction and you will need to resubmit." },

  // ── Re-Inspection ─────────────────────────────────────────────────────────
  { tag: "Re-Inspection", q: "What is a re-inspection and how is it different from the original audit?", a: "A re-inspection is a targeted follow-up visit to verify that specific items that FAILED the original audit have now been corrected. You only inspect the items that previously failed — you do not re-audit the entire property. When you are dispatched for a re-inspection, your checklist will contain only those failing items. Each one needs a new PASS photo showing the repair." },
  { tag: "Re-Inspection", q: "A property owner asked me to check some additional areas during the re-inspection. Can I?", a: "No. During a re-inspection your scope is strictly limited to the items that originally failed. If you observe new safety issues while on-site, record them in your notes to your coordinator — but do not add them to the re-inspection report. A new inspection will need to be scheduled for any newly identified issues." },
  { tag: "Re-Inspection", q: "The item that originally failed has been repaired by the time I arrive. How do I document it?", a: "Photograph the repaired element clearly — the photo should show the completed, functional, compliant state. Add a brief note describing what was repaired, by whom (if you know), and the date. Mark the item PASS and proceed. A clear 'after' photo alongside your coordinator's 'before' photo from the original report creates the complete evidence chain needed to issue the Compliance Certificate." },

  // ── Payments & Fees ───────────────────────────────────────────────────────
  { tag: "Payments & Fees", q: "When do I get paid for completed inspections?", a: "Subcontractor payouts are processed within 48 hours of the report being finalized and approved by the BCSO coordinator. Payments are made by bank wire/ACH to the Bahamian bank account you registered in your contractor onboarding file. If you have not received payment within 48 hours of approval, contact Nassau administration with your contractor name and inspection code." },
  { tag: "Payments & Fees", q: "Is the re-inspection fee ($250 BSD) my fee or BCSO's fee?", a: "The $250 BSD re-inspection fee is charged by BCSO to the client — it covers your travel time and the dashboard processing overhead. Your subcontractor payout for a re-inspection visit is specified in your MSA rate card and is separate from the client-facing fee. You are paid the same subcontractor rate regardless of whether the client is charged the fee or receives a free certificate." },
  { tag: "Payments & Fees", q: "The client wants to pay me directly on-site. What do I say?", a: "Politely decline and explain that all payments are processed through BCSO Nassau administration only. Say: 'Thank you, but all billing goes through our central office in Nassau. They will send your invoice and payment details directly.' Do not accept cash, checks, or transfers from property owners. Any direct payment accepted outside BCSO's system is a serious violation of your MSA and may result in contract termination." },

  // ── Safety & Professionalism ──────────────────────────────────────────────
  { tag: "Safety & Professionalism", q: "The property owner is pressuring me to do the repairs myself during the audit. What do I say?", a: "Use the BCSO Non-Circumvention Script: 'I am here representing BCSO to conduct an independent, unbiased compliance check. BCSO will send you a separate, competitive remediation quote within 24 hours of your report delivery, and we can handle all your repairs immediately after.' Do not perform any repairs during an audit — it compromises your independence, voids the audit, and may create legal liability. Report any pressure to your coordinator the same day." },
  { tag: "Safety & Professionalism", q: "A client's employee is following me around and asking me to skip certain areas. What do I do?", a: "Inspect all areas covered by your checklist regardless of requests to skip. Politely but firmly say: 'I am required to inspect all areas on the checklist as part of the BCSO standard audit protocol.' If access is physically prevented, mark the item FAIL with a note explaining 'Access refused by property representative' and photograph the blocked area if possible. Report the incident to your coordinator immediately after leaving the property." },
  { tag: "Safety & Professionalism", q: "What PPE must I wear for a standard property audit?", a: "Minimum requirements for all BCSO field visits: (1) BCSO digital ID badge displayed visibly. (2) Steel-toed safety boots — mandatory for commercial and construction sites; strongly recommended for all sites. (3) High-visibility vest — mandatory for any commercial, industrial or active construction site. (4) Insulated rubber gloves — mandatory when near electrical panels or any exposed wiring. Additional PPE requirements may apply based on specific hazards identified before entry — review the property briefing notes from your coordinator before each visit." },
  { tag: "Safety & Professionalism", q: "I feel unsafe at a property — what do I do?", a: "Leave immediately if you feel physically threatened. Your safety is the first priority above any audit completion requirement. Once you are in a safe location, call your coordinator. Document everything — time, what happened, who was present. BCSO will reschedule the inspection with appropriate safeguards in place, which may include a two-person team or a security escort. Never enter any confined space, elevated area, or hazardous area without the appropriate safety measures in place regardless of pressure from the client." },
];

function FAQAccordion({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border transition-all ${open ? "border-[var(--brand-teal)]/30 bg-[var(--brand-teal)]/[0.05]" : "border-white/10 bg-[var(--brand-navy-deep)]"}`}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-4 p-4 text-left">
        <div className="min-w-0">
          <p className={`text-[14.5px] font-medium leading-snug transition-colors ${open ? "text-white" : "text-white/80"}`}>{faq.q}</p>
        </div>
        <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-white/40 transition-transform ${open ? "rotate-180 text-[var(--brand-teal-soft)]" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="border-t border-white/8 px-4 pb-4 pt-3 text-sm leading-relaxed text-white/65">{faq.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const router = useRouter();
  const [activeTag, setActiveTag] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const staff = getStaffSession();
    const contractor = getContractorSession();
    if (!staff && !contractor) {
      router.push("/admin/access");
    }
  }, [router]);

  const filtered = FAQS.filter((f) => {
    const matchTag = activeTag === "All" || f.tag === activeTag;
    const matchQuery = !query.trim() || f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase());
    return matchTag && matchQuery;
  });

  function printFAQ() {
    window.print();
  }

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <button onClick={() => router.push("/admin")} className="mono mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
              <ArrowLeft className="h-3.5 w-3.5" /> Admin Hub
            </button>
            <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Field Technician Resource</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">APP & FIELD FAQ</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
              Troubleshooting · Connectivity · Photo evidence · Professionalism standards
            </p>
          </div>
          <button onClick={printFAQ} className="btn btn-ghost !px-4 no-print">
            <Printer className="h-3.5 w-3.5" /> Print FAQ sheet
          </button>
        </div>

        {/* Quick-reference cards */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: WifiOff, title: "No signal?", tip: "Load checklist first, complete offline, upload at Wi-Fi." },
            { icon: Camera, title: "Every FAIL needs a photo", tip: "Take overview + close-up. Submission is locked without it." },
            { icon: ShieldCheck, title: "Non-circumvention", tip: "Never do repairs during the audit. Quote only through BCSO." },
            { icon: Battery, title: "Battery died?", tip: "Progress auto-saves. Reopen the browser to restore your work." },
          ].map((c) => (
            <div key={c.title} className="bcso-panel flex items-start gap-3 p-4">
              <c.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-gold)]" />
              <div>
                <div className="font-semibold text-sm">{c.title}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-white/50">{c.tip}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--brand-navy-deep)] px-4 py-3">
          <Search className="h-4 w-4 text-white/35" />
          <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" placeholder="Search the FAQ…" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button onClick={() => setQuery("")}><ChevronDown className="h-4 w-4 rotate-0 text-white/35" /></button>}
        </div>

        {/* Tags */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button key={tag} onClick={() => setActiveTag(tag)} className={`mono rounded-full border px-3 py-1.5 text-[9.5px] uppercase tracking-[0.12em] transition-colors ${activeTag === tag ? "border-[var(--brand-teal)]/60 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]" : "border-white/15 text-white/50 hover:border-white/35"}`}>
              {tag}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-white/35">No FAQs match your search. Try different keywords.</div>
          ) : (
            filtered.map((faq, i) => <FAQAccordion key={i} faq={faq} />)
          )}
        </div>

        <div className="mt-10 rounded-2xl border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/[0.05] p-5">
          <div className="flex items-start gap-3">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-gold)]" />
            <div>
              <div className="font-semibold">Not finding your answer?</div>
              <p className="mt-1 text-sm text-white/60">Contact your BCSO coordinator in Nassau directly. For non-urgent issues, document the problem with a screenshot and submit via the admin notes section of the affected inspection. For urgent field issues, call immediately.</p>
            </div>
          </div>
        </div>
      </div>
    </FieldOpsShell>
  );
}
