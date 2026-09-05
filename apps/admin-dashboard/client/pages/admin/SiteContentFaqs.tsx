import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@game/ui/button';
import { Input } from '@game/ui/input';
import { Textarea } from '@game/ui/textarea';
import { Label } from '@game/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@game/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@game/ui/select';
import { Badge } from '@game/ui/badge';
import { useToast } from '@game/ui/use-toast';
import { getBusinessSettings, patchBusinessSettings, getSiteSettings } from "@/lib/api";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_CATEGORIES = [
  { value: 'deposit',         label: 'Deposit' },
  { value: 'withdrawal',      label: 'Withdrawal' },
  { value: 'transfer',        label: 'Transfer' },
  { value: 'voucher',         label: 'Voucher' },
  { value: 'bank-details',    label: 'Bank Details' },
  { value: 'inbox',           label: 'Inbox' },
  { value: 'change-password', label: 'Change Password' },
  { value: 'profile',         label: 'Profile / Account' },
  { value: 'agency',          label: 'Agency' },
  { value: 'affiliate',       label: 'Affiliate' },
  { value: 'vip',             label: 'VIP' },
  { value: 'promotions',      label: 'Promotions' },
];

const DEFAULT_FAQS: FaqItem[] = [
  { id: '1', question: 'How do I make a deposit?', answer: 'We have a list of major banks and payment options for you, kindly contact our live chat or sign in to get our banking details.\n\n1. Login to your account.\n2. Click Deposit.\n3. Select your depositing bank.\n4. Enter the necessary banking details & click submit.' },
  { id: '2', question: 'How do I withdraw my winnings?', answer: 'Please submit a withdrawal request and your winnings will be transferred directly to your bank account.\n\n1. Login to your account.\n2. Click Withdrawal.\n3. Enter the amount you wish to withdraw and click submit.' },
  { id: '3', question: 'Can I transfer my balance to other product?', answer: 'Yes, you may do so easily yourself on our new wallet platform.\n\n1. Login to your account.\n2. Click Transfer.\n3. Select the necessary transfer details, amount & click submit.' },
  { id: '4', question: 'What if I forget my password?', answer: 'You can retrieve your password by clicking the "Forgot Password" link on the sign-in page.' },
];

const genId = () => Math.random().toString(36).slice(2, 9);

export function SiteContentFaqs() {
  const { toast } = useToast();
  const [category, setCategory] = useState('deposit');
  const [allFaqs, setAllFaqs] = useState<Record<string, FaqItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load existing pageFaqs from backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const json = await getSiteSettings();
        const faqs = json?.site?.pageFaqs || {};
        setAllFaqs(faqs);
      } catch {
        // ignore — start with empty
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const faqs: FaqItem[] = allFaqs[category] || [...DEFAULT_FAQS];

  const setFaqs = (newFaqs: FaqItem[]) => {
    setAllFaqs(prev => ({ ...prev, [category]: newFaqs }));
  };

  const handleAdd = () => {
    const newItem: FaqItem = { id: genId(), question: '', answer: '' };
    setFaqs([...faqs, newItem]);
    setExpandedId(newItem.id);
  };

  const handleDelete = (id: string) => {
    setFaqs(faqs.filter(f => f.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleChange = (id: string, field: 'question' | 'answer', value: string) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleSave = async () => {
    const invalid = faqs.some(f => !f.question.trim() || !f.answer.trim());
    if (invalid) {
      toast({ title: 'Validation Error', description: 'All FAQ items must have both question and answer.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await patchBusinessSettings({ pageFaqs: { ...allFaqs, [category]: faqs } });
      toast({ title: 'Saved!', description: `FAQs for "${category}" updated successfully.` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save FAQs. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = () => {
    setFaqs([...DEFAULT_FAQS.map(f => ({ ...f, id: genId() }))]);
    toast({ title: 'Reset', description: 'FAQs reset to default. Click Save to apply.' });
  };

  const catLabel = FAQ_CATEGORIES.find(c => c.value === category)?.label ?? category;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Page FAQs</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage FAQ content displayed on each page of the frontend.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleResetDefault} disabled={saving}>
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save FAQs
          </Button>
        </div>
      </div>

      {/* Category Selector */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Select Page</CardTitle>
          <CardDescription>Choose which page's FAQs you want to edit.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select a page..." />
            </SelectTrigger>
            <SelectContent>
              {FAQ_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                  {allFaqs[c.value] && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {allFaqs[c.value].length}
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{catLabel} — FAQ Items</CardTitle>
              <CardDescription>{faqs.length} question{faqs.length !== 1 ? 's' : ''}</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No FAQs yet. Click "Add Question" to start.
            </div>
          ) : (
            faqs.map((faq, idx) => (
              <div key={faq.id} className="border rounded-lg overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab" />
                  <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}</span>
                  <button
                    className="flex-1 text-left text-sm font-medium truncate hover:text-foreground transition-colors"
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  >
                    {faq.question || <span className="text-muted-foreground italic">Untitled question...</span>}
                  </button>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${expandedId === faq.id ? 'rotate-180' : ''}`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 flex-shrink-0"
                    onClick={() => handleDelete(faq.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Expanded editor */}
                {expandedId === faq.id && (
                  <div className="p-4 space-y-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor={`q-${faq.id}`} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Question</Label>
                      <Input
                        id={`q-${faq.id}`}
                        value={faq.question}
                        onChange={e => handleChange(faq.id, 'question', e.target.value)}
                        placeholder="Enter question text..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`a-${faq.id}`} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Answer</Label>
                      <Textarea
                        id={`a-${faq.id}`}
                        value={faq.answer}
                        onChange={e => handleChange(faq.id, 'answer', e.target.value)}
                        placeholder="Enter answer text... Use \\n for line breaks."
                        rows={5}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Save Footer */}
      {faqs.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save All FAQs for "{catLabel}"
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SiteContentFaqsPage() {
  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <SiteContentFaqs />
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
