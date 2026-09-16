"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, Zap, Wifi } from "lucide-react";

interface OrderActionsProps {
  orderId: string;
  currentStatus: string;
}

function generateConnectionId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "CONN-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [portNumber, setPortNumber] = useState("");
  const [oltDevice, setOltDevice] = useState("");
  const [activationNotes, setActivationNotes] = useState("");
  const [activationChecks, setActivationChecks] = useState({
    portAssigned: false,
    signalVerified: false,
    bandwidthConfigured: false,
    pingTest: false,
  });

  async function startActivation() {
    if (!portNumber.trim() || !oltDevice.trim()) {
      toast.error("Please fill in port number and OLT device");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVATION_PENDING", notes: `Port: ${portNumber}, OLT: ${oltDevice}` }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to start activation");
        return;
      }
      toast.success("Activation process started");
      setShowStartModal(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function activateConnection() {
    const allChecked = activationChecks.portAssigned && activationChecks.signalVerified && activationChecks.bandwidthConfigured && activationChecks.pingTest;
    if (!allChecked) {
      toast.error("Please complete all activation checks");
      return;
    }
    setLoading(true);
    try {
      const connectionId = generateConnectionId();
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVATED", connectionId, notes: activationNotes }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to activate connection");
        return;
      }
      toast.success(`Connection activated: ${connectionId}`);
      setShowActivateModal(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "INSTALLATION_COMPLETE") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className="text-purple-700 border-purple-300 hover:bg-purple-50"
          onClick={() => setShowStartModal(true)}
          data-testid="btn-start-activation"
        >
          <Zap className="w-3.5 h-3.5 mr-1.5" />
          Start Activation
        </Button>

        {showStartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="modal-start-activation">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Start Activation</h3>
                </div>
                <button onClick={() => setShowStartModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">Enter network configuration details to begin activation.</p>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Port Number *</Label>
                  <Input data-testid="input-port-number" placeholder="e.g., GE0/0/1:1" value={portNumber} onChange={(e) => setPortNumber(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">OLT Device *</Label>
                  <Input data-testid="input-olt-device" placeholder="e.g., OLT-MUM-001" value={oltDevice} onChange={(e) => setOltDevice(e.target.value)} className="h-11" />
                </div>
              </div>
              <div className="border-t p-4 flex justify-end gap-3 bg-gray-50">
                <Button variant="outline" size="sm" onClick={() => setShowStartModal(false)}>Cancel</Button>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={startActivation} disabled={loading} data-testid="btn-confirm-start">
                  {loading ? "Starting..." : "Begin Activation"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (currentStatus === "ACTIVATION_PENDING") {
    return (
      <>
        <Button
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
          onClick={() => setShowActivateModal(true)}
          data-testid="btn-activate"
        >
          <Wifi className="w-3.5 h-3.5 mr-1.5" />
          Activate
        </Button>

        {showActivateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="modal-activate">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <Wifi className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Activate Connection</h3>
                </div>
                <button onClick={() => setShowActivateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">Complete all checks before activating the connection.</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" data-testid="check-port" checked={activationChecks.portAssigned} onChange={(e) => setActivationChecks(prev => ({ ...prev, portAssigned: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-medium text-gray-700">Port assigned and configured</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" data-testid="check-signal" checked={activationChecks.signalVerified} onChange={(e) => setActivationChecks(prev => ({ ...prev, signalVerified: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-medium text-gray-700">Optical signal level verified</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" data-testid="check-bandwidth" checked={activationChecks.bandwidthConfigured} onChange={(e) => setActivationChecks(prev => ({ ...prev, bandwidthConfigured: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-medium text-gray-700">Bandwidth profile configured</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" data-testid="check-ping" checked={activationChecks.pingTest} onChange={(e) => setActivationChecks(prev => ({ ...prev, pingTest: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-medium text-gray-700">End-to-end ping test successful</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Activation Notes (Optional)</Label>
                  <Textarea data-testid="input-activation-notes" placeholder="Any notes..." value={activationNotes} onChange={(e) => setActivationNotes(e.target.value)} rows={2} className="resize-none" />
                </div>
              </div>
              <div className="border-t p-4 flex justify-end gap-3 bg-gray-50">
                <Button variant="outline" size="sm" onClick={() => setShowActivateModal(false)}>Cancel</Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={activateConnection} disabled={loading} data-testid="btn-confirm-activate">
                  {loading ? "Activating..." : "Activate Connection"}
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
