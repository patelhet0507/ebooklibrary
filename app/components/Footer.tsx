import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-foreground mb-3">E-Book Library</h3>
            <p className="text-sm text-secondary">Your destination for buying and renting digital books. Read anywhere, anytime.</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link href="/customer/books" className="hover:text-primary transition-colors">Browse Books</Link></li>
              <li><Link href="/customer/transactions" className="hover:text-primary transition-colors">My Transactions</Link></li>
              <li><Link href="/profile" className="hover:text-primary transition-colors">Profile</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Contact</h3>
            <p className="text-sm text-secondary">support@ebooklibrary.com</p>
            <p className="text-sm text-secondary">123 Library Street, Book City</p>
          </div>
        </div>
        <div className="border-t border-border mt-6 pt-6 text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} E-Book Library. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
