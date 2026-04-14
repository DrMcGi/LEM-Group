export type PropertyType = "rooms" | "house";

export type RoomAvailability = "available" | "booked" | "maintenance";

export type RoomUnit = {
  id: string;
  roomNumber: string;
  pricePerMonth: number;
  availability: RoomAvailability;
  images: string[];
  description: string;
  features: string[];
  bookingDetails?: {
    bookedUntil?: string;
    tenant?: string;
  };
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
