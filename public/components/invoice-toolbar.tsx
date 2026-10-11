"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export function InvoiceToolbar({ invoiceNo }: { invoiceNo: string }) {
  return (
    <div className="no-print sticky top-0 z-50 bcso-topbar border-b backdrop-blur-xl px-8 py-3 flex justify-between items-center">
      <div className="flex items-center gap-4">
         <Link href="/admin/invoices" className="btn btn-ghost !p-2"><ArrowLeft className="h-4 w-4" /></Link>
         <div>
           <div className="mono text-[10px] uppercase text-white/40">Invoice</div>
           <div className="font-bold text-white">{invoiceNo}</div>
         </div>
      </div>
      <button onClick={() => window.print()} className="btn btn-primary"><Printer className="h-4 w-4" /> Print / Save PDF</button>
    </div>
  );
}
