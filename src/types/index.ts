export type PropertyType = "rooms" | "house";

export type RoomAvailability = "available" | "booked" | "maintenance";

export type RoomTenantDetails = {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  residentialAddress?: string;
  idNumber?: string;
  notes?: string;
};

export type RoomBookingDetails = {
  /** ISO date string (stored as end-of-day UTC for inclusive dates). */
  bookedUntil?: string;

  /** Legacy single-field tenant name (kept for backwards compatibility). */
  tenant?: string;

  /** New full credential set for records and reporting. */
  tenantDetails?: RoomTenantDetails;

  /** Signed lease agreement PDF (Blob URL or proxied URL). */
  leaseAgreementUrl?: string;
};

export type RoomUnit = {
  id: string;
  roomNumber: string;
  pricePerMonth: number;
  availability: RoomAvailability;
  images: string[];
  description: string;
  features: string[];
  bookingDetails?: RoomBookingDetails;

  /** Archived last booking (auto-filled when a booking expires and the room becomes available again). */
  lastBookingDetails?: RoomBookingDetails;
};

export type Property = {
  id: string;
  type: PropertyType;
  name: string;
  pricePerMonth: number;
  summary: string;
  location: {
    street: string;
    unit: string;
    city: string;
  };
  details: string[];
  highlights: string[];
  description: string;
  images: string[];
  rooms?: RoomUnit[];
  directionsUrl?: string;
  mapEmbedUrl?: string;
};

export type InquiryInput = {
  fullName: string;
  phoneNumber: string;
  email: string;
  propertyId: string;
  message: string;
};

export type EnquiryInput = InquiryInput;

export type InquiryRecord = InquiryInput & {
  id: string;
  createdAt: string;
  status: "new" | "contacted" | "archived";
  updatedAt?: string;
};

export type EnquiryRecord = InquiryRecord;

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  disabled?: boolean;
};
