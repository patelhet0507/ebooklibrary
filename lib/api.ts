const API_BASE_URL = "/api";

export type UserRole = "SELLER" | "CUSTOMER" | "MODERATOR";
export type TransactionType = "PURCHASE" | "RENT" | "RETURN";
export type FineStatus = "PENDING" | "PAID" | "WAIVED";
export type PaymentMethod = "UPI" | "BANK" | "COD";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  xp: number;
  level: number;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  slug?: string;
  description?: string;
  language?: string;
  genre?: string;
  cover_image?: string;
  price: number;
  rental_price_per_day?: number;
  stock: number;
  seller_id: string;
  images: BookImage[];
  created_at: string;
  updated_at?: string;
  avg_rating?: number;
  review_count?: number;
}

export interface BookImage {
  id: string;
  book_id: string;
  url: string;
  is_primary: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  book_id: string;
  customer_id: string;
  type: TransactionType;
  quantity: number;
  total_amount: number;
  rental_days?: number;
  due_date?: string;
  returned_at?: string;
  return_requested_at?: string;
  payment_id?: string;
  created_at: string;
}

export interface Fine {
  id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  days_late: number;
  status: FineStatus;
  created_at: string;
  paid_at?: string;
}

export interface Review {
  id: string;
  book_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface SellerContact {
  name: string;
  email: string;
}

export interface ReturnRequest {
  id: string;
  book_id: string;
  book_title: string;
  customer_id: string;
  customer_name: string;
  type: TransactionType;
  quantity: number;
  total_amount: number;
  rental_days?: number;
  due_date?: string;
  return_requested_at?: string;
  returned_at?: string;
  created_at: string;
}

export interface Invoice {
  payment: Payment;
  transaction: Transaction;
  book: Book;
  user_name: string;
  user_email: string;
  seller_name: string;
  seller_email: string;
}

export interface Commission {
  id: string;
  seller_id: string;
  amount: number;
  percentage: number;
  description?: string;
  created_at: string;
}

export interface DashboardStats {
  total_earnings: number;
  total_sales: number;
  pending_fines: number;
  active_returns: number;
}

export interface SellerEarnings {
  period: string;
  earnings: number;
  sales_count: number;
  commission_paid: number;
}

export interface TopSeller {
  seller_id: string;
  seller_name: string;
  total_sales: number;
  books_sold: number;
}

export interface CustomerDashboard {
  total_spent: number;
  total_purchases: number;
  books_returned: number;
  pending_fines: number;
  owned_books: number;
  active_rentals: number;
  overdue_rentals: number;
  xp: number;
  level: number;
}

export interface Payment {
  id: string;
  transaction_id: string;
  user_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  upi_id?: string;
  bank_name?: string;
  delivery_name?: string;
  delivery_phone?: string;
  delivery_address?: string;
  created_at: string;
}

export interface UserProfileUpdate {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface PaymentCreate {
  transaction_id: string;
  method: PaymentMethod;
  upi_id?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  delivery_name?: string;
  delivery_phone?: string;
  delivery_address?: string;
}

export interface ModeratorDashboard {
  total_earnings: number;
  total_sales: number;
  pending_fines: number;
  active_returns: number;
  total_books: number;
  total_users: number;
  total_sellers: number;
  total_customers: number;
  total_commission: number;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface BookCreate {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  language?: string;
  genres?: string[];
  cover_image?: string;
  price: number;
  rental_price_per_day?: number;
  stock: number;
}

export interface BookUpdate {
  title?: string;
  author?: string;
  isbn?: string;
  description?: string;
  language?: string;
  genres?: string[];
  cover_image?: string;
  price?: number;
  rental_price_per_day?: number;
  stock?: number;
}

export interface RentCreate {
  book_id: string;
  quantity: number;
  type: "RENT";
  rental_days: number;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "An error occurred" }));
    const message = error.detail || error.message || `HTTP ${res.status}: ${res.statusText}`;
    console.error("API Error:", { status: res.status, error, endpoint });
    throw new Error(message);
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}

export const api = {
  auth: {
    register: (data: UserCreate) =>
      fetchApi<User>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      fetchApi<User>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  },
  
  books: {
    list: (params?: { search?: string; genre?: string; language?: string; skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.genre) searchParams.set("genre", params.genre);
      if (params?.language) searchParams.set("language", params.language);
      if (params?.skip) searchParams.set("skip", params.skip.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      const query = searchParams.toString();
      return fetchApi<Book[]>(`/books${query ? `?${query}` : ""}`);
    },
    search: (params?: {
      q?: string;
      author?: string;
      language?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      genre?: string;
      skip?: number;
      limit?: number;
      sortBy?: "relevance" | "price_asc" | "price_desc" | "rating" | "newest" | "popular";
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set("q", params.q);
      if (params?.author) searchParams.set("author", params.author);
      if (params?.language) searchParams.set("language", params.language);
      if (params?.minPrice) searchParams.set("minPrice", params.minPrice.toString());
      if (params?.maxPrice) searchParams.set("maxPrice", params.maxPrice.toString());
      if (params?.minRating) searchParams.set("minRating", params.minRating.toString());
      if (params?.genre) searchParams.set("genre", params.genre);
      if (params?.skip) searchParams.set("skip", params.skip.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
      const query = searchParams.toString();
      return fetchApi<{ books: Book[]; total: number; skip: number; limit: number }>(`/books/search${query ? `?${query}` : ""}`);
    },
    get: (id: string) => fetchApi<Book>(`/books/${id}`),
    getBySlug: (slug: string) => fetchApi<Book>(`/books/slug/${slug}`),
    getSeller: (bookId: string) => fetchApi<SellerContact>(`/books/${bookId}/seller`),
    getGenres: () => fetchApi<string[]>("/books/genres"),
    getLanguages: () => fetchApi<string[]>("/books/languages"),
    getImages: (bookId: string) => fetchApi<BookImage[]>(`/books/${bookId}/images`),
    addImage: (bookId: string, data: { url: string }) =>
      fetchApi<BookImage>(`/books/${bookId}/images`, { method: "POST", body: JSON.stringify(data) }),
    deleteImage: (bookId: string, imageId: string) =>
      fetchApi<void>(`/books/${bookId}/images/${imageId}`, { method: "DELETE" }),
    setPrimaryImage: (bookId: string, imageId: string) =>
      fetchApi<BookImage>(`/books/${bookId}/images/${imageId}/primary`, { method: "PUT" }),
  },
  
  reviews: {
    list: (bookId: string) => fetchApi<Review[]>(`/books/${bookId}/reviews`),
    create: (bookId: string, userId: string, data: { rating: number; comment?: string }) =>
      fetchApi<Review>(`/books/${bookId}/reviews?user_id=${userId}`, { method: "POST", body: JSON.stringify(data) }),
  },
  
  seller: {
    getBooks: (sellerId: string) =>
      fetchApi<Book[]>(`/seller/${sellerId}/books`),
    createBook: (sellerId: string, data: BookCreate) =>
      fetchApi<Book>(`/seller/${sellerId}/books`, { method: "POST", body: JSON.stringify(data) }),
    updateBook: (sellerId: string, bookId: string, data: BookUpdate) =>
      fetchApi<Book>(`/seller/${sellerId}/books/${bookId}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteBook: (sellerId: string, bookId: string) =>
      fetchApi<void>(`/seller/${sellerId}/books/${bookId}`, { method: "DELETE" }),
    updateStock: (sellerId: string, bookId: string, data: { quantity: number; reason: string }) =>
      fetchApi<{ new_stock: number }>(`/seller/${sellerId}/books/${bookId}/stock`, { method: "PUT", body: JSON.stringify(data) }),
    getEarnings: (sellerId: string, period: string = "week") =>
      fetchApi<SellerEarnings[]>(`/seller/${sellerId}/earnings?period=${period}`),
    getDashboard: (sellerId: string) =>
      fetchApi<DashboardStats>(`/seller/${sellerId}/dashboard`),
    getReturnRequests: (sellerId: string) =>
      fetchApi<ReturnRequest[]>(`/seller/${sellerId}/return-requests`),
    approveReturn: (sellerId: string, transactionId: string) =>
      fetchApi<Transaction>(`/seller/${sellerId}/return/${transactionId}/approve`, { method: "POST" }),
    rejectReturn: (sellerId: string, transactionId: string, reason: string) =>
      fetchApi<{ message: string }>(`/seller/${sellerId}/return/${transactionId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
  },
  
  customer: {
    purchase: (customerId: string, data: { book_id: string; quantity: number }) =>
      fetchApi<Transaction>(`/customer/${customerId}/purchase`, { method: "POST", body: JSON.stringify(data) }),
    rent: (customerId: string, data: RentCreate) =>
      fetchApi<Transaction>(`/customer/${customerId}/rent`, { method: "POST", body: JSON.stringify(data) }),
    returnBook: (customerId: string, transactionId: string) =>
      fetchApi<Transaction>(`/customer/${customerId}/return/${transactionId}`, { method: "POST" }),
    getTransactions: (customerId: string) =>
      fetchApi<Transaction[]>(`/customer/${customerId}/transactions`),
    getFines: (customerId: string) =>
      fetchApi<Fine[]>(`/customer/${customerId}/fines`),
    payFine: (customerId: string, fineId: string) =>
      fetchApi<{ message: string }>(`/customer/${customerId}/fines/${fineId}/pay`, { method: "PUT" }),
    getDashboard: (customerId: string) =>
      fetchApi<CustomerDashboard>(`/customer/${customerId}/dashboard`),
    wishlist: {
      get: (customerId: string) =>
        fetchApi<{ book: Book }[]>(`/customer/${customerId}/wishlist`),
      add: (customerId: string, bookId: string) =>
        fetchApi<{ book: Book }>(`/customer/${customerId}/wishlist`, { method: "POST", body: JSON.stringify({ book_id: bookId }) }),
      remove: (customerId: string, bookId: string) =>
        fetchApi<void>(`/customer/${customerId}/wishlist/${bookId}`, { method: "DELETE" }),
    },
    notifications: {
      get: (customerId: string, params?: { unread?: boolean; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.unread) searchParams.set("unread", "true");
        if (params?.limit) searchParams.set("limit", params.limit.toString());
        const query = searchParams.toString();
        return fetchApi<{ notifications: any[]; unreadCount: number }>(`/customer/${customerId}/notifications${query ? `?${query}` : ""}`);
      },
    },
    markNotificationRead: (notificationId: string) =>
      fetchApi<any>(`/notifications/${notificationId}/read`, { method: "PUT" }),
  },
  
  profile: {
    get: (userId: string) =>
      fetchApi<User>(`/profile/${userId}`),
    update: (userId: string, data: UserProfileUpdate) =>
      fetchApi<User>(`/profile/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  
  payments: {
    create: (data: PaymentCreate) =>
      fetchApi<Payment>("/payments", { method: "POST", body: JSON.stringify(data) }),
    getUserPayments: (userId: string) =>
      fetchApi<Payment[]>(`/payments/user/${userId}`),
    get: (paymentId: string) =>
      fetchApi<Payment>(`/payments/${paymentId}`),
    getInvoice: (paymentId: string) =>
      fetchApi<Invoice>(`/payments/${paymentId}/invoice`),
  },
  
  moderator: {
    getBooks: (params?: { search?: string; skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.skip) searchParams.set("skip", params.skip.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      const query = searchParams.toString();
      return fetchApi<Book[]>(`/moderator/books${query ? `?${query}` : ""}`);
    },
    createBook: (data: BookCreate) =>
      fetchApi<Book>("/moderator/books", { method: "POST", body: JSON.stringify(data) }),
    updateBook: (bookId: string, data: BookUpdate) =>
      fetchApi<Book>(`/moderator/books/${bookId}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteBook: (bookId: string) =>
      fetchApi<void>(`/moderator/books/${bookId}`, { method: "DELETE" }),
    getUsers: (params?: { search?: string; role?: UserRole }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.role) searchParams.set("role", params.role);
      const query = searchParams.toString();
      return fetchApi<User[]>(`/moderator/users${query ? `?${query}` : ""}`);
    },
    changeUserRole: (userId: string, role: UserRole) =>
      fetchApi<{ message: string }>(`/moderator/users/${userId}/role?role=${role}`, { method: "PUT" }),
    deleteUser: (userId: string) =>
      fetchApi<void>(`/moderator/users/${userId}`, { method: "DELETE" }),
    getPendingReturns: () =>
      fetchApi<ReturnRequest[]>("/moderator/returns"),
    getCompletedReturns: () =>
      fetchApi<ReturnRequest[]>("/moderator/returns/completed"),
    approveReturn: (transactionId: string) =>
      fetchApi<Transaction>(`/moderator/return/${transactionId}/approve`, { method: "POST" }),
    rejectReturn: (transactionId: string, reason: string) =>
      fetchApi<{ message: string }>(`/moderator/return/${transactionId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    getFines: (status?: FineStatus) =>
      fetchApi<Fine[]>(`/moderator/fines${status ? `?status=${status}` : ""}`),
    waiveFine: (fineId: string) =>
      fetchApi<{ message: string }>(`/moderator/fines/${fineId}/waive`, { method: "PUT" }),
    getTopSellers: (period: string = "week", limit: number = 10) =>
      fetchApi<TopSeller[]>(`/moderator/top-sellers?period=${period}&limit=${limit}`),
    getDashboard: () =>
      fetchApi<ModeratorDashboard>("/moderator/dashboard"),
    coupons: {
      list: (params?: { skip?: number; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.skip) searchParams.set("skip", params.skip.toString());
        if (params?.limit) searchParams.set("limit", params.limit.toString());
        const query = searchParams.toString();
        return fetchApi<{ coupons: any[]; total: number; skip: number; limit: number }>(`/moderator/coupons${query ? `?${query}` : ""}`);
      },
      create: (data: any) =>
        fetchApi<any>("/moderator/coupons", { method: "POST", body: JSON.stringify(data) }),
      get: (id: string) =>
        fetchApi<any>(`/moderator/coupons/${id}`),
      update: (id: string, data: any) =>
        fetchApi<any>(`/moderator/coupons/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      delete: (id: string) =>
        fetchApi<void>(`/moderator/coupons/${id}`, { method: "DELETE" }),
    },
    analytics: {
      get: (period?: string) =>
        fetchApi<any>(`/moderator/analytics${period ? `?period=${period}` : ""}`),
      overview: () =>
        fetchApi<any>("/moderator/analytics/overview"),
      revenue: (period?: string) =>
        fetchApi<any>(`/moderator/analytics/revenue${period ? `?period=${period}` : ""}`),
      users: (period?: string) =>
        fetchApi<any>(`/moderator/analytics/users${period ? `?period=${period}` : ""}`),
      topBooks: (limit?: number) =>
        fetchApi<any>(`/moderator/analytics/top-books${limit ? `?limit=${limit}` : ""}`),
      churn: (period?: string) =>
        fetchApi<any>(`/moderator/analytics/churn${period ? `?period=${period}` : ""}`),
    },
  },
};
