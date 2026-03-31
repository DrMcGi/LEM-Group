import { properties, propertyMap } from "@/data/properties";
import { ImageGallery } from "@/components/image-gallery";
import { RoomCard } from "@/components/room-card";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type PropertyDetailPageProps = {
  params: Promise<{
    propertyId: string;
  }>;
};

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

export async function generateMetadata({ params }: PropertyDetailPageProps) {
  const { propertyId } = await params;
  const property = propertyMap.get(propertyId);

  if (!property) {
    return { title: "Property Not Found" };
  }

  return {
    title: `${property.name} | LEM Accommodation`,
    description: property.summary,
  };
}

export async function generateStaticParams() {
  return properties.map((property) => ({
    propertyId: property.id,
  }));
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { propertyId } = await params;
  const property = propertyMap.get(propertyId);

  if (!property) {
    notFound();
  }

  const availableRooms = property.rooms?.filter((room) => room.availability === "available").length ?? 0;
  const bookedRooms = property.rooms?.filter((room) => room.availability === "booked").length ?? 0;

  return (
    <main className="relative isolate overflow-x-hidden">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="text-sm font-semibold text-teal-700 transition hover:text-teal-900 flex items-center gap-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Listings
          </Link>

          <div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-white/90 px-3 py-2 shadow-sm">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-teal-200 bg-white">
              <Image
                src="/images/LEM_Logo.png"
                alt="LEM Accommodation"
                fill
                sizes="40px"
                className="object-contain p-1"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-teal-700">Verified Listing</p>
              <p className="text-xs font-semibold text-stone-900">LEM Accommodation</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white/90 p-4 shadow-lg sm:p-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2 space-y-8">
              <ImageGallery images={property.images} title={property.name} />

              <div>
                <h1 className="break-words text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{property.name}</h1>
                <p className="mt-2 text-stone-600">
                  {property.location.unit}, {property.location.street}, {property.location.city}
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-stone-900">About This Property</h2>
                <p className="mt-3 text-lg leading-relaxed text-stone-700">{property.description}</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-stone-900">Key Features</h2>
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {property.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-stone-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {property.mapEmbedUrl && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Location &amp; Directions</h2>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
                    <iframe
                      src={property.mapEmbedUrl}
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map showing location of ${property.name}`}
                    />
                  </div>
                  {property.directionsUrl && (
                    <a
                      href={property.directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Get Directions on Google Maps
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-4 lg:sticky lg:top-8 h-fit">
              <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6">
                <div className="mb-4">
                  <div className="text-sm text-teal-700 font-semibold">Starting from</div>
                  <div className="text-3xl font-bold text-teal-900 mt-1">
                    {currency.format(property.pricePerMonth)}
                  </div>
                  <div className="text-sm text-teal-700 mt-1">per month</div>
                </div>

                {property.rooms && (
                  <div className="space-y-3 border-t border-teal-200 pt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-teal-800">Available Units:</span>
                      <span className="font-bold text-emerald-600">{availableRooms}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-teal-800">Booked Units:</span>
                      <span className="font-bold text-red-600">{bookedRooms}</span>
                    </div>
                    <div className="text-xs text-teal-700 pt-2">
                      Total {property.rooms.length} {property.type === "rooms" ? "rooms" : "bedroom(s)"}
                    </div>
                  </div>
                )}

                <Link
                  href="/#inquire"
                  className="mt-6 block w-full rounded-xl bg-teal-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-teal-800"
                >
                  Submit Inquiry
                </Link>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-600 space-y-2">
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-stone-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21l-7-5m0 0l-7 5m7-5v-9l9-5m-9 5l-9-5"
                    />
                  </svg>
                  <span>Contact us for bookings, viewings, or special requests</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {property.rooms && property.rooms.length > 0 && (
          <section className="mt-12">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 mb-6">
              {property.type === "rooms" ? "Available Rooms" : "Bedrooms & Spaces"}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {property.rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  formattedPrice={currency.format(room.pricePerMonth)}
                  propertyName={property.name}
                />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
