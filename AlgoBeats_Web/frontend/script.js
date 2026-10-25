const state = { songs: [], filtered: [], currentIndex: -1, playlists: loadPlaylists(), activePlaylist: null };
const $ = (id) => document.getElementById(id);
const audio = $("audio");
const palettes = [
  ["#184936","#76b9a2"],["#735238","#e5b879"],["#164c61","#59a9bc"],["#56385e","#c89ed4"],
  ["#6d3c32","#f2a278"],["#3e426a","#a2a8e5"],["#35513d","#b0cf8a"],["#624b28","#e2c17a"],
  ["#3c5369","#b4d4e6"],["#563a46","#e3a1b8"]
];
function fmt(sec){ if(!Number.isFinite(sec))return "0:00"; return `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,"0")}`; }
function notify(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove("show"),2400);}
async function api(url, options={}) {
  const res=await fetch(url,{headers:{"Content-Type":"application/json"},...options});
  const data=await res.json();
  if(!res.ok || data.ok===false) throw new Error(data.error||"Request failed");
  return data;
}
function coverStyle(song){const p=palettes[(song.id-1)%palettes.length];return `background:radial-gradient(circle at 35% 30%,${p[1]},transparent 35%),linear-gradient(135deg,${p[0]},#15171b 85%)`;}
function renderSongs(list){
  $("songCount").textContent=`${list.length} tracks`;
  $("songGrid").innerHTML=list.map(s=>`<article class="song-card" data-play="${s.id}" tabindex="0" aria-label="Play ${esc(s.title)}">
    <div class="cover" style="${coverStyle(s)}"><span class="cover-glyph">♫</span><span class="play-overlay">▶</span></div>
    <h3>${esc(s.title)}</h3><p>${esc(s.artist)}</p><div class="song-meta"><span>★ ${s.popularity}</span><span>${fmt(s.duration)}</span></div><button class="add-playlist-button" data-add-playlist="${s.id}" title="Add to a playlist">＋ Add to playlist</button></article>`).join("")||'<div class="empty">No tracks match these filters. Try changing your search or popularity filter.</div>';
  $("allTracks").innerHTML=list.map((s,i)=>`<div class="track-row" data-play="${s.id}" tabindex="0"><span class="track-number">${String(i+1).padStart(2,"0")}</span><div><div class="track-name">${esc(s.title)}</div><div class="track-artist">${esc(s.artist)}</div></div><span class="track-duration">${fmt(s.duration)}</span><span class="track-pop">★ ${s.popularity}</span></div>`).join("");
}
function applyFilters(){
  const q=$("filterInput").value.trim().toLowerCase();
  const minPopularity=Number($("popularityFilter").value);
  const sortBy=$("sortFilter").value;
  let list=state.songs.filter(s=>(s.title.toLowerCase().includes(q)||s.artist.toLowerCase().includes(q))&&s.popularity>=minPopularity);
  if(sortBy==="popular")list.sort((a,b)=>b.popularity-a.popularity);
  else if(sortBy==="duration")list.sort((a,b)=>a.duration-b.duration);
  else if(sortBy==="title")list.sort((a,b)=>a.title.localeCompare(b.title));
  state.filtered=list;renderSongs(list);
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function loadPlaylists(){try{return JSON.parse(localStorage.getItem("algobeats-playlists")||"[]");}catch{return [];}}
function savePlaylists(){localStorage.setItem("algobeats-playlists",JSON.stringify(state.playlists));renderPlaylists();}
function openPlaylistModal(){$("playlistModal").hidden=false;$("playlistName").value="";$("playlistName").focus();}
function renderPlaylists(){
  const side=$("playlistList"), content=$("playlistContent");
  side.innerHTML=state.playlists.map(p=>`<button class="playlist-nav-item" data-open-playlist="${esc(p.id)}">♫ ${esc(p.name)} <span>${p.songIds.length}</span></button>`).join("");
  if(!state.playlists.length){content.innerHTML='<p class="muted">Create a playlist to start collecting tracks.</p>';return;}
  content.innerHTML=state.playlists.map(p=>{const tracks=p.songIds.map(id=>state.songs.find(s=>s.id===id)).filter(Boolean);return `<div class="playlist-card"><div class="playlist-card-head"><div><h3>${esc(p.name)}</h3><p>${tracks.length} tracks</p></div><button class="reset-button" data-delete-playlist="${esc(p.id)}">Delete</button></div>${tracks.length?tracks.map((s,i)=>`<div class="playlist-track" data-play="${s.id}"><span>${i+1}</span><div><b>${esc(s.title)}</b><small>${esc(s.artist)}</small></div><span>${fmt(s.duration)}</span><button class="remove-track" data-remove-track="${esc(p.id)}:${s.id}" title="Remove track">×</button></div>`).join(""):'<p class="muted">No tracks yet. Use “Add to playlist” on a song.</p>'}</div>`}).join("");
}
function addTrackToPlaylist(songId){if(!state.playlists.length){notify("Create a playlist first.");openPlaylistModal();return;}const options=state.playlists.map((p,i)=>`${i+1}. ${p.name}`).join("\n");const choice=prompt("Add to which playlist? Enter its number:\n"+options);if(choice===null)return;const playlist=state.playlists[Number(choice)-1];if(!playlist){notify("That playlist number was not found.");return;}const id=Number(songId);if(!playlist.songIds.includes(id))playlist.songIds.push(id);savePlaylists();notify(`Added to ${playlist.name}`);}
async function loadCatalog(){try{const data=await api("/api/catalog");state.songs=data.songs;state.filtered=[...state.songs];applyFilters();renderPlaylists();}catch(e){$("songGrid").innerHTML=`<div class="empty">Could not load C engine: ${esc(e.message)}. Check backend setup.</div>`;notify(e.message);}}
function playSongById(id){const idx=state.songs.findIndex(s=>s.id===Number(id));if(idx<0)return;state.currentIndex=idx;const s=state.songs[idx];$("nowTitle").textContent=s.title;$("nowArtist").textContent=s.artist;$("miniCover").style.background=coverStyle(s);$("miniCover").textContent="♫";audio.src="/"+s.audio.replace(/^\/+/,"");audio.load();audio.play().then(()=>{$("playButton").textContent="Ⅱ";}).catch(()=>{ $("playButton").textContent="▶"; notify("Add an audio file to frontend/assets/audio to play this track.");});}
$("filterInput").addEventListener("input",applyFilters);

$("popularityFilter").addEventListener("change",applyFilters);
$("sortFilter").addEventListener("change",applyFilters);
$("resetFilters").addEventListener("click",()=>{$("filterInput").value="";$("popularityFilter").value="0";$("sortFilter").value="featured";applyFilters();});
document.body.addEventListener("click",e=>{const add=e.target.closest("[data-add-playlist]");if(add){e.stopPropagation();addTrackToPlaylist(add.dataset.addPlaylist);return;}const del=e.target.closest("[data-delete-playlist]");if(del){state.playlists=state.playlists.filter(p=>p.id!==del.dataset.deletePlaylist);savePlaylists();notify("Playlist deleted");return;}const remove=e.target.closest("[data-remove-track]");if(remove){const [pid,sid]=remove.dataset.removeTrack.split(":");const p=state.playlists.find(x=>x.id===pid);if(p){p.songIds=p.songIds.filter(id=>id!==Number(sid));savePlaylists();}return;}const open=e.target.closest("[data-open-playlist]");if(open){$("playlistSection").scrollIntoView({behavior:"smooth"});const card=[...document.querySelectorAll(".playlist-card")].find(x=>x.querySelector(".playlist-card-head h3")?.textContent===state.playlists.find(p=>p.id===open.dataset.openPlaylist)?.name);if(card)card.scrollIntoView({behavior:"smooth",block:"center"});return;}const play=e.target.closest("[data-play]");if(play)playSongById(play.dataset.play);});
document.body.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-play]")){e.preventDefault();playSongById(e.target.dataset.play);}});
$("shuffleButton").addEventListener("click",()=>{if(!state.songs.length)return;const s=state.songs[Math.floor(Math.random()*state.songs.length)];playSongById(s.id);notify("Picked a track for you.");});
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-view]").forEach(x=>x.classList.remove("active"));b.classList.add("active");if(b.dataset.view==="library")$("librarySection").scrollIntoView({behavior:"smooth"});else {document.querySelector(".section").scrollIntoView({behavior:"smooth"});if(b.dataset.view==="search")$("filterInput").focus();}}));
$("playButton").addEventListener("click",()=>{if(!audio.src){notify("Choose a track first.");return;}if(audio.paused)audio.play().then(()=>$("playButton").textContent="Ⅱ").catch(()=>notify("Audio file is not available yet."));else{audio.pause();$("playButton").textContent="▶";}});
$("nextButton").addEventListener("click",()=>{if(state.songs.length)playSongById(state.songs[(state.currentIndex+1+state.songs.length)%state.songs.length].id);});
$("previousButton").addEventListener("click",()=>{if(state.songs.length)playSongById(state.songs[(state.currentIndex-1+state.songs.length)%state.songs.length].id);});
$("likeButton").addEventListener("click",()=>{const liked=$("likeButton").textContent==="♥";$("likeButton").textContent=liked?"♡":"♥";$("likeButton").style.color=liked?"#bbb":"#31d878";notify(liked?"Removed from liked tracks":"Added to liked tracks");});
audio.addEventListener("timeupdate",()=>{if(audio.duration){$("progress").value=audio.currentTime/audio.duration*100;$("currentTime").textContent=fmt(audio.currentTime);$("duration").textContent=fmt(audio.duration);}});
$("progress").addEventListener("input",()=>{if(audio.duration)audio.currentTime=Number($("progress").value)/100*audio.duration;});
$("volume").addEventListener("input",()=>audio.volume=Number($("volume").value));
audio.addEventListener("ended",()=>$("nextButton").click());
audio.addEventListener("error",()=>{if(audio.src)notify("No audio file found. See README to add a licensed MP3.");});
$("createPlaylistButton").addEventListener("click",openPlaylistModal);
$("createPlaylistSidebar").addEventListener("click",openPlaylistModal);
$("cancelPlaylist").addEventListener("click",()=>$("playlistModal").hidden=true);
$("playlistModal").addEventListener("click",e=>{if(e.target.id==="playlistModal")$("playlistModal").hidden=true;});
$("playlistForm").addEventListener("submit",e=>{e.preventDefault();const name=$("playlistName").value.trim();if(!name)return;state.playlists.push({id:`p${Date.now()}`,name,songIds:[]});savePlaylists();$("playlistModal").hidden=true;notify(`Created ${name}`);});
loadCatalog();
