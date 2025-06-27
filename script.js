function goToMovies() {
  document.body.classList.add('opacity-0');
  setTimeout(() => {
    window.location.href = 'movie.html'; // Go up one level
  }, 200);
}

function goToSeries() {
  document.body.classList.add('opacity-0');
  setTimeout(() => {
    window.location.href = 'series.html';
  }, 200);
}

