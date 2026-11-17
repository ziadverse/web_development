import MovieCard from "./MovieCard.jsx";

function MovieList({ movies, onRemove }) {
  if (movies.length === 0) {
    return (
      <p className="empty-message">
        No movies yet. Add the first one you have watched.
      </p>
    );
  }

  return (
    <ul className="movie-list">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onRemove={onRemove} />
      ))}
    </ul>
  );
}

export default MovieList;
