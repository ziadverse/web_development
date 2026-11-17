import { useState } from "react";

const STARS = [1, 2, 3, 4, 5];

function MovieForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);

  function handleSubmit(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    onAdd({ title: cleanTitle, review: review.trim(), rating });
    setTitle("");
    setReview("");
    setRating(0);
  }

  return (
    <form className="movie-form" onSubmit={handleSubmit}>
      <label>
        Movie title
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Inception"
        />
      </label>
      <label>
        Review
        <textarea
          value={review}
          onChange={(event) => setReview(event.target.value)}
          placeholder="What did you think?"
        />
      </label>
      <div className="rating-field" role="group" aria-label="Rating">
        <span>Rating</span>
        <div className="star-picker">
          {STARS.map((star) => (
            <button
              key={star}
              type="button"
              className={star <= rating ? "active" : ""}
              aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
              aria-pressed={star <= rating}
              onClick={() => setRating(star === rating ? 0 : star)}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>
      <button type="submit" className="add-btn" disabled={!title.trim()}>
        Add movie
      </button>
    </form>
  );
}

export default MovieForm;
