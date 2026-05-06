const CATEGORY_OPTIONS = ['Books', 'Electronics', 'Furniture', 'Lab Equipment', 'Apparel', 'Dorm Life'];
const CONDITION_OPTIONS = ['New', 'Good', 'Used', 'Fair'];

export default function MarketplaceFilters({
  state,
  filters,
  onFilterChange,
  onClear,
}) {
  return (
    <aside className="w-full flex-shrink-0 lg:w-80">
      <div className="sticky top-24 space-y-6 rounded-3xl bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold text-primary">Filters</h2>
          <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={onClear}>
            Clear all
          </button>
        </div>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-outline">Category</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onFilterChange('category', '')}
              className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                !filters.category ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary'
              }`}
            >
              All
            </button>
            {CATEGORY_OPTIONS.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => onFilterChange('category', category)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  filters.category === category ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {state === 'listings' ? (
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-outline">Condition</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onFilterChange('itemCondition', '')}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  !filters.itemCondition ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                }`}
              >
                Any
              </button>
              {CONDITION_OPTIONS.map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => onFilterChange('itemCondition', condition)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                    filters.itemCondition === condition ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {state === 'listings' ? (
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-outline">Price Range</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={filters.minPrice}
                onChange={(event) => onFilterChange('minPrice', event.target.value)}
                className="rounded-xl border-none bg-surface-container-low px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                placeholder="৳ Min"
                type="number"
                min="0"
              />
              <input
                value={filters.maxPrice}
                onChange={(event) => onFilterChange('maxPrice', event.target.value)}
                className="rounded-xl border-none bg-surface-container-low px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                placeholder="৳ Max"
                type="number"
                min="0"
              />
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  );
}