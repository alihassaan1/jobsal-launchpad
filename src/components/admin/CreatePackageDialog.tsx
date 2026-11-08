import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CLIENT_PACKAGES, CLIENT_OFFER_VALID_UNTIL, validCustomOffer } from "../../../supabase/functions/paypal-checkout/clientOffers";

type Company = { id: string; name: string; owner_id: string };

export default function CreatePackageDialog({ companies }: { companies: Company[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompany, setNewCompany] = useState<Company | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [posts, setPosts] = useState("");
  const [months, setMonths] = useState("");
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [deadline, setDeadline] = useState("");
  const [template, setTemplate] = useState("custom");
  const [error, setError] = useState("");
  const options = newCompany && !companies.some(c => c.id === newCompany.id) ? [newCompany, ...companies] : companies;

  function chooseTemplate(key: string) {
    setTemplate(key);
    const product = CLIENT_PACKAGES.find(p => p.key === key);
    setName(product?.name ?? "");
    setPrice(product ? String(product.amount_cents / 100) : "");
    setPosts(product ? String(product.listing_credits) : "");
    setMonths(product ? String(product.duration_months) : "");
    setDeadline(product ? new Date(Date.parse(CLIENT_OFFER_VALID_UNTIL) - 1).toISOString().slice(0, 10) : "");
  }

  async function addCompany() {
    setError("");
    if (!companyName.trim() || !ownerEmail.trim()) { setError("Enter a company name and employer account email."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-checkout", { body: { action: "create_offer_company", name: companyName.trim(), owner_email: ownerEmail.trim(), industry, location, description } });
      if (error || data?.error || !data?.company) throw new Error(data?.error ?? "Could not add company. Check the employer account email.");
      setNewCompany(data.company);
      setCompanyId(data.company.id);
      setAddingCompany(false);
      await queryClient.invalidateQueries({ queryKey: ["client-offer-companies"] });
      toast.success("Company added");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not add company"); }
    finally { setBusy(false); }
  }

  async function createPackage(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const startsAt = start ? new Date(`${start}T00:00:00Z`).toISOString() : "";
    const expiresAt = deadline ? new Date(`${deadline}T23:59:59Z`).toISOString() : "";
    const terms = { package_name: name.trim(), amount_cents: Math.round(Number(price) * 100), credit_limit: Number(posts), duration_months: Number(months), starts_at: startsAt, offer_expires_at: expiresAt };
    if (!companyId || !validCustomOffer(terms)) { setError("Choose a company and enter valid package terms, including a future acceptance deadline."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-checkout", { body: { action: "assign_offer", company_id: companyId, product_key: "custom_package", ...terms } });
      if (error || data?.error) throw new Error(data?.error ?? "Could not create package");
      await queryClient.invalidateQueries({ queryKey: ["client-package-offers"] });
      toast.success("Package created and added to the employer's Billing page");
      setOpen(false);
      chooseTemplate("custom");
      setCompanyId("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create package"); }
    finally { setBusy(false); }
  }

  return <Dialog open={open} onOpenChange={value => { if (!busy) { setOpen(value); setError(""); } }}>
    <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Create package</Button>
    <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>Create package</DialogTitle><DialogDescription>Private quotation for one employer. Payment is collected through PayPal.</DialogDescription></DialogHeader>
      <form onSubmit={createPackage} className="space-y-5">
        <div className="space-y-2"><Label htmlFor="package-company">Company</Label><div className="flex flex-wrap gap-2"><Select value={companyId} onValueChange={setCompanyId}><SelectTrigger id="package-company" className="flex-1 min-w-0"><SelectValue placeholder="Select company" /></SelectTrigger><SelectContent>{options.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" onClick={() => { setAddingCompany(!addingCompany); setError(""); }} disabled={busy}><Building2 className="mr-2 h-4 w-4" />{addingCompany ? "Cancel adding" : "Add company"}</Button></div></div>
        {addingCompany && <div className="space-y-3 border-y py-4">
          <h3 className="font-semibold">Add company</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="new-company-name">Company name</Label><Input id="new-company-name" maxLength={255} value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="new-owner-email">Employer account email</Label><Input id="new-owner-email" type="email" maxLength={255} value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="new-company-industry">Industry</Label><Input id="new-company-industry" maxLength={255} value={industry} onChange={e => setIndustry(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="new-company-location">City</Label><Input id="new-company-location" maxLength={255} value={location} onChange={e => setLocation(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="new-company-description">Company description</Label><Input id="new-company-description" maxLength={5000} value={description} onChange={e => setDescription(e.target.value)} /></div>
          <Button type="button" variant="secondary" disabled={busy} onClick={addCompany}>{busy ? "Saving…" : "Save company"}</Button>
        </div>}
        <div className="space-y-2"><Label htmlFor="package-template">Starting template</Label><Select value={template} onValueChange={chooseTemplate}><SelectTrigger id="package-template"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="custom">Custom package</SelectItem>{CLIENT_PACKAGES.map(p => <SelectItem key={p.key} value={p.key}>TIA quotation: {p.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-2"><Label htmlFor="package-name">Package name</Label><Input id="package-name" required maxLength={120} value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="package-price">Total price (€)</Label><Input id="package-price" type="number" required min="0.01" max="1000000" step="0.01" value={price} onChange={e => setPrice(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="package-posts">Job posts allowed (total)</Label><Input id="package-posts" type="number" required min="1" max="1000000" step="1" value={posts} onChange={e => setPosts(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="package-months">Duration (months)</Label><Input id="package-months" type="number" required min="1" max="120" step="1" value={months} onChange={e => setMonths(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="package-start">Activation date</Label><Input id="package-start" type="date" required min={new Date().toISOString().slice(0, 10)} value={start} onChange={e => setStart(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="package-deadline">Acceptance deadline</Label><Input id="package-deadline" type="date" required min={new Date().toISOString().slice(0, 10)} value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={busy || addingCompany || !companyId}>{busy ? "Saving…" : "Create package"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}