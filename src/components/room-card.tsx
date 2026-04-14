"use client";

import { RoomUnit } from "@/types";
import { useState } from "react";
import { ImageGallery } from "./image-gallery";
import { resolveBlobUrl } from "@/lib/blob-url";

type RoomCardProps = {
  room: RoomUnit;
  formattedPrice: string;
  propertyName: string;
};

const WHATSAPP_NUMBER = "27764807410";

export function RoomCard({ room, formattedPrice, propertyName }: RoomCardProps) {
  const [expanded, setExpanded] = useState(false);

  const availabilityConfig = {
    available: { label: "Available", color: "bg-emerald-100 text-emerald-800", badge: "bg-emerald-500" },
    booked: { label: "Booked", color: "bg-red-100 text-red-800", badge: "bg-red-500" },
    maintenance: { label: "Maintenance", color: "bg-amber-100 text-amber-800", badge: "bg-amber-500" },
  };

  const config = availabilityConfig[room.availability];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-stone-900">{room.roomNumber}</h3>
            <p className="text-sm text-stone-600">{room.description}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.color}`}>
            {config.label}
          </span>
        </div>

        <div className="text-2xl font-bold text-amber-700">
          {formattedPrice} / month
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-xl bg-stone-100">
          {room.images.length > 0 ? (
            <div className="relative h-full w-full bg-stone-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveBlobUrl(room.images[0])}
                alt={room.roomNumber}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='18' fill='%239ca3af' text-anchor='middle' dy='.3em'%3ENo image available%3C/text%3E%3C/svg%3E`;
                }}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-stone-500">
              No image
            </div>
          )}
        </div>

        <ul className="space-y-2">
          {room.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-stone-700">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>

        {room.availability === "booked" && room.bookingDetails && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">Currently booked</p>
            {room.bookingDetails.bookedUntil && (
              <p className="text-red-700">Booked until {new Date(room.bookingDetails.bookedUntil).toLocaleDateString()}</p>
            )}
          </div>
        )}

        {room.availability === "maintenance" && room.bookingDetails?.bookedUntil && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">Maintenance Schedule</p>
            <p>Expected return: {new Date(room.bookingDetails.bookedUntil).toLocaleDateString()}</p>
          </div>
        )}

        {room.availability === "available" && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              [
                "Hello LEM Accommodation, I would like to book a room:",
                "",
                `Property: ${propertyName}`,
                `Room: ${room.roomNumber}`,
                `Price: ${formattedPrice} / month`,
                "",
                "Please share the next steps for booking.",
              ].join("\n"),
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Make Booking on WhatsApp
          </a>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full rounded-lg border border-teal-300 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
        >
          {expanded ? "Hide" : "View"} All Photos ({room.images.length})
        </button>

        {expanded && room.images.length > 0 && (
          <div className="mt-4 border-t border-stone-200 pt-4">
            <ImageGallery images={room.images} title={room.roomNumber} />
          </div>
        )}
      </div>
    </div>
  );
}
