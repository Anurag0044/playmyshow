// Replace with your actual OMDb API key
const omdbApiKey = '98e7e519'; // IMPORTANT: Replace with your OMDb API Key

// DOM Element References
const videoPlayer = document.getElementById('videoPlayer');
const searchImdbInput = document.getElementById('searchImdbInput');
const searchButton = document.getElementById('searchButton');
const seasonsListDiv = document.getElementById('seasonsList');
const episodesListDiv = document.getElementById('episodesList');
const currentSeasonDisplay = document.getElementById('currentSeasonDisplay');
const movieNavButton = document.getElementById('movieNavButton');
const seriesNavButton = document.getElementById('seriesNavButton');

// History Related Elements
const historyNavButton = document.getElementById('historyNavButton');
const historyPopup = document.getElementById('historyPopup');
const closeHistoryPopup = document.getElementById('closeHistoryPopup');
const historyList = document.getElementById('historyList');
const noHistoryMessage = document.getElementById('noHistoryMessage');
const clearHistoryButton = document.getElementById('clearHistoryButton');
const clearConfirmationDialog = document.getElementById('clearConfirmationDialog');
const confirmClearButton = document.getElementById('confirmClearButton');
const cancelClearButton = document.getElementById('cancelClearButton');

// General message container (for messages like "Added to history", "Invalid ID")
const mainMessageContainer = document.getElementById('mainMessageContainer');

// Local Storage Key for Series History - THIS IS WHERE HISTORY IS STORED IN YOUR BROWSER
const SERIES_HISTORY_KEY = 'playMyShowSeriesHistory';

// Global State Variables
let currentImdbId = 'tt3107288'; // Default series ID (e.g., The Flash)
let currentSeason = 1;
let currentEpisode = 1;
let totalSeasons = 0;

/**
 * Displays a general message to the user on the main page.
 * @param {string} message - The message to display.
 * @param {'info'|'success'|'warning'|'error'} type - The type of message (determines color).
 */
function showMainMessage(message, type = 'info') {
    mainMessageContainer.innerHTML = '';
    const msgDiv = document.createElement('div');
    msgDiv.className = `p-3 my-2 rounded-lg text-sm md:text-base ${
        type === 'error' ? 'bg-red-700 text-white' :
        type === 'success' ? 'bg-green-600 text-white' :
        type === 'warning' ? 'bg-yellow-600 text-white' :
        'bg-blue-600 text-white'
    }`;
    msgDiv.textContent = message;
    mainMessageContainer.appendChild(msgDiv);

    // Clear message after 3 seconds
    setTimeout(() => {
        mainMessageContainer.innerHTML = '';
    }, 3000);
}

/**
 * Displays a message within a specific list element (e.g., seasonsListDiv, episodesListDiv).
 * @param {HTMLElement} element - The DOM element to display the message in.
 * @param {string} message - The message to display.
 * @param {'info'|'error'} type - The type of message (determines color).
 */
function showMessage(element, message, type = 'info') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `p-2 my-2 text-center rounded-md ${type === 'error' ? 'bg-red-800 text-red-200' : 'bg-blue-800 text-blue-200'}`;
    msgDiv.textContent = message;
    element.innerHTML = ''; // Clear existing content
    element.appendChild(msgDiv);
}

/**
 * Updates the source of the video player to the current series/season/episode.
 */
function updateVideoPlayer() {
    videoPlayer.src = `https://www.2embed.skin/embedtv/${currentImdbId}&s=${currentSeason}&e=${currentEpisode}`;
    console.log(`Video player updated to: ${videoPlayer.src}`);
}

/**
 * Saves the current series, season, and episode to local storage history.
 * Fetches series title and poster for better history display.
 * @param {string} imdbId - The IMDb ID of the series.
 * @param {number} season - The season number.
 * @param {number} episode - The episode number.
 */
async function saveToSeriesHistory(imdbId, season, episode) {
    // Basic validation to prevent saving invalid states
    if (!imdbId || season < 1 || episode < 1) {
        console.warn('Attempted to save invalid history item:', { imdbId, season, episode });
        return;
    }

    // Retrieve existing history from localStorage
    let history = JSON.parse(localStorage.getItem(SERIES_HISTORY_KEY)) || [];

    // Remove existing entry for this specific episode to avoid duplicates and update timestamp
    history = history.filter(item => !(item.imdbId === imdbId && item.season === season && item.episode === episode));

    let seriesTitle = 'Unknown Series';
    let seriesPoster = '';

    try {
        const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbApiKey}`);
        const data = await response.json();
        if (data.Response === 'True' && data.Type === 'series') { // Ensure it's a series
            seriesTitle = data.Title || seriesTitle;
            seriesPoster = data.Poster && data.Poster !== 'N/A' ? data.Poster : '';
        } else {
            console.warn('OMDb API Error or not a series when fetching title for history:', data.Error || 'Not a series');
            // If OMDb fails, try to find an existing title in history for this IMDb ID
            const existingEntry = history.find(item => item.imdbId === imdbId);
            if (existingEntry) {
                seriesTitle = existingEntry.title;
                seriesPoster = existingEntry.poster;
            } else {
                // If no existing title and OMDb fails, use the IMDb ID as a fallback title
                seriesTitle = `Series (ID: ${imdbId})`;
            }
        }
    } catch (error) {
        console.error('Error fetching series details from OMDb for history:', error);
        // Fallback if network fails
        const existingEntry = history.find(item => item.imdbId === imdbId);
        if (existingEntry) {
            seriesTitle = existingEntry.title;
            seriesPoster = existingEntry.poster;
        } else {
            seriesTitle = `Series (ID: ${imdbId})`;
        }
    }

    // Add the new entry to the beginning of the history array
    history.unshift({ imdbId, season, episode, title: seriesTitle, poster: seriesPoster, timestamp: new Date().toISOString() });

    // Keep only the last 15 series entries in history
    if (history.length > 15) {
        history = history.slice(0, 15);
    }
    // Save the updated history back to localStorage
    localStorage.setItem(SERIES_HISTORY_KEY, JSON.stringify(history));
    showMainMessage(`Saved "${seriesTitle} S${season} E${episode}" to history!`, 'success');
}

/**
 * Deletes a single series item from history based on its IMDb ID, season, and episode.
 * @param {string} imdbIdToDelete - IMDb ID of the series to delete.
 * @param {number} seasonToDelete - Season number of the episode to delete.
 * @param {number} episodeToDelete - Episode number of the episode to delete.
 */
function deleteSingleSeriesHistoryItem(imdbIdToDelete, seasonToDelete, episodeToDelete) {
    let history = JSON.parse(localStorage.getItem(SERIES_HISTORY_KEY)) || [];
    const updatedHistory = history.filter(item =>
        !(item.imdbId === imdbIdToDelete && item.season === seasonToDelete && item.episode === episodeToDelete)
    );
    localStorage.setItem(SERIES_HISTORY_KEY, JSON.stringify(updatedHistory));
    loadSeriesHistory(); // Reload history to reflect the change
    showMainMessage(`Removed S${seasonToDelete} E${episodeToDelete} from history.`, 'success');
}

/**
 * Clears all series watch history from local storage.
 */
function clearAllSeriesHistory() {
    localStorage.removeItem(SERIES_HISTORY_KEY);
    loadSeriesHistory(); // Reload history to show it's empty
    showMainMessage('Series watch history cleared!', 'success');
    clearConfirmationDialog.classList.add('hidden'); // Hide confirmation dialog
}

/**
 * Loads and displays the series watch history in the popup.
 */
function loadSeriesHistory() {
    const history = JSON.parse(localStorage.getItem(SERIES_HISTORY_KEY)) || [];
    historyList.innerHTML = ''; // Clear previous list

    if (history.length === 0) {
        noHistoryMessage.classList.remove('hidden');
        clearHistoryButton.classList.add('hidden'); // Hide clear button if no history
    } else {
        noHistoryMessage.classList.add('hidden');
        clearHistoryButton.classList.remove('hidden'); // Show clear button if history exists
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'bg-gray-700 p-3 rounded-lg mb-2 flex items-center justify-between';

            // Clickable series info part
            const seriesInfo = document.createElement('div');
            seriesInfo.className = 'flex-grow cursor-pointer hover:text-purple-300 transition duration-200 flex items-center';

            // Add poster image if available
            if (item.poster) {
                const img = document.createElement('img');
                img.src = item.poster;
                img.alt = item.title;
                img.className = 'w-16 h-24 object-cover rounded mr-3'; // Adjust size as needed
                seriesInfo.appendChild(img);
            }

            const textContent = document.createElement('div');
            textContent.innerHTML = `<p class="font-semibold text-lg">${item.title}</p><p class="text-sm text-gray-400">S${item.season} E${item.episode}</p><p class="text-xs text-gray-500">ID: ${item.imdbId}</p>`;
            seriesInfo.appendChild(textContent);

            // Store data attributes for easy access
            seriesInfo.dataset.imdbId = item.imdbId;
            seriesInfo.dataset.season = item.season;
            seriesInfo.dataset.episode = item.episode;

            // Event listener to play the series episode from history
            seriesInfo.addEventListener('click', () => {
                currentImdbId = item.imdbId;
                currentSeason = item.season;
                currentEpisode = item.episode;
                updateVideoPlayer(); // Play the series episode
                fetchSeriesDetails(currentImdbId); // Re-fetch details to update season/episode list for the selected series
                historyPopup.classList.add('hidden'); // Close popup after selection
                // IMPORTANT: Call saveToSeriesHistory here when an item is selected from history
                saveToSeriesHistory(currentImdbId, currentSeason, currentEpisode);
            });

            // Delete button for individual item
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'ml-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition duration-300 ease-in-out transform hover:scale-110';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>'; // Font Awesome 'x' icon
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent the parent seriesInfo click from firing
                deleteSingleSeriesHistoryItem(item.imdbId, item.season, item.episode);
            });

            historyItem.appendChild(seriesInfo);
            historyItem.appendChild(deleteBtn);
            historyList.appendChild(historyItem);
        });
    }
    historyPopup.classList.remove('hidden'); // Show the history popup
    clearConfirmationDialog.classList.add('hidden'); // Ensure confirmation dialog is hidden when history opens
}

/**
 * Fetches series details from OMDb API and populates seasons.
 * @param {string} imdbId - The IMDb ID of the series.
 */
async function fetchSeriesDetails(imdbId) {
    showMessage(seasonsListDiv, 'Loading seasons...');
    showMessage(episodesListDiv, 'Loading episodes...');
    currentSeasonDisplay.textContent = 'N/A';

    try {
        const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbApiKey}`);
        const data = await res.json();

        if (data.Response === 'True' && data.Type === 'series') {
            totalSeasons = parseInt(data.totalSeasons, 10);
            renderSeasons(); // Render season buttons

            if (totalSeasons >= 1) {
                // If a series is reloaded (e.g., from history), ensure currentSeason/Episode are valid
                if (currentSeason < 1 || currentSeason > totalSeasons) {
                    currentSeason = 1; // Default to season 1 if out of bounds
                }
                if (currentEpisode < 1) { // Episodes typically start from 1
                    currentEpisode = 1;
                }
                await fetchSeasonEpisodes(imdbId, currentSeason);
                // Moved saveToSeriesHistory here to ensure saving on series load/search
                saveToSeriesHistory(currentImdbId, currentSeason, currentEpisode); // Save after initial load of series
                updateVideoPlayer(); // Update player after setting season/episode
            }
            showMainMessage(`Loaded series: ${data.Title}`, 'info');
        } else {
            totalSeasons = 0;
            renderSeasons();
            showMessage(seasonsListDiv, 'Series not found or invalid IMDb ID.', 'error');
            showMessage(episodesListDiv, 'No episodes found.', 'error');
            showMainMessage('Invalid series ID or series not found. Please check the IMDb ID.', 'error');
        }
    } catch (err) {
        console.error('Error in fetchSeriesDetails:', err);
        totalSeasons = 0;
        renderSeasons();
        showMessage(seasonsListDiv, 'Network error. Could not fetch series details.', 'error');
        showMessage(episodesListDiv, 'Failed to fetch episodes.', 'error');
        showMainMessage('Network error while fetching series details. Check your internet connection.', 'error');
    }
}

/**
 * Renders the season buttons dynamically.
 */
function renderSeasons() {
    seasonsListDiv.innerHTML = '';
    if (totalSeasons === 0) {
        seasonsListDiv.innerHTML = '<p class="text-gray-400 text-sm">No seasons available.</p>';
        return;
    }
    for (let i = 1; i <= totalSeasons; i++) {
        const btn = document.createElement('button');
        btn.textContent = `Season ${i}`;
        // Apply active/inactive styling based on currentSeason
        btn.className = `m-1 px-4 py-2 rounded-lg font-medium transition duration-200 ease-in-out
          ${i === currentSeason ? 'bg-purple-700 text-white shadow-md' : 'bg-gray-600 hover:bg-purple-600 text-gray-200 hover:text-white'}`;
        btn.onclick = async () => {
            currentSeason = i;
            currentEpisode = 1; // Reset episode to 1 when changing season
            await fetchSeasonEpisodes(currentImdbId, currentSeason);
            updateVideoPlayer(); // Update player with new season, default episode 1
            // IMPORTANT: Call saveToSeriesHistory here when changing season
            saveToSeriesHistory(currentImdbId, currentSeason, currentEpisode);

            // Update active season button styling
            document.querySelectorAll('#seasonsList button').forEach(b => {
                b.classList.remove('bg-purple-700', 'text-white', 'shadow-md');
                b.classList.add('bg-gray-600', 'hover:bg-purple-600', 'text-gray-200', 'hover:text-white');
            });
            btn.classList.remove('bg-gray-600', 'hover:bg-purple-600', 'text-gray-200', 'hover:text-white');
            btn.classList.add('bg-purple-700', 'text-white', 'shadow-md');
        };
        seasonsListDiv.appendChild(btn);
    }
}

/**
 * Fetches and renders episodes for a specific season.
 * @param {string} imdbId - The IMDb ID of the series.
 * @param {number} season - The season number to fetch episodes for.
 */
async function fetchSeasonEpisodes(imdbId, season) {
    episodesListDiv.innerHTML = '<p class="text-gray-400 text-sm">Loading episodes...</p>';
    currentSeasonDisplay.textContent = season;

    try {
        const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&Season=${season}&apikey=${omdbApiKey}`);
        const data = await res.json();
        episodesListDiv.innerHTML = ''; // Clear loading message

        if (data.Response === 'True' && data.Episodes.length) {
            data.Episodes.forEach(ep => {
                const epNum = parseInt(ep.Episode, 10);
                const isCurrent = (epNum === currentEpisode && parseInt(ep.Season, 10) === currentSeason);
                
                const epDiv = document.createElement('div');
                epDiv.className = `p-3 mb-2 rounded-lg cursor-pointer shadow-sm ${
                    isCurrent ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-purple-800 text-gray-200'
                } transition duration-200 ease-in-out`;
                epDiv.innerHTML = `<span class="font-semibold text-purple-200">E${ep.Episode}:</span> ${ep.Title}`;
                epDiv.onclick = () => {
                    currentEpisode = epNum;
                    currentSeason = parseInt(ep.Season, 10); // Ensure currentSeason is updated if navigating from another season's episode directly
                    updateVideoPlayer();
                    // IMPORTANT: This call remains crucial when clicking an episode
                    saveToSeriesHistory(currentImdbId, currentSeason, currentEpisode);

                    // Update active episode styling
                    document.querySelectorAll('#episodesList div').forEach(d => {
                        d.classList.remove('bg-purple-600', 'text-white');
                        d.classList.add('bg-gray-700', 'hover:bg-purple-800', 'text-gray-200');
                    });
                    epDiv.classList.remove('bg-gray-700', 'hover:bg-purple-800', 'text-gray-200');
                    epDiv.classList.add('bg-purple-600', 'text-white');
                };
                episodesListDiv.appendChild(epDiv);

                // Ensure the pre-selected current episode is highlighted on initial load or season change
                if (isCurrent) {
                     epDiv.classList.add('bg-purple-600', 'text-white');
                     epDiv.classList.remove('bg-gray-700', 'hover:bg-purple-800', 'text-gray-200');
                }
            });
        } else {
            showMessage(episodesListDiv, `No episodes found for Season ${season}.`, 'error');
        }
    } catch (err) {
        console.error('Error in fetchSeasonEpisodes:', err);
        showMessage(episodesListDiv, 'Error loading episodes. Network issue or invalid data.', 'error');
    }
}

// --- Event Listeners ---

// Search Button Click
searchButton.addEventListener('click', () => {
    const id = searchImdbInput.value.trim();
    // Basic IMDb ID validation (starts with 'tt' and reasonable length)
    if (id.startsWith('tt') && id.length >= 7) {
        currentImdbId = id;
        currentSeason = 1; // Reset to S1E1 for new series search
        currentEpisode = 1;
        updateVideoPlayer();
        fetchSeriesDetails(currentImdbId);
        showMainMessage(`Searching for series with ID: ${currentImdbId}`, 'info');
    } else {
        showMessage(seasonsListDiv, 'Invalid IMDb ID (e.g., tt3107288).', 'error');
        episodesListDiv.innerHTML = ''; // Clear episodes
        currentSeasonDisplay.textContent = 'N/A';
        showMainMessage('Please enter a valid IMDb ID starting with "tt".', 'error');
    }
});

// Search Input Enter Keypress
searchImdbInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

// Navigation Button: Movies
movieNavButton.addEventListener('click', () => {
    // Assuming 'for_movie/index.html' is in a sibling directory to 'for_series'
    // Adjust path if your file structure is different (e.g., if both are in root)
    window.location.href = 'movie.html';
});

// Navigation Button: Series (reloads default series)
seriesNavButton.addEventListener('click', () => {
    currentImdbId = 'tt3107288'; // Default series: The Flash
    currentSeason = 1;
    currentEpisode = 1;
    updateVideoPlayer();
    fetchSeriesDetails(currentImdbId); // This will now also save to history
    searchImdbInput.placeholder = 'Enter IMDb Series ID (e.g., tt3107288)'; // Reset placeholder
    showMainMessage('Showing default series: The Flash', 'info');
    // Ensure history popup is closed if open
    historyPopup.classList.add('hidden');
});

// History Navigation Button
historyNavButton.addEventListener('click', () => {
    loadSeriesHistory(); // Open and populate the history popup
});

// Close History Pop-up Button
closeHistoryPopup.addEventListener('click', () => {
    historyPopup.classList.add('hidden');
});

// "Clear All History" Button (inside history popup)
clearHistoryButton.addEventListener('click', () => {
    clearConfirmationDialog.classList.remove('hidden'); // Show confirmation dialog
});

// "Yes, Clear" Button in Confirmation Dialog
confirmClearButton.addEventListener('click', () => {
    clearAllSeriesHistory(); // Proceed to clear history
});

// "Cancel" Button in Confirmation Dialog
cancelClearButton.addEventListener('click', () => {
    clearConfirmationDialog.classList.add('hidden'); // Hide confirmation dialog
});


// Initial page load: Fetch default series details and play default episode
window.onload = () => {
    fetchSeriesDetails(currentImdbId); // Load details for the default series (this will now also save history)
    updateVideoPlayer(); // Play the default series episode (history saved by fetchSeriesDetails)
    searchImdbInput.placeholder = 'Enter IMDb Series ID (e.g., tt3107288)'; // Set initial placeholder
};
