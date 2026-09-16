"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, ClipboardCheck, CheckCircle2 } from "lucide-react";

interface OrderActionsProps {
  orderId: string;
  currentStatus: string;
}

export function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [verificationChecks, setVerificationChecks] = useState({
    idVerified: false,
    addressVerified: false,
    planEligible: false,
  });
  const [approvalNotes, setApprovalNotes] = useState("");

  async function handleStartReview() {
    if (!reviewNotes.trim()) {
      toast.error("Please add review notes");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CRM_REVIEW", notes: reviewNotes }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update order");
        return;
      }
      toast.success("Order moved to review");
      setShowReviewModal(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    const allChecked = verificationChecks.idVerified && verificationChecks.addressVerified && verificationChecks.planEligible;
    if (!allChecked) {
      toast.error("Please complete all verification checks");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CRM_APPROVED", notes: approvalNotes }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to approve order");
        return;
      }
      toast.success("Order approved successfully");
      setShowApproveModal(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "SUBMITTED") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
          onClick={() => setShowReviewModal(true)}
          data-testid="btn-start-review"
        >
          <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
          Start Review
        </Button>

        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="modal-review">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-yellow-500 flex items-center justify-center">
                    <ClipboardCheck className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Start Order Review</h3>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">Please add initial review notes before starting the review process.</p>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Review Notes *</Label>
                  <Textarea
                    data-testid="input-review-notes"
                    placeholder="e.g., Customer documents look valid, proceeding with verification..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
              <div className="border-t p-4 flex justify-end gap-3 bg-gray-50">
                <Button variant="outline" size="sm" onClick={() => setShowReviewModal(false)} data-testid="btn-cancel-review">Cancel</Button>
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white" onClick={handleStartReview} disabled={loading} data-testid="btn-confirm-review">
                  {loading ? "Processing..." : "Start Review"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (currentStatus === "CRM_REVIEW") {
    return (
      <>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => setShowApproveModal(true)}
          data-testid="btn-approve"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          Approve
        </Button>

        {showApproveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="modal-approve">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Approve Order</h3>
                </div>
                <button onClick={() => setShowApproveModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">Complete the verification checklist before approving.</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" data-testid="check-id-verified" checked={verificationChecks.idVerified} onChange={(e) => setVerificationChecks(prev => ({ ...prev, idVerified: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <span className="text-sm font-medium text-gray-700">Customer ID verified</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" data-testid="check-address-verified" checked={verificationChecks.addressVerified} onChange={(e) => setVerificationChecks(prev => ({ ...prev, addressVerified: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <span className="text-sm font-medium text-gray-700">Address is serviceable</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" data-testid="check-plan-eligible" checked={verificationChecks.planEligible} onChange={(e) => setVerificationChecks(prev => ({ ...prev, planEligible: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <span className="text-sm font-medium text-gray-700">Plan eligibility confirmed</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Approval Notes (Optional)</Label>
                  <Textarea
                    data-testid="input-approval-notes"
                    placeholder="Any additional notes..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
              <div className="border-t p-4 flex justify-end gap-3 bg-gray-50">
                <Button variant="outline" size="sm" onClick={() => setShowApproveModal(false)} data-testid="btn-cancel-approve">Cancel</Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={loading} data-testid="btn-confirm-approve">
                  {loading ? "Approving..." : "Approve Order"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
