function MovieCard({ movie, onRemove }) {
  const { id, title, review, rating } = movie;

  return (
    <li className="movie-card">
      <div className="movie-header">
        <h2 className="movie-title">{title}</h2>
        <span className="movie-stars" aria-label={`${rating} out of 5 stars`}>
          {rating > 0 ? "⭐".repeat(rating) : "Not rated"}
        </span>
      </div>
      {review && <p className="movie-review">{review}</p>}
      <button
        className="remove-btn"
        aria-label={`Remove ${title}`}
        onClick={() => onRemove(id)}
      >
        Remove
      </button>
    </li>
  );
}

export default MovieCard;
