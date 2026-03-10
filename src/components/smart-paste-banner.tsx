"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ParsedReferral, ConfidenceField } from "@/lib/types";

interface SmartPasteBannerProps {
  onParsed: (data: ParsedReferral) => void;
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.9) return "border-l-emerald-500";
  if (confidence >= 0.5) return "border-l-amber-500";
  return "border-l-red-500";
}

function getConfidenceLabel(confidence: number) {
  if (confidence >= 0.9) return "High";
  if (confidence >= 0.5) return "Review";
  return "Low";
}

function countByConfidence(data: ParsedReferral) {
  const fields: ConfidenceField[] = [
    data.patientFirstName,
    data.patientLastName,
    data.patientDob,
    data.patientPhone,
    data.patientAddress,
    data.diagnosisCode,
    data.diagnosisDescription,
    data.providerName,
    data.providerNpi,
    data.clinicName,
    data.payerName,
  ];

  let high = 0;
  let review = 0;
  let low = 0;

  for (const f of fields) {
    if (!f.value) {
      low++;
    } else if (f.confidence >= 0.9) {
      high++;
    } else if (f.confidence >= 0.5) {
      review++;
    } else {
      low++;
    }
  }

  return { high, review, low, total: fields.length };
}

const SAMPLE_REFERRAL = `REFERRAL FOR DME SERVICES

Patient: Margaret Chen
DOB: 08/14/1962
Phone: (555) 432-1098
Address: 789 Willow Lane, Sacramento, CA 95820

Diagnosis: I89.0 - Lymphedema, not elsewhere classified

Referring Provider: Dr. Rachel Torres
NPI: 456789012
Clinic: Sacramento Vascular Associates

Insurance: Medicare Part B

Prescribed Items:
- Below-knee compression stockings 30-40mmHg (A6531) x2
- Segmental pneumatic appliance full leg (E0667) x1

Notes: Patient has bilateral lower extremity lymphedema.
Please fit and deliver to clinic address.
Medical necessity documentation attached.`;

export function SmartPasteBanner({ onParsed }: SmartPasteBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedReferral | null>(null);

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/parse-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`Parse failed: ${res.status}`);
      const data: ParsedReferral = await res.json();
      setResult(data);
    } catch {
      toast.error("AI parsing failed", {
        description: "Please enter the fields manually or try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (result) {
      onParsed(result);
      setIsOpen(false);
      setText("");
      setResult(null);
    }
  }

  function handleLoadSample() {
    setText(SAMPLE_REFERRAL);
  }

  if (!isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 transition-all text-left group shadow-sm"
        >
          <Sparkles className="h-5 w-5 text-blue-600 group-hover:text-blue-700 animate-pulse" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Smart Paste — AI-Powered Form Fill
            </p>
            <p className="text-xs text-blue-600">
              Paste a referral, fax, or email and AI will extract all fields with
              confidence scoring
            </p>
            <p className="text-xs text-blue-400 mt-0.5">
              Avg. 4 min saved per order vs manual entry
            </p>
          </div>
        </button>
      </motion.div>
    );
  }

  const stats = result ? countByConfidence(result) : null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-6 rounded-lg border border-blue-200 bg-blue-50/30 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200 bg-blue-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Smart Paste
          </span>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setText("");
            setResult(null);
          }}
          className="text-blue-400 hover:text-blue-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {!result ? (
          <>
            <Textarea
              placeholder="Paste referral text, fax content, or email here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="bg-white resize-none text-sm"
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleParse}
                disabled={loading || !text.trim()}
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Parse with AI
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadSample}
                className="text-muted-foreground"
              >
                Load sample referral
              </Button>
            </div>
          </>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* Confidence Summary */}
              {stats && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{stats.high} high confidence</span>
                  </div>
                  {stats.review > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <span>{stats.review} need review</span>
                    </div>
                  )}
                  {stats.low > 0 && (
                    <div className="flex items-center gap-1.5 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{stats.low} not found</span>
                    </div>
                  )}
                </div>
              )}

              {/* Parsed Fields Preview */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "First Name", field: result.patientFirstName },
                  { label: "Last Name", field: result.patientLastName },
                  { label: "DOB", field: result.patientDob },
                  { label: "Phone", field: result.patientPhone },
                  { label: "Diagnosis", field: result.diagnosisCode },
                  { label: "Provider", field: result.providerName },
                  { label: "NPI", field: result.providerNpi },
                  { label: "Payer", field: result.payerName },
                ].map(({ label, field }) => (
                  <div
                    key={label}
                    className={`px-3 py-1.5 rounded bg-white border-l-4 ${getConfidenceColor(field.confidence)}`}
                  >
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {label}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {field.value || "—"}
                      </p>
                      <span
                        className={`text-xs font-medium ${
                          field.confidence >= 0.9
                            ? "text-emerald-600"
                            : field.confidence >= 0.5
                              ? "text-amber-600"
                              : "text-red-500"
                        }`}
                      >
                        {getConfidenceLabel(field.confidence)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Products */}
              {result.products.value.length > 0 && (
                <div
                  className={`px-3 py-1.5 rounded bg-white border-l-4 ${getConfidenceColor(result.products.confidence)}`}
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Products Detected
                  </p>
                  <p className="text-sm font-medium">
                    {result.products.value.join(", ")}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button onClick={handleApply} size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Apply to Form
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setResult(null);
                    setText("");
                  }}
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
