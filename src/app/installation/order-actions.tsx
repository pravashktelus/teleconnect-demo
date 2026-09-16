"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, CalendarDays, CheckCircle2 } from "lucide-react";

interface OrderActionsProps {
  orderId: string;
  currentStatus: string;
}

export function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [installDate, setInstallDate] = useState("");
  const [installSlot, setInstallSlot] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionChecks, setCompletionChecks] = useState({
    cableInstalled: false,
    routerConfigured: false,
    speedTested: false,
    customerSignoff: false,
  });

  async function scheduleInstallation() {
    if (!installDate || !installSlot) {
      toast.error("Please select a date and time slot");
      return;
    }
    if (!technicianName.trim()) {
      toast.error("Please enter technician name");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INSTALLATION_SCHEDULED", installDate, installSlot }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to schedule installation");
        return;
      }
      toast.success("Installation scheduled successfully");
      setShowScheduleModal(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function markComplete() {
    const allChecked = completionChecks.cableInstalled && completionChecks.routerConfigured && completionChecks.speedTested && completionChecks.customerSignoff;
    if (!allChecked) {
      toast.error("Please complete all installation checks");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INSTALLATION_COMPLETE", notes: completionNotes }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to mark as complete");
        return;
      }
      toast.success("Installation marked as complete");
      setShowCompleteModal(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "CRM_APPROVED") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className="text-orange-700 border-orange-300 hover:bg-orange-50"
          onClick={() => setShowScheduleModal(true)}
          data-testid="btn-schedule"
        >
          <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
          Schedule
        </Button>

        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="modal-schedule">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Schedule Installation</h3>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Installation Date *</Label>
                  <Input data-testid="input-install-date" type="date" value={installDate} onChange={(e) => setInstallDate(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Time Slot *</Label>
                  <select
                    data-testid="select-install-slot"
                    value={installSlot}
                    onChange={(e) => setInstallSlot(e.target.value)}
                    className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="">Select time slot</option>
                    <option value="MORNING">Morning (9 AM - 12 PM)</option>
                    <option value="AFTERNOON">Afternoon (12 PM - 4 PM)</option>
                    <option value="EVENING">Evening (4 PM - 7 PM)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Assigned Technician *</Label>
                  <Input data-testid="input-technician" placeholder="Enter technician name" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} className="h-11" />
                </div>
              </div>
              <div className="border-t p-4 flex justify-end gap-3 bg-gray-50">
                <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={scheduleInstallation} disabled={loading} data-testid="btn-confirm-schedule">
                  {loading ? "Scheduling..." : "Confirm Schedule"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (currentStatus === "INSTALLATION_SCHEDULED") {
    return (
      <>
        <Button
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white"
          onClick={() => setShowCompleteModal(true)}
          data-testid="btn-mark-complete"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          Mark Complete
        </Button>

        {showCompleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="modal-complete">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Complete Installation</h3>
                </div>
                <button onClick={() => setShowCompleteModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">Confirm all installation steps are completed.</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" data-testid="check-cable" checked={completionChecks.cableInstalled} onChange={(e) => setCompletionChecks(prev => ({ ...prev, cableInstalled: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm font-medium text-gray-700">Fiber/Cable installed and connected</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" data-testid="check-router" checked={completionChecks.routerConfigured} onChange={(e) => setCompletionChecks(prev => ({ ...prev, routerConfigured: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm font-medium text-gray-700">Router configured and WiFi setup</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" data-testid="check-speed" checked={completionChecks.speedTested} onChange={(e) => setCompletionChecks(prev => ({ ...prev, speedTested: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm font-medium text-gray-700">Speed test passed (meets plan speed)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" data-testid="check-signoff" checked={completionChecks.customerSignoff} onChange={(e) => setCompletionChecks(prev => ({ ...prev, customerSignoff: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm font-medium text-gray-700">Customer sign-off received</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Completion Notes (Optional)</Label>
                  <Textarea data-testid="input-completion-notes" placeholder="Any notes about the installation..." value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} rows={2} className="resize-none" />
                </div>
              </div>
              <div className="border-t p-4 flex justify-end gap-3 bg-gray-50">
                <Button variant="outline" size="sm" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={markComplete} disabled={loading} data-testid="btn-confirm-complete">
                  {loading ? "Completing..." : "Mark as Complete"}
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
