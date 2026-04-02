// src/components/auth/AuthLayout.jsx
import { Link } from 'react-router-dom';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAImx-F3zteMsQs0jlegeAPE7lFP8gGSSWfgUk86yJabHa-ejqbr4_G6mXzwS2ViNiI3doxB6k9RbmWSJuepv01uqII8tAl2g9FBiefO-akHJ2A22cYpz7Guv8lSY1aF2HwNcjul1AnOaToZ1KkLCDcV6Cxw0VR09JPAcFJHnX08tu2VW1nXfbEpj5O0RODkJ9OOgqiUtke_DQ6KT1qq7Je_LZR_8cxgL3y78yw8z2asg2KEsVMTg3m-Qb33vS9KilP9YfTsSmgkK0';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col page-enter">
      <nav className="fixed top-0 w-full flex justify-between items-center px-6 py-4 z-50 glass-header">
        <Link
          to="/login"
          className="text-xl font-extrabold text-primary tracking-tighter font-headline"
        >
          CampusStash
        </Link>
        <a
          className="text-sm font-semibold text-primary/60 hover:text-primary transition-colors"
          href="mailto:support@campusstash.com"
        >
          Help
        </a>
      </nav>

      <main className="flex-grow flex items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:flex flex-col justify-center space-y-8 pr-12">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-widest rounded-full">
                Curated Marketplace
              </span>
              <h1 className="text-5xl lg:text-6xl font-headline font-extrabold tracking-tight text-primary leading-tight">
                Your campus,
                <br />
                <span className="text-secondary-container">perfectly curated.</span>
              </h1>
              <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
                Join the premier academic community for buying, selling, and recovering items.
                Secure, verified, and exclusive to your university.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-primary-container/5 rounded-[2rem] -rotate-2" />
              <div className="relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm aspect-[4/3]">
                <img
                  className="w-full h-full object-cover"
                  alt="Modern university library interior"
                  src={HERO_IMAGE}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white font-headline font-bold">University Verified Community</p>
                  <p className="text-white/80 text-xs">
                    Trusted by 50,000+ students across the country
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto md:ml-auto">
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-xl shadow-none border-none relative overflow-hidden">
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-headline font-bold text-primary mb-2">{title}</h2>
                <p className="text-on-surface-variant text-sm">{subtitle}</p>
              </div>

              {children}

              {footer ? <div className="mt-8 text-center">{footer}</div> : null}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-[10px] uppercase tracking-widest text-outline font-bold">
        © 2026 CampusStash — Intellectual Property of Academic Curators
      </footer>
    </div>
  );
}