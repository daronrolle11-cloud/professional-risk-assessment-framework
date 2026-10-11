import { notFound } from "next/navigation";
import { db } from "@/db";
import { invoices, properties, companySettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { InvoiceDoc } from "@/components/invoice-doc";
import { InvoiceToolbar } from "@/components/invoice-toolbar";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [row] = await db
    .select({ invoice: invoices, property: properties })
    .from(invoices)
    .innerJoin(properties, eq(invoices.propertyId, properties.id))
    .where(eq(invoices.id, id));
  
  if (!row) notFound();

  const [company] = await db.select().from(companySettings).limit(1);

  return (
    <div className="min-h-screen bg-[var(--brand-navy-deep)]">
      <InvoiceToolbar invoiceNo={row.invoice.invoiceNo} />
      <main className="mx-auto max-w-[800px] px-3 py-10">
        <InvoiceDoc invoice={row.invoice} property={row.property} company={company} />
      </main>
    </div>
  );
}
