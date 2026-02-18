export interface Order {
  orderId: string;
  orderNumber: string;
  customerName : string;
  customerEmail : string;
  customerPhone : string;
  customerPostCode : string;
  eventId : string;
  eventName : string;
  eventDate?: Date;
  venue : string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
  seats: OrderSeatDto[];
  qrCodeData :string;
  subtotal: number;
  serviceFee: number;
  serviceFeeType: string;
  serviceFeeValue: number;
  couponCode : string;
  couponDiscount : number;
  discount: number;
  totalDiscount: number;  
  totalAmount: number;
}

export interface OrderSeatDto{
    seatId: string;
    seatNumber: string;
    sectionName: string ;
    price: number;
    ticketNumber: string;
    isCheckedIn: boolean;
    checkedInAt?: string;
    checkedInBy?: string;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PaymentInfo {
  cardHolder: string;
  cardLastFour?: string;
  paymentMethod: string;
  transactionId?: string;
  stripePaymentIntentId?: string;
}

export interface OrderItem {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  venue: string;
  ticketType: string;
  quantity: number;
  price: number;
  seatInfo?: SeatInfo;
}

export interface SeatInfo {
  section: string;
  row: string;
  number: number;
  type: string;
}

export interface Ticket {
  id: string;
  orderId: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  venue: string;
  type: string;
  price: number;
  quantity: number;
  seatInfo?: SeatInfo;
  status: 'valid' | 'used' | 'cancelled' | 'refunded';
  validUntil: Date;
  qrCode: string;
  createdAt: Date;
}

// For email sending
export interface TicketEmailData {
  order: Order;
  tickets: Ticket[];
  customer: CustomerInfo;
}


export interface CheckinRequest {
  orderId: string;
  staffId: string;
  staffName: string;
  eventId: string;
  notes?: string;
  seatIds ?: string[]; // For partial check-in
}

export interface CheckinResult {
  seatId: string;
  seatNumber: string;
  success: boolean;
  message: string;
  checkedInAt?: string;
  checkedInBy?: string;
}

export interface CheckinResponse {
  success: boolean;
  message?: string;
  data?: {
    orderId: string;
    orderNumber: string;
    checkedInCount: number;
    totalSelected: number;
    results: CheckinResult[];
  };
}