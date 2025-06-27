function goToMovies() {
  document.body.classList.add('opacity-0');
  setTimeout(() => {
    window.location.href = '../for_movie/movie.html'; // Go up one level
  }, 200);
}

function goToSeries() {
  document.body.classList.add('opacity-0');
  setTimeout(() => {
    window.location.href = '../for_series/series.html';
  }, 200);
}

