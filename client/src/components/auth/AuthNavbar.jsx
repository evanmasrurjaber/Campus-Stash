import { Link } from 'react-router-dom';

export default function AuthNavbar() {
  return (
    <nav className="fixed top-0 w-full flex justify-between items-center px-6 py-4 z-50 glass-header">
      <Link to="/login" className="text-xl font-extrabold text-primary tracking-tighter font-headline">
        CampusStash
      </Link>
      <div className="flex items-center gap-4">
        <a className="text-sm font-semibold text-primary/60 hover:text-primary transition-colors" href="mailto:support@campusstash.com">
          Help
        </a>
      </div>
    </nav>
  );
}