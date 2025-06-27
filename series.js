const omdbApiKey = '98e7e519';

const videoPlayer = document.getElementById('videoPlayer');
const searchImdbInput = document.getElementById('searchImdbInput');
const searchButton = document.getElementById('searchButton');
const seasonsListDiv = document.getElementById('seasonsList');
const episodesListDiv = document.getElementById('episodesList');
const currentSeasonDisplay = document.getElementById('currentSeasonDisplay');
const movieNavButton = document.getElementById('movieNavButton');
const seriesNavButton = document.getElementById('seriesNavButton');

let currentImdbId = 'tt3107288';
let currentSeason = 1;
let currentEpisode = 1;
let totalSeasons = 0;

function showMessage(element, message, type = 'info') {
  const msgDiv = document.createElement('div');
  msgDiv.className = `p-2 my-2 text-center rounded-md ${type === 'error' ? 'bg-red-800 text-red-200' : 'bg-blue-800 text-blue-200'}`;
  msgDiv.textContent = message;
  element.innerHTML = '';
  element.appendChild(msgDiv);
}

function updateVideoPlayer(type = 'series') {
  if (type === 'series') {
    videoPlayer.src = `https://www.2embed.skin/embedtv/${currentImdbId}&s=${currentSeason}&e=${currentEpisode}`;
  } else {
    videoPlayer.src = `https://www.2embed.skin/embedmovie/${currentImdbId}`;
  }
  console.log(`Video player updated to: ${videoPlayer.src}`);
}

async function fetchSeriesDetails(imdbId) {
  showMessage(seasonsListDiv, 'Loading seasons...');
  showMessage(episodesListDiv, 'Loading episodes...');
  currentSeasonDisplay.textContent = 'N/A';

  try {
    const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbApiKey}`);
    const data = await res.json();

    if (data.Response === 'True' && data.Type === 'series') {
      totalSeasons = parseInt(data.totalSeasons, 10);
      renderSeasons();
      if (totalSeasons >= 1) {
        currentSeason = 1;
        await fetchSeasonEpisodes(imdbId, currentSeason);
        const firstButton = seasonsListDiv.querySelector('button');
        if (firstButton) {
          firstButton.classList.add('bg-purple-700', 'text-white', 'shadow-md');
        }
      }
    } else {
      totalSeasons = 0;
      renderSeasons();
      showMessage(seasonsListDiv, 'Series not found.', 'error');
      showMessage(episodesListDiv, 'No episodes found.', 'error');
    }
  } catch (err) {
    console.error(err);
    totalSeasons = 0;
    renderSeasons();
    showMessage(seasonsListDiv, 'Network error.', 'error');
    showMessage(episodesListDiv, 'Failed to fetch episodes.', 'error');
  }
}

function renderSeasons() {
  seasonsListDiv.innerHTML = '';
  if (totalSeasons === 0) {
    seasonsListDiv.innerHTML = '<p class="text-gray-400 text-sm">No seasons available.</p>';
    return;
  }
  for (let i = 1; i <= totalSeasons; i++) {
    const btn = document.createElement('button');
    btn.textContent = `Season ${i}`;
    btn.className = `m-1 px-4 py-2 rounded-lg font-medium transition duration-200 ease-in-out
      ${i === currentSeason ? 'bg-purple-700 text-white shadow-md' : 'bg-gray-600 hover:bg-purple-600 text-gray-200 hover:text-white'}`;
    btn.onclick = async () => {
      currentSeason = i;
      currentEpisode = 1;
      await fetchSeasonEpisodes(currentImdbId, currentSeason);
      updateVideoPlayer('series');
      document.querySelectorAll('#seasonsList button').forEach(b => {
        b.className = b.className.replace('bg-purple-700 text-white shadow-md', 'bg-gray-600 hover:bg-purple-600 text-gray-200 hover:text-white');
      });
      btn.className = btn.className.replace('bg-gray-600 hover:bg-purple-600 text-gray-200 hover:text-white', 'bg-purple-700 text-white shadow-md');
    };
    seasonsListDiv.appendChild(btn);
  }
}

async function fetchSeasonEpisodes(imdbId, season) {
  episodesListDiv.innerHTML = '<p class="text-gray-400 text-sm">Loading episodes...</p>';
  currentSeasonDisplay.textContent = season;

  try {
    const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&Season=${season}&apikey=${omdbApiKey}`);
    const data = await res.json();
    episodesListDiv.innerHTML = '';

    if (data.Response === 'True' && data.Episodes.length) {
      data.Episodes.forEach(ep => {
        const epDiv = document.createElement('div');
        epDiv.className = `p-3 mb-2 rounded-lg bg-gray-700 hover:bg-purple-800 transition duration-200 ease-in-out cursor-pointer shadow-sm`;
        epDiv.innerHTML = `<span class="font-semibold text-purple-200">E${ep.Episode}:</span> ${ep.Title}`;
        epDiv.onclick = () => {
          currentEpisode = parseInt(ep.Episode, 10);
          updateVideoPlayer('series');
          document.querySelectorAll('#episodesList div').forEach(d => d.classList.remove('bg-purple-600'));
          epDiv.classList.add('bg-purple-600');
        };
        episodesListDiv.appendChild(epDiv);
      });
    } else {
      showMessage(episodesListDiv, `No episodes found for Season ${season}.`, 'error');
    }
  } catch (err) {
    console.error(err);
    showMessage(episodesListDiv, 'Error loading episodes.', 'error');
  }
}

searchButton.addEventListener('click', () => {
  const id = searchImdbInput.value.trim();
  if (id.startsWith('tt') && id.length >= 9) {
    currentImdbId = id;
    currentSeason = 1;
    currentEpisode = 1;
    updateVideoPlayer('series');
    fetchSeriesDetails(currentImdbId);
  } else {
    showMessage(seasonsListDiv, 'Invalid IMDb ID (e.g., tt3107288).', 'error');
    episodesListDiv.innerHTML = '';
    currentSeasonDisplay.textContent = 'N/A';
  }
});

movieNavButton.addEventListener('click', () => window.location.href = 'movie.html');

seriesNavButton.addEventListener('click', () => {
  currentImdbId = 'tt3107288';
  currentSeason = 1;
  currentEpisode = 1;
  updateVideoPlayer('series');
  fetchSeriesDetails(currentImdbId);
  searchImdbInput.placeholder = 'Enter IMDb ID (e.g., tt3107288)';
});

window.onload = () => {
  fetchSeriesDetails(currentImdbId);
  updateVideoPlayer('series');
};
