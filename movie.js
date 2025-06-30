// <!-- Script -->
    const omdbApiKey = '98e7e519';
    const videoPlayer = document.getElementById('videoPlayer');
    const searchImdbInput = document.getElementById('searchImdbInput');
    const searchButton = document.getElementById('searchButton');
    const messageContainer = document.getElementById('messageContainer');
    const historyNavButton = document.getElementById('historyNavButton');
    const historyPopup = document.getElementById('historyPopup');
    const closeHistoryPopup = document.getElementById('closeHistoryPopup');
    const historyList = document.getElementById('historyList');
    const noHistoryMessage = document.getElementById('noHistoryMessage');
    const videoPlayerContainer = document.getElementById('videoPlayerContainer');
    const imdbInstructions = document.getElementById('imdbInstructions');
    const clearHistoryButton = document.getElementById('clearHistoryButton');
    const clearConfirmationDialog = document.getElementById('clearConfirmationDialog');
    const confirmClearButton = document.getElementById('confirmClearButton');
    const cancelClearButton = document.getElementById('cancelClearButton');

    const HISTORY_KEY = 'playMyShowMovieHistory';
    let currentImdbId = 'tt10676048';

    function showMessage(msg, type = 'info') {
      const color = {
        info: 'bg-blue-600',
        success: 'bg-green-600',
        warning: 'bg-yellow-600',
        error: 'bg-red-700'
      }[type] || 'bg-blue-600';
      messageContainer.innerHTML = `<div class="p-3 my-2 rounded-lg text-sm md:text-base ${color} text-white">${msg}</div>`;
      setTimeout(() => { messageContainer.innerHTML = ''; }, 3000);
    }

    function updateVideoPlayer(imdbId) {
      videoPlayer.src = `https://www.2embed.cc/embed/${imdbId}`;
      videoPlayerContainer.classList.remove('hidden');
      imdbInstructions.classList.add('hidden');
    }

    async function saveToHistory(imdbId, movieData) {
      if (!movieData || movieData.Type !== 'movie') return;
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
      const poster = movieData.Poster && movieData.Poster !== 'N/A' ? movieData.Poster : '';
      const title = movieData.Title || 'Unknown Title';
      const newEntry = { imdbId, title, poster, timestamp: new Date().toISOString() };
      const updated = [newEntry, ...history.filter(item => item.imdbId !== imdbId)].slice(0, 15);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      showMessage(`Added "${title}" to history!`, 'success');
    }

    async function fetchMovieDetails(imdbId) {
      showMessage('Loading...', 'info');
      try {
        const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbApiKey}`);
        const data = await res.json();
        if (data.Response === 'True') {
          updateVideoPlayer(imdbId);
          showMessage(`Now playing: ${data.Title}`, 'info');
          if (data.Type === 'movie') await saveToHistory(imdbId, data);
        } else {
          throw new Error(data.Error);
        }
      } catch (e) {
        showMessage(e.message || 'Error loading movie', 'error');
        videoPlayerContainer.classList.add('hidden');
        imdbInstructions.classList.remove('hidden');
      }
    }

    function loadHistory() {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
      historyList.innerHTML = '';
      if (!history.length) {
        noHistoryMessage.classList.remove('hidden');
        clearHistoryButton.classList.add('hidden');
        return;
      }
      noHistoryMessage.classList.add('hidden');
      clearHistoryButton.classList.remove('hidden');

      history.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'bg-gray-700 p-3 rounded-lg mb-2 flex items-center justify-between';
        const movieInfo = document.createElement('div');
        movieInfo.className = 'flex-grow cursor-pointer hover:text-blue-300 flex items-center';
        if (item.poster) {
          const img = document.createElement('img');
          img.src = item.poster;
          img.alt = item.title;
          img.className = 'w-16 h-24 object-cover rounded mr-3';
          movieInfo.appendChild(img);
        }
        const text = document.createElement('div');
        text.innerHTML = `<p class="font-semibold text-lg">${item.title}</p><p class="text-sm text-gray-400">${item.imdbId}</p>`;
        movieInfo.appendChild(text);
        movieInfo.onclick = () => { fetchMovieDetails(item.imdbId); historyPopup.classList.add('hidden'); };
        const delBtn = document.createElement('button');
        delBtn.className = 'ml-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full';
        delBtn.innerHTML = '<i class="fas fa-times"></i>';
        delBtn.onclick = e => {
          e.stopPropagation();
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history.filter(h => h.imdbId !== item.imdbId)));
          loadHistory();
        };
        wrapper.appendChild(movieInfo);
        wrapper.appendChild(delBtn);
        historyList.appendChild(wrapper);
      });
      historyPopup.classList.remove('hidden');
    }

    searchButton.onclick = () => {
      const val = searchImdbInput.value.trim();
      if (val.startsWith('tt') && val.length >= 7) fetchMovieDetails(val);
      else showMessage('Invalid IMDb ID', 'error');
    };
    searchImdbInput.addEventListener('keypress', e => { if (e.key === 'Enter') searchButton.click(); });
    historyNavButton.onclick = loadHistory;
    closeHistoryPopup.onclick = () => historyPopup.classList.add('hidden');
    clearHistoryButton.onclick = () => clearConfirmationDialog.classList.remove('hidden');
    confirmClearButton.onclick = () => { localStorage.removeItem(HISTORY_KEY); loadHistory(); clearConfirmationDialog.classList.add('hidden'); showMessage('History cleared!', 'success'); };
    cancelClearButton.onclick = () => clearConfirmationDialog.classList.add('hidden');
    document.getElementById('movieNavButton').onclick = () => {
      videoPlayerContainer.classList.add('hidden');
      imdbInstructions.classList.remove('hidden');
      messageContainer.innerHTML = '';
      searchImdbInput.value = '';
    };
    document.getElementById('seriesNavButton').onclick = () => {
      window.location.href = 'series.html';
    };

    window.onload = () => {
      videoPlayerContainer.classList.add('hidden');
      imdbInstructions.classList.remove('hidden');
      fetchMovieDetails(currentImdbId);
    };
  
