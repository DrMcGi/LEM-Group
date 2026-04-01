"use client";

import type { Property } from "@/types";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import Link from "next/link";
import type { MouseEvent } from "react";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

type PropertyShowcaseCardProps = {
  property: Property;
};

export function PropertyShowcaseCard({ property }: PropertyShowcaseCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateY, { stiffness: 170, damping: 18, mass: 0.5 });
  const springY = useSpring(rotateX, { stiffness: 170, damping: 18, mass: 0.5 });

  const accentEdge = property.type === "rooms" ? "rgba(20,184,166,0.55)" : "rgba(245,158,11,0.5)";
  const eyebrow = property.type === "rooms" ? "Monthly Rooms" : "Family Home";
  const availableUnits = property.rooms
    ? `${property.rooms.filter((room) => room.availability === "available").length} of ${property.rooms.length} units available`
    : null;

  const handlePointerMove = (event: MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left;
    const offsetY = event.clientY - bounds.top;
    const percentX = offsetX / bounds.width - 0.5;
    const percentY = offsetY / bounds.height - 0.5;

    event.currentTarget.style.setProperty("--pointer-x", `${offsetX}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${offsetY}px`);

    rotateX.set(percentY * -10);
    rotateY.set(percentX * 12);
  };

  const resetRotation = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <Link href={`/properties/${property.id}`} className="block h-full">
      <motion.article
        style={prefersReducedMotion ? undefined : { rotateX: springY, rotateY: springX }}
        whileHover={prefersReducedMotion ? undefined : { y: -12, scale: 1.018 }}
        onMouseMove={handlePointerMove}
        onMouseLeave={resetRotation}
        className={`property-showcase-card group relative h-full overflow-hidden rounded-4xl border border-black/10 bg-white/82 p-6 shadow-lg backdrop-blur ${property.type === "rooms" ? "property-showcase-card-rooms" : "property-showcase-card-house"}`}
      >
        <div className="property-showcase-card-reflection" aria-hidden />

        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
              <h2 className="mt-2 min-h-[4.5rem] text-2xl font-semibold tracking-tight text-stone-900">{property.name}</h2>
            </div>

            <svg className="h-5 w-5 shrink-0 text-teal-600 transition duration-300 group-hover:translate-x-1 group-hover:text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <p className="min-h-[3.5rem] text-sm text-stone-600">
            {property.location.unit}, {property.location.street}, {property.location.city}
          </p>
          <p className="mt-3 text-lg font-bold text-amber-700">{currency.format(property.pricePerMonth)} / month</p>
          <p className="mt-3 min-h-[5.8rem] text-stone-700">{property.summary}</p>

          <ul className="mt-4 min-h-[7.5rem] space-y-2 text-sm text-stone-700">
            {property.details.slice(0, 3).map((detail) => (
              <li key={detail} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-700" aria-hidden />
                {detail}
              </li>
            ))}
            {property.details.length > 3 && <li className="font-semibold text-teal-700">+ {property.details.length - 3} more features</li>}
          </ul>

          <div className="mt-5 flex min-h-[4.5rem] flex-wrap gap-2">
            {property.highlights.map((highlight) => (
              <span key={highlight} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {highlight}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-5">
            <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${accentEdge}, transparent)` }} />

            {availableUnits ? (
              <div className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-xs font-semibold text-teal-800">{availableUnits}</div>
            ) : (
              <div className="mt-4 rounded-xl bg-stone-50 px-4 py-3 text-xs font-semibold text-stone-700">Premium family home in secure estate living</div>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}