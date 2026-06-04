export default function CategoryFilter({ categorias, value, onChange }) {
  const items = ["Todas", ...categorias];
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {items.map((cat) => {
        const isActive = (value === "" && cat === "Todas") || value === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat === "Todas" ? "" : cat)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-sm border transition-colors ${
              isActive
                ? "bg-primary text-white border-primary"
                : "bg-white border-gray-300 text-gray-700 hover:border-primary"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
