import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

export default function StarRating({ value = 0, size = "text-sm", showNumber = true }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (v >= i) stars.push(<FaStar key={i} className="text-star" />);
    else if (v >= i - 0.5) stars.push(<FaStarHalfAlt key={i} className="text-star" />);
    else stars.push(<FaRegStar key={i} className="text-star" />);
  }
  return (
    <span className={`inline-flex items-center gap-0.5 ${size}`}>
      {stars}
      {showNumber && (
        <span className="ml-1 text-gray-700 font-medium">{v.toFixed(1)}</span>
      )}
    </span>
  );
}

export function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="text-2xl"
          aria-label={`Calificar ${n} estrellas`}
        >
          {value >= n ? (
            <FaStar className="text-star" />
          ) : (
            <FaRegStar className="text-star" />
          )}
        </button>
      ))}
    </div>
  );
}
