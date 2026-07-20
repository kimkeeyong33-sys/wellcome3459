export type AuctionStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "ENDED" | "CANCELLED";

export interface AuctionListItem {
  id: string;
  title: string;
  images: string[];
  startPrice: string;
  currentPrice: string;
  buyNowPrice: string | null;
  quantity: number;
  unit: string;
  startAt: string;
  endAt: string;
  status: AuctionStatus;
  category: { id: string; name: string } | null;
  seller: { id: string; name: string; company: { name: string } | null };
  _count: { bids: number };
}

export interface BidItem {
  id: string;
  amount: string;
  createdAt: string;
  bidder: { id: string; name: string };
}

export interface AuctionDetail extends AuctionListItem {
  description: string;
  minIncrement: string;
  winner: { id: string; name: string } | null;
  bids: BidItem[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "BUYER" | "SELLER" | "ADMIN";
  company?: { id: string; name: string; verified: boolean } | null;
}
