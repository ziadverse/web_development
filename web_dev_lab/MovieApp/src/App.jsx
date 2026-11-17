import { useState } from "react";
import MovieForm from "./components/MovieForm.jsx";
import MovieList from "./components/MovieList.jsx";

function App() {
  const [movies, setMovies] = useState([]);

  function addMovie(movie) {
    setMovies((current) => [...current, { ...movie, id: Date.now() }]);
  }

  function removeMovie(id) {
    setMovies((current) => current.filter((movie) => movie.id !== id));
  }

  return (
    <div className="app">
      <h1 className="app-title">Movies Watch List</h1>
      <p className="movie-count">
        {movies.length} {movies.length === 1 ? "movie" : "movies"} watched
      </p>
      <MovieForm onAdd={addMovie} />
      <MovieList movies={movies} onRemove={removeMovie} />
    </div>
  );
}

export default App;
