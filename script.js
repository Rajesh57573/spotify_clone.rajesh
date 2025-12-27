let currentSong = new Audio();
let songs = [];
let SONGS_META = {};

// For load the songs.json file
async function loadMetaData() {
  const response = await fetch("./assets/songs/songs.json");
  SONGS_META = await response.json();
}

// For time format
function formatTime(time) {
  if (!isFinite(time) || time <= 0) return "0:00";
  time = Math.floor(time);
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// helper: return encoded filename part or null (e.g. Song%20Name.mp3)
function getCurrentFilenameEncoded() {
  if (!currentSong.src) return null;
  try {
    const url = new URL(currentSong.src, location.href);
    return url.pathname.split("/").pop();
  } catch (e) {
    return currentSong.src.split("/").pop();
  }
}

// helper: normalize a filename (encoded or raw) -> decoded base name without extension
function filenameToBase(name) {
  if (!name) return null;
  try { name = decodeURIComponent(name); } catch (e) {}
  return name.replace(/\.[^/.]+$/, "");
}

// helper: autoplay the next song
function nextSong() {
  const curEnc = getCurrentFilenameEncoded();
  let index = songs.indexOf(curEnc);

  if (index === -1) {
    const curDec = decodeURIComponent(curEnc);
    index = songs.findIndex(s => decodeURIComponent(s) === curDec);
  }

  if (index >= 0 && index + 1 < songs.length) {
    playMusic(songs[index + 1]);
  }
}

async function loadSongsFromJSON() {
  const res = await fetch("./assets/data/songsData.json");
  const data = await res.json();

  // collect all tracks into a flat array
  const allSongs = [];
  Object.values(data).forEach(section => {
    if (section.items) {
      section.items.forEach(item => {
        if (item.track) allSongs.push(item.track);
      });
    }
  });

  return allSongs;
}

function isSameTrack(trackFilename) {
  if (!currentSong.src) return false;

  try {
    const url = new URL(currentSong.src, location.href);
    const current = decodeURIComponent(url.pathname.split("/").pop())
      .replace(/\.[^/.]+$/, "");
    const given = decodeURIComponent(trackFilename)
      .replace(/\.[^/.]+$/, "");
    return current === given;
  } catch (e) {
    return currentSong.src.includes(trackFilename);
  }
}

function updateAllPlayButtons() {
  const curEnc = getCurrentFilenameEncoded();
  const curBase = filenameToBase(curEnc);
  // Bottom main play button - toggle classes based on currentSong.paused
  const mainBtn = document.getElementById("play");
  if (mainBtn) {
    if (currentSong.paused) {
      mainBtn.classList.remove("fa-circle-pause");
      mainBtn.classList.add("fa-circle-play");
    } else {
      mainBtn.classList.remove("fa-circle-play");
      mainBtn.classList.add("fa-circle-pause");
    }
  }
  // Right-side song cards
  document.querySelectorAll(".right .card").forEach(card => {
    const icon = card.querySelector(".playBtn i, .card-play i, .play-icon i, i.fa-play, i.fa-pause");
    const track = card.dataset.track;
    const trackBase = filenameToBase(track);
    if (!icon) return;
    if (curBase && !currentSong.paused && trackBase && trackBase === curBase) {
      icon.classList.remove("fa-play"); icon.classList.add("fa-pause");
    } else {
      icon.classList.remove("fa-pause"); icon.classList.add("fa-play");
    }
  });
  // Left playlist items
  document.querySelectorAll(".songList li").forEach(li => {
    const icon = li.querySelector(".play i, i.fa-circle-play, i.fa-circle-pause");
    const track = li.dataset.track || li.getAttribute("data-track");
    const trackBase = filenameToBase(track);
    if (!icon) return;
    if (curBase && !currentSong.paused && trackBase && trackBase === curBase) {
      icon.classList.remove("fa-circle-play"); icon.classList.add("fa-circle-pause");
    } else {
      icon.classList.remove("fa-circle-pause"); icon.classList.add("fa-circle-play");
    }
  });
}

function renderFooter(trackFilename) {
  if (!trackFilename || !SONGS_META) return;

  // normalize filename (remove path)
  const filename = trackFilename.split("/").pop();

  // get metadata directly from songs.json
  const meta = SONGS_META[filename];
  if (!meta) return;  // no metadata → nothing to show

  const title = meta.title;
  const artists = meta.artists;
  const imageFile = meta.image;
  const imageBase = "./assets/images/";
  const imagePath =  imageBase + encodeURIComponent(imageFile);

  // Footer DOM
  const albumImage = document.querySelector(".album .album-img img");
  const songNameEl = document.querySelector(".album .album-text .songName span");
  const artistNameEl = document.querySelector(".album .album-text .artistName");

  // Update image
  if (albumImage) {
    albumImage.src = imagePath;
    albumImage.onerror = () => {
      albumImage.onerror = null;
      albumImage.src = "./assets/images/placeholder.jpg";
    };
  }
  // Update title
  if (songNameEl) {
    songNameEl.textContent = title;
  }
  // Update artists
  if (artistNameEl) {
    artistNameEl.innerHTML = artists.map(a => `<span>${a}</span>`).join("");
  }
}

const playMusic = (trackFilename) => {
  if (!trackFilename) return;
  const base = "./assets/songs/";
  const safeFilename = trackFilename.replace(/^\/+/, "");
  // Set source properly
  currentSong.src = base + encodeURIComponent(safeFilename);
  // Update UI footer immediately
  renderFooter(safeFilename);
  // Start playback
  currentSong.play();
  // Update the all play buttons
  updateAllPlayButtons();
};

function renderPlaylist(songArr) {
  const songUL = document.querySelector(".songList ul");
  songUL.innerHTML = "";
  const imgBase = "./assets/images/";

  for (const filename of songArr) {
    const displayName = decodeURIComponent(filename).replace(/\.[^/.]+$/, ""); // remove .mp3
    const imagesName = displayName + ".jpg";
    const encodedImage = encodeURIComponent(imagesName);
    const imagePath = imgBase + encodedImage;

    songUL.innerHTML += `<li data-track="${filename}"> 
      <div class="song-cover">
        <img src="${imagePath}" alt=""
        onerror="this.onerror=null;this.src='./assets/images/placeholder.jpg';" />
      </div>
      <div class="song-details">
        <div class="title">${displayName}</div>
        <div class="playlist">Playlist . Rajesh</div>
      </div>
      <div class="play">
        <span>Play</span>
        <i class="fa-solid fa-circle-play"></i>
      </div>
    </li>`;
  }
  
  // click on whole list item -> play data-track
  Array.from(songUL.getElementsByTagName("li")).forEach((li) => {
    const track = li.dataset.track;

    // Whole LI click
    li.addEventListener("click", (ev) => {
      if (ev.target.closest(".play")) return;
      if (isSameTrack(track)) {
        if (currentSong.paused) currentSong.play();
        else currentSong.pause();
        updateAllPlayButtons(track);
        return;
      }
      playMusic(track);
    });

    // Only play icon click
    const playDiv = li.querySelector(".play");
    playDiv.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (isSameTrack(track)) {
        if (currentSong.paused) currentSong.play();
        else currentSong.pause();
        updateAllPlayButtons(track);
        return;
      }
      playMusic(track);
    });
  });
}

// For insert play buttons of all Cards
function insertPlayButtons () {
  document.querySelectorAll(".card").forEach((card) => {
    if (card.querySelector(".playBtn")) return;
    const btn = document.createElement("div");
    btn.className = "playBtn";
    btn.innerHTML = `<i class="fa-solid fa-play"></i>`;
    card.prepend(btn);
  });
}

// Attach handlers to card play buttons (right-hand cards)
function attachCardPlayButtons() {
  document.querySelectorAll(".right .card").forEach(card => {
    const btn = card.querySelector(".playBtn, .card-play, .play-icon");
    if (!btn) return;

    const track = card.dataset.track;
    if (!track) return;

    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();

      if (isSameTrack(track)) {
        // toggle
        if (currentSong.paused) currentSong.play();
        else currentSong.pause();
        updateAllPlayButtons(track);
        return;
      }
      playMusic(track);
    });
  });
}

// Load the right section cards
async function loadRightSectionCards() {
  const [songsRes, artistsRes, topSongsRes] = await Promise.all([
    fetch('./assets/data/songsData.json'),
    fetch('./assets/data/artistData.json'),
    fetch('./assets/data/topSongsData.json')
  ]);

  return {
    songs : await songsRes.json(),
    artists: await artistsRes.json(),
    topSongs: await topSongsRes.json()
  };
}

// For rendering right section cards
function renderRightCards(section, data) {
  const titleE1 = document.getElementById(`${section}Title`);
  const container = document.getElementById(`${section}Cards`);
  
  if (!titleE1 || !container  || !data) return;

  titleE1.textContent = data.title;
  container.innerHTML = "";

  data.items.forEach(item => {
    const card = document.createElement("div");
    card.className = section === "artist" ? "card Artist" : "card";
    card.dataset.track = item.track;

    card.innerHTML = `
    <img src="${item.img}"
      onerror="this.onerror=null;this.src='./assets/images/placeholder.jpg';" >
    <span class="text">${item.title || item.text}</span>
    ${item.text1 ? `<span class="text1"><p>${item.text1}</p></span>` : ""}
    `;

    container.appendChild(card);
  });
}

async function main () {
  // Get the list of all songs
  songs = await loadSongsFromJSON();
  renderPlaylist(songs);
  
  // Show all the songs in the playlist
  const playBtn = document.getElementById("play");
  const prevBtn = document.getElementById("previous");
  const nextBtn = document.getElementById("next");
  const startLabel = document.querySelector(".start");
  const endLabel = document.querySelector(".end");
  const circle = document.querySelector(".circle");
  const seekbar = document.querySelector(".seekbar");

  // Attach an event listener to play/pause top control
  if (playBtn) {
    playBtn.addEventListener("click", ()=> {
      if(currentSong.paused) currentSong.play();
      else currentSong.pause();
      updateAllPlayButtons();
    });
  }

  // helper to set progress (0..100)
  function setProgress(percent) {
    const p = Math.max(0, Math.min(100, percent));
    if (seekbar) seekbar.style.setProperty("--progress", p);
    // move knob: use calc so knob center stays on the line
    if (circle) circle.style.left = p + "%";
  }
  
  // Listen for timeupdate event
  currentSong.addEventListener("timeupdate", () => {
    const cur = currentSong.currentTime;
    const dur = currentSong.duration;
    startLabel && (startLabel.innerHTML = formatTime(cur))
    endLabel && (endLabel.innerHTML = isFinite(dur) ? formatTime(dur) : "0:00");
    if (circle && isFinite(dur) && dur > 0) {
      const percentage = (cur / dur) * 100;
      setProgress(percentage);
    }
    else {
      setProgress(0);
    }
  });
  
  currentSong.addEventListener("play", () => updateAllPlayButtons());
  currentSong.addEventListener("pause", () => updateAllPlayButtons());
  currentSong.addEventListener("ended", () => {
    nextSong();
  });

  // Add an event listener to seekbar
  if (seekbar) {
    seekbar.addEventListener("click", (e) => {
      const rect = seekbar.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const percent = (offsetX / rect.width) * 100;
      setProgress(percent);
      if (isFinite(currentSong.duration)) {
        currentSong.currentTime = (currentSong.duration * percent) / 100;
      }
    });
  }
  
  // helper to get current filename (encoded)
  const getCurrentFilenameEncoded = () => {
    if (!currentSong.src) return null;
    try {
      const url = new URL(currentSong.src, location.href);
      return url.pathname.split("/").pop(); // encoded filename, e.g. Song%20Name.mp3
    } catch (e) {
      return currentSong.src.split("/").pop();
    }
  };

  // Add an event listener to previous button
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const curEncoded = getCurrentFilenameEncoded();
      if (!curEncoded) return console.warn("No current song");
      // find index in songs (both encoded)
      let index = songs.indexOf(curEncoded);
      if (index === -1) {
        // try decoding both sides if mismatch
        const curDecoded = decodeURIComponent(curEncoded);
        index = songs.findIndex((s) => decodeURIComponent(s) === curDecoded);
      }
      if (index > 0) {
        playMusic(songs[index - 1]);
      }
      return;
    });
  }

  // Add an event listener to next button
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const curEncoded = getCurrentFilenameEncoded();
      if (!curEncoded) return console.warn("No current song");
      let index = songs.indexOf(curEncoded);
      if (index === -1) {
        const curDecoded = decodeURIComponent(curEncoded);
        index = songs.findIndex((s) => decodeURIComponent(s) === curDecoded);
      }
      if (index + 1 < songs.length && index !== -1) {
        playMusic(songs[index + 1]);
      }
      return;
    });
  }

  // Add an event to Volume
  const volume = document.getElementById("vol-range");
  volume.addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100
  });

  // A function which called renderFooter function
  const curEnc = getCurrentFilenameEncoded();
  if (curEnc) {
    const curDecoded = decodeURIComponent(curEnc);
    renderFooter(curDecoded);
  }

  // Add an event listener for toggle Playlist Icon
  document.querySelector(".playlistIcon").addEventListener("click", () => {
    document.querySelector(".left").classList.add("active");
  });

  document.querySelector(".lib-icon").addEventListener("click", () => {
    document.querySelector(".left").classList.remove("active");
  });

  // Autoplay first song
  if (songs.length > 0) {
    playMusic(songs[0]);
  }

  const rightData = await loadRightSectionCards();

  // SONG SECTION
  renderRightCards("trending", rightData.songs.trendingSongs);
  renderRightCards("today", rightData.songs.todaySongs);
  renderRightCards("recent", rightData.songs.recentlyPlayed);
  renderRightCards("bollywood", rightData.songs.bollywoodSongs);
  renderRightCards("happy", rightData.songs.happyVibes);
  // ARTIST SECTION
  renderRightCards("artist", rightData.artists.Artists);
  // TOP SONGS FEATURES SECTION
  renderRightCards("topSongs", rightData.topSongs.TopSongs);
  renderRightCards("topRadioSongs", rightData.topSongs.TopRadioSongs);

  insertPlayButtons();
  attachCardPlayButtons();
  await loadMetaData();
}
main()
