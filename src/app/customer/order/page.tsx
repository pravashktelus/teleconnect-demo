"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Wifi,
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Package,
  Tag,
  Send,
  Calendar,
  Upload,
} from "lucide-react";

const LocationMap = dynamic(
  () =>
    import("@/components/shared/location-map").then((m) => ({
      default: m.LocationMap,
    })),
  { ssr: false }
);

// Types
interface ServiceArea {
  id: string;
  state: string;
  city: string;
  area: string;
  pincode: string;
  lat: number;
  lng: number;
}

interface Plan {
  id: string;
  name: string;
  speed: string;
  price: number;
  description: string;
  features: string;
}

interface Offer {
  id: string;
  code: string;
  name: string;
  discount: number;
  discountType: string;
}

// Step definitions
const steps = [
  { id: 1, label: "Customer Info", icon: Wifi },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Plan", icon: Package },
  { id: 4, label: "Offers", icon: Tag },
  { id: 5, label: "Schedule", icon: Calendar },
  { id: 6, label: "Confirm", icon: Send },
];

export default function OrderWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string;
    expectedDate: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Step 1 - Customer Info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 - Service Location
  const [serviceAreas, setServiceAreas] = useState<
    Record<string, Record<string, ServiceArea[]>>
  >({});
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [pincode, setPincode] = useState("");
  const [installAddress, setInstallAddress] = useState("");

  // Step 3 - Plan
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  // Step 4 - Offer
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState("");

  // Step 5 - Schedule Installation
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredSlot, setPreferredSlot] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Fetch service areas
  useEffect(() => {
    fetch("/api/service-areas")
      .then((res) => res.json())
      .then((data) => setServiceAreas(data.serviceAreas || {}))
      .catch(() => toast.error("Failed to load service areas"));
  }, []);

  // Fetch plans
  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => setPlans(data.plans || []))
      .catch(() => toast.error("Failed to load plans"));
  }, []);

  // Fetch offers
  useEffect(() => {
    fetch("/api/offers")
      .then((res) => res.json())
      .then((data) => setOffers(data.offers || []))
      .catch(() => toast.error("Failed to load offers"));
  }, []);

  // Update pincode when area changes
  useEffect(() => {
    if (selectedAreaId && selectedState && selectedCity) {
      const areas = serviceAreas[selectedState]?.[selectedCity] || [];
      const area = areas.find((a) => a.id === selectedAreaId);
      if (area) {
        setPincode(area.pincode);
      }
    } else {
      setPincode("");
    }
  }, [selectedAreaId, selectedState, selectedCity, serviceAreas]);

  // Helpers
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const selectedOffer = offers.find((o) => o.id === selectedOfferId);

  function getDiscount(): number {
    if (!selectedPlan || !selectedOffer) return 0;
    if (selectedOffer.discountType === "PERCENTAGE") {
      return (selectedPlan.price * selectedOffer.discount) / 100;
    }
    return selectedOffer.discount;
  }

  function getFinalPrice(): number {
    if (!selectedPlan) return 0;
    return Math.max(0, selectedPlan.price - getDiscount());
  }

  function getSelectedArea(): ServiceArea | undefined {
    if (!selectedState || !selectedCity || !selectedAreaId) return undefined;
    return (serviceAreas[selectedState]?.[selectedCity] || []).find(
      (a) => a.id === selectedAreaId
    );
  }

  function getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  function getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split("T")[0];
  }

  function getSlotLabel(slot: string): string {
    switch (slot) {
      case "MORNING":
        return "Morning (9 AM - 12 PM)";
      case "AFTERNOON":
        return "Afternoon (12 PM - 4 PM)";
      case "EVENING":
        return "Evening (4 PM - 7 PM)";
      default:
        return slot;
    }
  }

  // Validation
  function validateStep(step: number): boolean {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!customerName.trim()) {
          errors.customerName = "Full name is required";
        } else if (customerName.trim().length < 3) {
          errors.customerName = "Name must be at least 3 characters";
        } else if (customerName.trim().length > 100) {
          errors.customerName = "Name must be less than 100 characters";
        } else if (!/^[a-zA-Z\s.'-]+$/.test(customerName.trim())) {
          errors.customerName = "Name can only contain letters, spaces, dots, hyphens";
        }

        if (!customerEmail.trim()) {
          errors.customerEmail = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
          errors.customerEmail = "Please enter a valid email address";
        }

        if (!customerPhone.trim()) {
          errors.customerPhone = "Phone number is required";
        } else if (!/^\d{10}$/.test(customerPhone.trim())) {
          errors.customerPhone = "Phone must be exactly 10 digits";
        }

        if (altPhone.trim() && !/^\d{10}$/.test(altPhone.trim())) {
          errors.altPhone = "Alternate phone must be 10 digits";
        }
        if (altPhone.trim() && altPhone.trim() === customerPhone.trim()) {
          errors.altPhone = "Alternate phone must be different from primary";
        }

        if (!customerAddress.trim()) {
          errors.customerAddress = "Address is required";
        } else if (customerAddress.trim().length < 10) {
          errors.customerAddress = "Address must be at least 10 characters";
        } else if (customerAddress.trim().length > 300) {
          errors.customerAddress = "Address must be less than 300 characters";
        }

        if (dob) {
          const dobDate = new Date(dob);
          const today = new Date();
          const age = today.getFullYear() - dobDate.getFullYear();
          if (age < 18) {
            errors.dob = "You must be at least 18 years old";
          } else if (age > 120) {
            errors.dob = "Please enter a valid date of birth";
          }
        }

        if (!idType) {
          errors.idType = "Please select an ID type";
        }

        if (!idNumber.trim()) {
          errors.idNumber = "ID number is required";
        } else if (idType === "Aadhaar" && !/^\d{12}$/.test(idNumber.trim())) {
          errors.idNumber = "Aadhaar must be exactly 12 digits";
        } else if (idType === "PAN" && !/^[A-Z]{5}\d{4}[A-Z]$/.test(idNumber.trim().toUpperCase())) {
          errors.idNumber = "PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)";
        } else if (idType === "Passport" && !/^[A-Z]\d{7}$/.test(idNumber.trim().toUpperCase())) {
          errors.idNumber = "Passport format: A1234567 (1 letter + 7 digits)";
        } else if (idType === "Driving License" && idNumber.trim().length < 10) {
          errors.idNumber = "Driving license must be at least 10 characters";
        }

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
          toast.error("Please fix the highlighted errors");
          return false;
        }
        return true;

      case 2:
        if (!selectedState) {
          errors.selectedState = "Please select a state";
        }
        if (!selectedCity) {
          errors.selectedCity = "Please select a city";
        }
        if (!selectedAreaId) {
          errors.selectedAreaId = "Please select an area";
        }
        if (!installAddress.trim()) {
          errors.installAddress = "Installation address is required";
        } else if (installAddress.trim().length < 10) {
          errors.installAddress = "Address must be at least 10 characters";
        }

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
          toast.error("Please fix the highlighted errors");
          return false;
        }
        return true;

      case 3:
        if (!selectedPlanId) {
          toast.error("Please select a plan");
          return false;
        }
        return true;

      case 4:
        return true;

      case 5:
        if (!preferredDate) {
          errors.preferredDate = "Please select an installation date";
        }
        if (!preferredSlot) {
          errors.preferredSlot = "Please select a time slot";
        }

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
          toast.error("Please fix the highlighted errors");
          return false;
        }
        return true;

      case 6:
        return true;
      default:
        return true;
    }
  }

  function handleNext() {
    if (validateStep(currentStep)) {
      setFieldErrors({});
      setCurrentStep((prev) => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    setFieldErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          serviceAreaId: selectedAreaId,
          installAddress,
          planId: selectedPlanId,
          offerId: selectedOfferId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to place order");
        return;
      }

      const { order } = await res.json();
      setOrderSuccess({
        orderNumber: order.orderNumber,
        expectedDate: order.expectedDate,
      });
      toast.success("Order placed successfully!");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Render step indicator
  function renderStepIndicator() {
    return (
      <div className="mb-10 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm" data-testid="step-indicator">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium transition-all shadow-sm ${
                      currentStep > step.id
                        ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-green-200"
                        : currentStep === step.id
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white ring-4 ring-blue-100 shadow-blue-200"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2.5 text-xs font-semibold ${
                      currentStep >= step.id ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-3 mt-[-1.5rem] rounded-full transition-colors ${
                      currentStep > step.id ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gray-100"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 1: Customer Information
  function renderStep1() {
    return (
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 pb-5">
          <CardTitle className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Customer Information</p>
              <p className="text-sm font-normal text-gray-500">Tell us about yourself</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Personal Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name *</Label>
                <Input
                  id="name"
                  data-testid="input-name"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className={`h-11 ${fieldErrors.customerName ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`}
                />
                {fieldErrors.customerName && <p data-testid="error-customerName" className="text-xs text-red-500 mt-1">{fieldErrors.customerName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address *</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className={`h-11 ${fieldErrors.customerEmail ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`}
                />
                {fieldErrors.customerEmail && <p data-testid="error-customerEmail" className="text-xs text-red-500 mt-1">{fieldErrors.customerEmail}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-sm font-semibold text-gray-700">Date of Birth</Label>
                <Input
                  id="dob"
                  data-testid="input-dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={`h-11 ${fieldErrors.dob ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`}
                />
                {fieldErrors.dob && <p data-testid="error-dob" className="text-xs text-red-500 mt-1">{fieldErrors.dob}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">Gender</Label>
                <select
                  data-testid="select-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone Number *</Label>
                <Input
                  id="phone"
                  data-testid="input-phone"
                  type="tel"
                  placeholder="9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className={`h-11 ${fieldErrors.customerPhone ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`}
                />
                {fieldErrors.customerPhone && <p data-testid="error-customerPhone" className="text-xs text-red-500 mt-1">{fieldErrors.customerPhone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="altPhone" className="text-sm font-semibold text-gray-700">Alternate Phone</Label>
                <Input
                  id="altPhone"
                  data-testid="input-alt-phone"
                  type="tel"
                  placeholder="Optional"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  className={`h-11 ${fieldErrors.altPhone ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`}
                />
                {fieldErrors.altPhone && <p data-testid="error-altPhone" className="text-xs text-red-500 mt-1">{fieldErrors.altPhone}</p>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Address</h3>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Residential Address *</Label>
              <Textarea
                id="address"
                data-testid="input-address"
                placeholder="Enter your full residential address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                rows={3}
                required
                className={`resize-none ${fieldErrors.customerAddress ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`}
              />
              {fieldErrors.customerAddress && <p data-testid="error-customerAddress" className="text-xs text-red-500 mt-1">{fieldErrors.customerAddress}</p>}
            </div>
          </div>

          {/* Identity Verification */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Identity Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="idType" className="text-sm font-semibold text-gray-700">ID Type *</Label>
                <select
                  data-testid="select-id-type"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className={`h-11 w-full rounded-md border bg-white px-3 text-sm focus:ring-2 focus:outline-none ${fieldErrors.idType ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"}`}
                >
                  <option value="">Select ID type</option>
                  <option value="Aadhaar">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                </select>
                {fieldErrors.idType && <p data-testid="error-idType" className="text-xs text-red-500 mt-1">{fieldErrors.idType}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber" className="text-sm font-semibold text-gray-700">ID Number *</Label>
                <Input
                  id="idNumber"
                  data-testid="input-id-number"
                  placeholder="Enter your ID number"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                  className={`h-11 ${fieldErrors.idNumber ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`}
                />
                {fieldErrors.idNumber && <p data-testid="error-idNumber" className="text-xs text-red-500 mt-1">{fieldErrors.idNumber}</p>}
              </div>
            </div>

            {/* ID Document Upload */}
            <div className="mt-5 space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Upload ID Document</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setIdFile(file);
                }}
              />
              <div
                data-testid="upload-id-document"
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
              >
                {idFile ? (
                  <div className="space-y-3">
                    {idFile.type.startsWith("image/") && (
                      <div className="flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(idFile)}
                          alt="ID Preview"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-700">{idFile.name}</p>
                    <p className="text-xs text-gray-500">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-500">Click to browse and upload</p>
                    <p className="text-xs text-gray-400">Accepts JPEG, PNG, or PDF</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Service Location
  function renderStep2() {
    const states = Object.keys(serviceAreas);
    const cities = selectedState ? Object.keys(serviceAreas[selectedState] || {}) : [];
    const areas = selectedState && selectedCity
      ? serviceAreas[selectedState]?.[selectedCity] || []
      : [];
    const currentArea = getSelectedArea();

    return (
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 pb-5">
          <CardTitle className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Service Location</p>
              <p className="text-sm font-normal text-gray-500">Select your service area</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">State</Label>
              <select
                data-testid="select-state"
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedCity("");
                  setSelectedAreaId("");
                  setPincode("");
                }}
                className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="">Select a state</option>
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">City</Label>
              <select
                data-testid="select-city"
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedAreaId("");
                  setPincode("");
                }}
                disabled={!selectedState}
                className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a city</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Area</Label>
              <select
                data-testid="select-area"
                value={selectedAreaId ? (areas.find(a => a.id === selectedAreaId)?.area || "") : ""}
                onChange={(e) => {
                  const found = areas.find(a => a.area === e.target.value);
                  setSelectedAreaId(found?.id ?? "");
                }}
                disabled={!selectedCity}
                className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select an area</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.area}>{area.area}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Pincode</Label>
              <Input
                data-testid="input-pincode"
                value={pincode}
                disabled
                placeholder="Auto-filled"
                className="h-11 border-gray-200 bg-gray-50"
              />
            </div>
          </div>

          {selectedAreaId && (
            <div data-testid="service-available" className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Service available in your area!
              </span>
            </div>
          )}

          {currentArea && (
            <div className="space-y-2" data-testid="location-map">
              <Label className="text-sm font-semibold text-gray-700">Service Location on Map</Label>
              <LocationMap
                lat={currentArea.lat}
                lng={currentArea.lng}
                label={`${currentArea.area}, ${currentArea.city}`}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="installAddress" className="text-sm font-semibold text-gray-700">Installation Address</Label>
            <Textarea
              id="installAddress"
              data-testid="input-install-address"
              placeholder="Enter installation address (can be different from your residential address)"
              value={installAddress}
              onChange={(e) => setInstallAddress(e.target.value)}
              rows={3}
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Choose Plan
  function renderStep3() {
    return (
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 pb-5">
          <CardTitle className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Choose Your Plan</p>
              <p className="text-sm font-normal text-gray-500">Select the best plan for your needs</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {plans.map((plan, idx) => {
              const features: string[] = (() => {
                try {
                  return JSON.parse(plan.features);
                } catch {
                  return [];
                }
              })();
              const isPopular = idx === 2;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  data-testid={`plan-card-${plan.id}`}
                  className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                    selectedPlanId === plan.id
                      ? "border-blue-500 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 shadow-lg shadow-blue-100"
                      : "border-gray-200 hover:border-blue-200 bg-white"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-3 py-0.5 shadow-md">
                        POPULAR
                      </Badge>
                    </div>
                  )}
                  {selectedPlanId === plan.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 text-xs font-semibold">
                      {plan.speed}
                    </Badge>
                  </div>
                  <p className="text-3xl font-extrabold text-gray-900 mt-4">
                    ₹{plan.price}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      /month
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {plan.description}
                  </p>
                  {features.length > 0 && (
                    <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                      {features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2.5 text-sm text-gray-700"
                        >
                          <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-green-600" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 4: Apply Offer
  function renderStep4() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            Apply Offer (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {/* No offer option */}
            <div
              data-testid="offer-none"
              onClick={() => setSelectedOfferId("")}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedOfferId === ""
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOfferId === ""
                      ? "border-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedOfferId === "" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <span className="font-medium text-gray-700">
                  No offer - Continue without discount
                </span>
              </div>
            </div>

            {offers.map((offer) => (
              <div
                key={offer.id}
                data-testid={`offer-card-${offer.id}`}
                onClick={() => setSelectedOfferId(offer.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedOfferId === offer.id
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedOfferId === offer.id
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedOfferId === offer.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{offer.name}</p>
                    <p className="text-sm text-gray-500">
                      {offer.discountType === "PERCENTAGE"
                        ? `${offer.discount}% off`
                        : `₹${offer.discount} off`}{" "}
                      • Code: {offer.code}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price Summary */}
          {selectedPlan && (
            <>
              <Separator />
              <div data-testid="price-summary" className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price</span>
                  <span className="font-medium">₹{selectedPlan.price}/mo</span>
                </div>
                {selectedOffer && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount</span>
                    <span className="font-medium text-green-600">
                      -₹{getDiscount().toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Final Price</span>
                  <span className="font-bold text-lg">
                    ₹{getFinalPrice().toFixed(2)}/mo
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Step 5: Schedule Installation
  function renderStep5() {
    const timeSlots = [
      { id: "MORNING", label: "Morning", time: "9 AM - 12 PM" },
      { id: "AFTERNOON", label: "Afternoon", time: "12 PM - 4 PM" },
      { id: "EVENING", label: "Evening", time: "4 PM - 7 PM" },
    ];

    return (
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 pb-5">
          <CardTitle className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Schedule Installation</p>
              <p className="text-sm font-normal text-gray-500">Choose your preferred installation time</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Preferred Date */}
          <div className="space-y-2">
            <Label htmlFor="preferredDate" className="text-sm font-semibold text-gray-700">Preferred Installation Date *</Label>
            <Input
              id="preferredDate"
              data-testid="input-preferred-date"
              type="date"
              min={getMinDate()}
              max={getMaxDate()}
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Preferred Time Slot */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Preferred Time Slot *</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {timeSlots.map((slot) => (
                <div
                  key={slot.id}
                  data-testid={`slot-${slot.label.toLowerCase()}`}
                  onClick={() => setPreferredSlot(slot.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                    preferredSlot === slot.id
                      ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100"
                      : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        preferredSlot === slot.id
                          ? "border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {preferredSlot === slot.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="font-semibold text-gray-900">{slot.label}</p>
                    <p className="text-sm text-gray-500">{slot.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="specialInstructions" className="text-sm font-semibold text-gray-700">Special Instructions (Optional)</Label>
            <Textarea
              id="specialInstructions"
              data-testid="input-special-instructions"
              placeholder="e.g., Ring doorbell twice, Call before coming"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Note */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Calendar className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Our team will confirm the exact date and time within 24 hours of placing your order.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 6: Confirmation
  function renderStep6() {
    if (orderSuccess) {
      return (
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="py-16 text-center space-y-6" data-testid="order-success">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 animate-bounce">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Order Placed Successfully!
              </h2>
              <p className="text-gray-500 mt-2 text-lg">
                Your broadband connection order has been submitted.
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-100 inline-block mx-auto space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Order Number</p>
                <p data-testid="order-number" className="font-mono font-bold text-xl text-blue-600 mt-1">
                  {orderSuccess.orderNumber}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Expected Delivery</p>
                <p data-testid="expected-date" className="font-semibold text-gray-900 text-lg mt-1">
                  {orderSuccess.expectedDate}
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-center gap-3">
              <Button
                onClick={() => router.push("/customer/orders")}
                variant="outline"
                className="h-11 px-6"
              >
                View My Orders
              </Button>
              <Button
                onClick={() => router.push("/customer")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11 px-6 shadow-md"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    const area = getSelectedArea();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>{" "}
                <span className="font-medium">{customerName}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>{" "}
                <span className="font-medium">{customerEmail}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>{" "}
                <span className="font-medium">{customerPhone}</span>
              </div>
              {dob && (
                <div>
                  <span className="text-gray-500">DOB:</span>{" "}
                  <span className="font-medium">{dob}</span>
                </div>
              )}
              {gender && (
                <div>
                  <span className="text-gray-500">Gender:</span>{" "}
                  <span className="font-medium">{gender}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">ID Type:</span>{" "}
                <span className="font-medium">{idType}</span>
              </div>
              <div>
                <span className="text-gray-500">ID Number:</span>{" "}
                <span className="font-medium">{idNumber}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Address:</span>{" "}
                <span className="font-medium">{customerAddress}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Service Location */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Service Location
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">State:</span>{" "}
                <span className="font-medium">{selectedState}</span>
              </div>
              <div>
                <span className="text-gray-500">City:</span>{" "}
                <span className="font-medium">{selectedCity}</span>
              </div>
              <div>
                <span className="text-gray-500">Area:</span>{" "}
                <span className="font-medium">{area?.area}</span>
              </div>
              <div>
                <span className="text-gray-500">Pincode:</span>{" "}
                <span className="font-medium">{pincode}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Install Address:</span>{" "}
                <span className="font-medium">{installAddress}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Plan */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Selected Plan
            </h3>
            {selectedPlan && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">{selectedPlan.name}</p>
                  <p className="text-sm text-gray-500">{selectedPlan.speed}</p>
                </div>
                <p className="font-bold">₹{selectedPlan.price}/mo</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Schedule */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Installation Schedule
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Preferred Date:</span>{" "}
                <span className="font-medium">{preferredDate}</span>
              </div>
              <div>
                <span className="text-gray-500">Time Slot:</span>{" "}
                <span className="font-medium">{getSlotLabel(preferredSlot)}</span>
              </div>
              {specialInstructions && (
                <div className="col-span-2">
                  <span className="text-gray-500">Special Instructions:</span>{" "}
                  <span className="font-medium">{specialInstructions}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Offer & Pricing */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Pricing
            </h3>
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Base Price</span>
                <span>₹{selectedPlan?.price || 0}/mo</span>
              </div>
              {selectedOffer && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({selectedOffer.name})</span>
                  <span>-₹{getDiscount().toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Final Price</span>
                <span className="text-blue-600">
                  ₹{getFinalPrice().toFixed(2)}/mo
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            data-testid="btn-submit-order"
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Placing Order...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Submit Order
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            New Broadband Connection
          </h1>
          <p className="text-gray-500 mt-1">
            Complete the steps below to place your order
          </p>
        </div>
        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 px-3 py-1" data-testid="step-badge">
          Step {currentStep} of 6
        </Badge>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="transition-all">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
      </div>

      {/* Navigation Buttons */}
      {!orderSuccess && (
        <div className="flex justify-between pt-6 pb-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-testid="btn-back"
            className="flex items-center gap-2 h-11 px-6 border-gray-200 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < 6 && (
            <Button
              onClick={handleNext}
              data-testid="btn-next"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 h-11 px-8 shadow-md shadow-blue-200 hover:shadow-lg transition-all"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
