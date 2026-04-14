"use client";

import { FormEvent, useMemo, useState } from "react";
import { Property } from "@/types";

type InquiryFormProps = {
  properties: Property[];
};

type FormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
  propertyId: string;
  message: string;
};

const initialState: FormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  propertyId: "",
  message: "",
};

const WHATSAPP_NUMBER = "27764807410";

export function InquiryForm({ properties }: InquiryFormProps) {
  const [form, setForm] = useState<FormState>({
    ...initialState,
    propertyId: properties[0]?.id ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === form.propertyId),
    [form.propertyId, properties],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    try {
      if (!selectedProperty) {
        setStatus("Please select a property before continuing.");
        return;
      }

      const popup = window.open("about:blank", "_blank");
      if (popup) {
        popup.opener = null;
      }

      const whatsappMessage = [
        "Hello LEM Accommodation, I would like to submit an enquiry:",
        "",
        `Full Name: ${form.fullName}`,
        `Phone Number: ${form.phoneNumber}`,
        `Email Address: ${form.email}`,
        `Property: ${selectedProperty.name}`,
        "",
        "Message:",
        form.message,
      ].join("\n");

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

      let savedToPortal = false;
      try {
        const response = await fetch("/api/enquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName,
            phoneNumber: form.phoneNumber,
            email: form.email,
            propertyId: form.propertyId,
            message: form.message,
          }),
        });

        if (response.ok) {
          savedToPortal = true;
        } else {
          const fallback = await fetch("/api/inquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: form.fullName,
              phoneNumber: form.phoneNumber,
              email: form.email,
              propertyId: form.propertyId,
              message: form.message,
            }),
          });
          savedToPortal = fallback.ok;
        }
      } catch {
        savedToPortal = false;
      }

      if (popup) {
        popup.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, "_blank");
      }

      setStatus(
        savedToPortal
          ? "Enquiry submitted. WhatsApp opened with a pre-filled message — please send it to complete your enquiry."
          : "WhatsApp opened with a pre-filled message — please send it to complete your enquiry. (Note: Portal save failed. If you can, try again.)",
      );
      setForm({ ...initialState, propertyId: properties[0]?.id ?? "" });
    } catch {
      setStatus("Could not open WhatsApp. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="enquire" className="rounded-3xl border border-black/10 bg-white/75 p-6 shadow-xl backdrop-blur md:p-8">
      <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Book a Viewing or Ask a Question</h2>
      <p className="mt-2 text-stone-700">
        Tell us which property interests you and we will get back to you quickly.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-stone-800">
          Full Name
          <input
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none ring-offset-2 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/40"
            placeholder="Your name"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-stone-800">
          Phone Number
          <input
            value={form.phoneNumber}
            onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none ring-offset-2 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/40"
            placeholder="e.g. 071 234 5678"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-stone-800">
          Email Address
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none ring-offset-2 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/40"
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-stone-800">
          Property
          <select
            value={form.propertyId}
            onChange={(event) => setForm((prev) => ({ ...prev, propertyId: event.target.value }))}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none ring-offset-2 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/40"
            required
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-stone-800 md:col-span-2">
          Message
          <textarea
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            className="min-h-28 rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none ring-offset-2 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/40"
            placeholder="Tell us when you would like to move in and any preferences"
            required
          />
        </label>

        <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-600">
            Selected: <span className="font-semibold text-stone-900">{selectedProperty?.name}</span>
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Opening..." : "Submit Enquiry on WhatsApp"}
          </button>
        </div>
      </form>

      {status ? <p className="mt-4 text-sm text-stone-700">{status}</p> : null}
    </section>
  );
}

export const EnquiryForm = InquiryForm;
