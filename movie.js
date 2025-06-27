// Replace with your actual OMDb API key
const omdbApiKey = '98e7e519';

const videoPlayer = document.getElementById('videoPlayer');
const searchImdbInput = document.getElementById('searchImdbInput');
const searchButton = document.getElementById('searchButton');
const messageContainer = document.getElementById('messageContainer');

let currentImdbId = 'tt10676048';

function showMessage(message, type = 'info') {
  messageContainer.innerHTML = '';
  const msgDiv = document.createElement('div');
  msgDiv.className = `p-2 my-2 rounded-md ${type === 'error' ? 'bg-red-800 text-red-200' : 'bg-blue-800 text-blue-200'}`;
  msgDiv.textContent = message;
  messageContainer.appendChild(msgDiv);
  setTimeout(() => {
    messageContainer.innerHTML = '';
  }, 5000);
}

function updateVideoPlayer() {
  videoPlayer.src = `https://www.2embed.cc/embed/${currentImdbId}`;
  console.log(`Video player updated to: ${videoPlayer.src}`);
}

async function fetchMovieDetails(imdbId) {
  showMessage('Loading movie details...', 'info');
  try {
    const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbApiKey}`);
    const data = await response.json();

    if (data.Response === 'True' && data.Type === 'movie') {
      currentImdbId = imdbId;
      updateVideoPlayer();
      showMessage(`Now playing: ${data.Title} (${data.Year})`, 'info');
    } else {
      const errorMessage = data.Error || 'Invalid IMDb ID.';
      showMessage(`Error: ${errorMessage}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Network error. Please try again.', 'error');
  }
}

searchButton.addEventListener('click', () => {
  const inputVal = searchImdbInput.value.trim();
  if (inputVal.startsWith('tt') && inputVal.length >= 9) {
    fetchMovieDetails(inputVal);
  } else {
    showMessage('Please enter a valid IMDb ID starting with "tt" (e.g., tt10676048).', 'error');
  }
});

searchImdbInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    searchButton.click();
  }
});

document.getElementById('seriesNavButton').addEventListener('click', function(e) {
  e.preventDefault();
  window.location.href = '../for_series/series.html';
});

window.onload = () => {
  fetchMovieDetails(currentImdbId);
};
