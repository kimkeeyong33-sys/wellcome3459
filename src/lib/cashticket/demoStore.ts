// Supabase 미설정(.env.local 없음) 상태에서 로컬 개발 서버로 전체 흐름을
// 미리 확인해볼 수 있도록 하는 메모리 임시 저장소입니다. 서버 프로세스가
// 재시작되면 초기화되며, 실제 서비스에서는 사용되지 않습니다(Supabase 설정 시
// 각 API 라우트가 자동으로 Supabase를 사용합니다).
import { generateTicketCode } from "./code";

export type DemoStoreRow = {
  id: string;
  ownerName: string;
  storeName: string;
  phone: string;
  pin: string;
  category?: string;
  businessNumber?: string;
  businessVerified: boolean;
  address?: string;
  businessHours?: string;
  publicPhone?: string;
};

export type DemoProductRow = {
  id: string;
  storeId: string;
  name: string;
  price: number;
  sortOrder: number;
  createdAt: string;
};

export type DemoTicketRow = {
  id: string;
  code: string;
  storeId: string;
  storeName: string;
  issuedAmount: number;
  balance: number;
  memo?: string;
  parentTicketId?: string;
  status: "active" | "used" | "expired";
  expiresAt: string;
  createdAt: string;
};

export type DemoTxRow = {
  id: string;
  ticketId: string;
  type: "issue" | "use" | "gift_out" | "gift_in";
  amount: number;
  memo?: string;
  createdAt: string;
};

export type DemoPaymentRequestRow = {
  id: string;
  code: string;
  storeId: string;
  storeName: string;
  amount: number;
  validDays: number;
  memo?: string;
  status: "pending" | "paid" | "canceled";
  ticketCode?: string;
  createdAt: string;
};

type DemoDB = {
  stores: Map<string, DemoStoreRow>;
  tickets: Map<string, DemoTicketRow>; // key: code
  transactions: DemoTxRow[];
  paymentRequests: Map<string, DemoPaymentRequestRow>; // key: code
  products: Map<string, DemoProductRow>; // key: id
};

const g = globalThis as unknown as { __ctDemoDB?: DemoDB };

function db(): DemoDB {
  if (!g.__ctDemoDB) {
    g.__ctDemoDB = {
      stores: new Map(),
      tickets: new Map(),
      transactions: [],
      paymentRequests: new Map(),
      products: new Map(),
    };
  }
  return g.__ctDemoDB;
}

let seq = 1;
function nextId(prefix: string) {
  return `demo-${prefix}-${seq++}`;
}

export function demoCreateStore(
  input: Omit<DemoStoreRow, "id" | "businessVerified">
): DemoStoreRow {
  const { stores } = db();
  const existing = [...stores.values()].find((s) => s.phone === input.phone);
  if (existing) throw new Error("이미 등록된 전화번호예요. 로그인을 이용해주세요.");
  const row: DemoStoreRow = { id: nextId("store"), businessVerified: false, ...input };
  stores.set(row.id, row);
  return row;
}

export function demoSetBusinessVerified(storeId: string, verified: boolean) {
  const store = db().stores.get(storeId);
  if (store) store.businessVerified = verified;
}

export function demoUpdateStoreInfo(
  storeId: string,
  input: { address?: string; businessHours?: string; publicPhone?: string }
): DemoStoreRow | undefined {
  const store = db().stores.get(storeId);
  if (!store) return undefined;
  Object.assign(store, input);
  return store;
}

export function demoFindStoreByPhone(phone: string): DemoStoreRow | undefined {
  return [...db().stores.values()].find((s) => s.phone === phone);
}

export function demoGetStore(storeId: string): DemoStoreRow | undefined {
  return db().stores.get(storeId);
}

export function demoIssueTicket(input: {
  storeId: string;
  storeName: string;
  amount: number;
  validDays: number;
  memo?: string;
}): DemoTicketRow {
  const { tickets, transactions } = db();
  let code = generateTicketCode();
  while (tickets.has(code)) code = generateTicketCode();

  const now = new Date();
  const expires = new Date(now.getTime() + input.validDays * 24 * 60 * 60 * 1000);
  const row: DemoTicketRow = {
    id: nextId("ticket"),
    code,
    storeId: input.storeId,
    storeName: input.storeName,
    issuedAmount: input.amount,
    balance: input.amount,
    memo: input.memo,
    status: "active",
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
  };
  tickets.set(code, row);
  transactions.push({
    id: nextId("tx"),
    ticketId: row.id,
    type: "issue",
    amount: input.amount,
    createdAt: now.toISOString(),
  });
  return row;
}

export function demoGetTicket(code: string): DemoTicketRow | undefined {
  return db().tickets.get(code.toUpperCase());
}

export function demoGetTransactions(ticketId: string): DemoTxRow[] {
  return db()
    .transactions.filter((t) => t.ticketId === ticketId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function demoRedeem(code: string, amount: number): DemoTicketRow {
  const ticket = demoGetTicket(code);
  if (!ticket) throw new Error("티켓을 찾을 수 없어요.");
  if (ticket.status !== "active") throw new Error("이미 다 쓴 티켓이에요.");
  if (new Date(ticket.expiresAt).getTime() < Date.now()) throw new Error("유효기간이 지난 티켓이에요.");
  if (amount <= 0 || amount > ticket.balance) throw new Error("사용 금액이 남은 잔액보다 많아요.");

  ticket.balance -= amount;
  if (ticket.balance === 0) ticket.status = "used";
  db().transactions.push({
    id: nextId("tx"),
    ticketId: ticket.id,
    type: "use",
    amount,
    createdAt: new Date().toISOString(),
  });
  return ticket;
}

export function demoGift(code: string, amount: number): DemoTicketRow {
  const parent = demoGetTicket(code);
  if (!parent) throw new Error("티켓을 찾을 수 없어요.");
  if (parent.status !== "active") throw new Error("이미 다 쓴 티켓이에요.");
  if (amount <= 0 || amount > parent.balance) throw new Error("선물할 금액이 남은 잔액보다 많아요.");

  const { tickets, transactions } = db();
  let code2 = generateTicketCode();
  while (tickets.has(code2)) code2 = generateTicketCode();

  const now = new Date();
  const child: DemoTicketRow = {
    id: nextId("ticket"),
    code: code2,
    storeId: parent.storeId,
    storeName: parent.storeName,
    issuedAmount: amount,
    balance: amount,
    parentTicketId: parent.id,
    status: "active",
    expiresAt: parent.expiresAt,
    createdAt: now.toISOString(),
  };
  tickets.set(code2, child);

  parent.balance -= amount;
  if (parent.balance === 0) parent.status = "used";

  transactions.push(
    { id: nextId("tx"), ticketId: parent.id, type: "gift_out", amount, createdAt: now.toISOString() },
    { id: nextId("tx"), ticketId: child.id, type: "gift_in", amount, createdAt: now.toISOString() }
  );

  return child;
}

export function demoCreatePaymentRequest(input: {
  storeId: string;
  storeName: string;
  amount: number;
  validDays: number;
  memo?: string;
}): DemoPaymentRequestRow {
  const { paymentRequests } = db();
  let code = generateTicketCode();
  while (paymentRequests.has(code)) code = generateTicketCode();

  const row: DemoPaymentRequestRow = {
    id: nextId("pay"),
    code,
    storeId: input.storeId,
    storeName: input.storeName,
    amount: input.amount,
    validDays: input.validDays,
    memo: input.memo,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  paymentRequests.set(code, row);
  return row;
}

export function demoGetPaymentRequest(code: string): DemoPaymentRequestRow | undefined {
  return db().paymentRequests.get(code.toUpperCase());
}

// 데모 모드: 실제 결제 없이 즉시 "결제완료" 처리하고 티켓을 발급합니다.
export function demoConfirmPaymentRequest(code: string): DemoPaymentRequestRow {
  const req = demoGetPaymentRequest(code);
  if (!req) throw new Error("결제 요청을 찾을 수 없어요.");
  if (req.status !== "pending") {
    if (req.status === "paid" && req.ticketCode) return req; // 멱등 처리
    throw new Error("이미 취소된 결제 요청이에요.");
  }

  const ticket = demoIssueTicket({
    storeId: req.storeId,
    storeName: req.storeName,
    amount: req.amount,
    validDays: req.validDays,
    memo: req.memo,
  });

  req.status = "paid";
  req.ticketCode = ticket.code;
  return req;
}

export function demoDashboard(storeId: string) {
  const { tickets, transactions } = db();
  const storeTickets = [...tickets.values()].filter((t) => t.storeId === storeId);
  const ticketIds = new Set(storeTickets.map((t) => t.id));
  const storeTx = transactions.filter((t) => ticketIds.has(t.ticketId));

  const issuedTotal = storeTx.filter((t) => t.type === "issue").reduce((s, t) => s + t.amount, 0);
  const usedTotal = storeTx.filter((t) => t.type === "use").reduce((s, t) => s + t.amount, 0);
  const unusedBalance = storeTickets
    .filter((t) => t.status === "active")
    .reduce((s, t) => s + t.balance, 0);

  const recent = [...storeTx]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 20)
    .map((t) => ({
      ...t,
      ticketCode: [...tickets.values()].find((tk) => tk.id === t.ticketId)?.code ?? "",
    }));

  return { issuedTotal, usedTotal, unusedBalance, ticketCount: storeTickets.length, recent };
}

export function demoListProducts(storeId: string): DemoProductRow[] {
  return [...db().products.values()]
    .filter((p) => p.storeId === storeId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function demoCreateProduct(input: { storeId: string; name: string; price: number }): DemoProductRow {
  const { products } = db();
  const sortOrder = demoListProducts(input.storeId).length;
  const row: DemoProductRow = {
    id: nextId("product"),
    storeId: input.storeId,
    name: input.name,
    price: input.price,
    sortOrder,
    createdAt: new Date().toISOString(),
  };
  products.set(row.id, row);
  return row;
}

export function demoDeleteProduct(storeId: string, productId: string) {
  const { products } = db();
  const product = products.get(productId);
  if (product && product.storeId === storeId) products.delete(productId);
}
