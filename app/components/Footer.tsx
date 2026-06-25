import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-base font-bold text-foreground">E-Book Library</span>
            </Link>
            <p className="text-sm text-secondary leading-relaxed max-w-xs">
              A modern multi-role digital book marketplace. Buy, rent, and manage books with an elegant, role-based platform.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5">
              <li><Link href="/customer/books" className="text-sm text-secondary hover:text-primary transition-colors">Browse Books</Link></li>
              <li><Link href="/customer/transactions" className="text-sm text-secondary hover:text-primary transition-colors">My Purchases</Link></li>
              <li><Link href="/profile" className="text-sm text-secondary hover:text-primary transition-colors">Profile</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Contact</h3>
            <ul className="space-y-2.5 text-sm text-secondary">
              <li>support@ebooklibrary.com</li>
              <li>123 Library Street</li>
              <li>Book City, BC 10001</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} E-Book Library. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
