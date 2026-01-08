export default function HeroSelectorFilters({
  searchTerm,
  onSearchTermChange,
  filterClass,
  onFilterClassChange,
  heroClasses
}: {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  filterClass: string;
  onFilterClassChange: (v: string) => void;
  heroClasses: string[];
}) {
  return (
    <div className="grid mb-4">
      <div className="form-group">
        <label>Search Heroes</label>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Filter by Class</label>
        <select value={filterClass} onChange={(e) => onFilterClassChange(e.target.value)} aria-label="Filter by Class">
          <option value="all">All Classes</option>
          {heroClasses.map((heroClass) => (
            <option key={heroClass} value={heroClass}>
              {heroClass.charAt(0).toUpperCase() + heroClass.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
