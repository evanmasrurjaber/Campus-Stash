export default function MainFooter() {
  return (
    <footer className="mt-12 w-full rounded-t-3xl bg-[#f5f2fb]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 py-12 font-body text-sm text-slate-500 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-6">
          <span className="text-2xl font-bold text-[#1A237E]">CampusStash</span>
          <p className="leading-relaxed">
            The Academic Curator for University Life. Streamlining the way students trade, find, and connect.
          </p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined cursor-pointer text-2xl transition-colors hover:text-[#1A237E]">
              social_leaderboard
            </span>
            <span className="material-symbols-outlined cursor-pointer text-2xl transition-colors hover:text-[#1A237E]">
              brand_awareness
            </span>
            <span className="material-symbols-outlined cursor-pointer text-2xl transition-colors hover:text-[#1A237E]">
              alternate_email
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-widest text-on-surface">Resources</h5>
          <ul className="space-y-2">
            <li><a className="transition-colors hover:text-[#1A237E] hover:underline" href="#">Campus Directory</a></li>
            <li><a className="transition-colors hover:text-[#1A237E] hover:underline" href="#">Student Safety</a></li>
            <li><a className="transition-colors hover:text-[#1A237E] hover:underline" href="#">Seller Guide</a></li>
            <li><a className="transition-colors hover:text-[#1A237E] hover:underline" href="#">Lost Item Tips</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-widest text-on-surface">Support</h5>
          <ul className="space-y-2">
            <li><a className="transition-colors hover:text-[#1A237E] hover:underline" href="#">Contact Support</a></li>
            <li><a className="transition-colors hover:text-[#1A237E] hover:underline" href="#">Terms of Service</a></li>
            <li><a className="transition-colors hover:text-[#1A237E] hover:underline" href="#">Privacy Policy</a></li>
            <li><a className="transition-colors hover:text-[#1A237E] hover:underline" href="#">Safety Guidelines</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-widest text-on-surface">Stay Updated</h5>
          <p>Get campus alerts and top deals sent to your student email.</p>
          <div className="flex gap-2">
            <input
              className="w-full rounded-sm border-none bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
              placeholder="Your .edu email"
              type="email"
            />
            <button className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white" type="button">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-slate-200 px-8 pb-8 pt-8 text-center opacity-80">
        <p>© 2026 CampusStash - Intellectual Property of Academic Curators</p>
      </div>
    </footer>
  );
}
