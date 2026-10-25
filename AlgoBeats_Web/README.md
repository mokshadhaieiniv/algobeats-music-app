# AlgoBeats Web

A Spotify-inspired music discovery UI for a DSA course project. The backend calls a real C executable for catalog, linear/binary search, merge sort and quicksort. Audio playback uses HTML5 `<audio>` and local licensed MP3 files.

## Requirements
- Windows 10/11
- Python 3.10+
- GCC (MinGW-w64 recommended), available as `gcc` in Command Prompt/VS Code terminal
- A modern browser

## Run on Windows
1. Extract the project ZIP.
2. Open the `AlgoBeats_Web` folder in VS Code.
3. In the terminal, compile the C engine:
   ```powershell
   gcc -std=c11 -Wall -Wextra -pedantic dsa_engine\algobeats.c -o dsa_engine\algobeats.exe
   ```
4. Install Python packages:
   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   py -m pip install -r backend\requirements.txt
   ```
   If PowerShell blocks activation, skip activation and use:
   ```powershell
   py -m pip install -r backend\requirements.txt
   ```
5. Start the server:
   ```powershell
   py backend\app.py
   ```
6. Open `http://127.0.0.1:5000` in your browser.

## Add actual audio
This project does not bundle copyrighted songs or pretend the demo catalog is a real licensed music catalogue. Add audio that you own or are explicitly licensed to use:
1. Create `frontend\assets\audio\`.
2. Add MP3 files with these exact filenames:
   - `midnight-drive.mp3`
   - `golden-hour.mp3`
   - `ocean-lights.mp3`
   - `velvet-echo.mp3`
   - `city-rain.mp3`
   - `paper-moons.mp3`
   - `afterglow.mp3`
   - `slow-motion.mp3`
   - `daydream-fm.mp3`
   - `last-train-home.mp3`
3. Keep a copy of the licence/attribution details for every track. Use your own recordings or tracks whose licence permits website redistribution. Check the licence conditions and attribution requirements before publishing. Do not download or redistribute tracks from Spotify/YouTube without permission.
4. Refresh the page and click a song. The play bar, progress, volume and next/previous controls use the browser audio element.

The artwork and names in the demo catalogue are placeholders. No external music service is connected.

## DSA functions
- `GET /api/catalog` — list songs from the C program.
- `POST /api/search` with JSON `{"id":3,"algorithm":"linear"}` or `{"id":3,"algorithm":"binary"}`.
- `GET /api/sort/merge` — C merge sort by title.
- `GET /api/sort/quick` — C quicksort by popularity.
- The UI renders the C program's JSON results and comparison counts.

## Deployment
For a public website you need a server that can run Python and compile/execute a C binary. Static hosting alone (e.g. GitHub Pages) cannot run this C backend.
1. Push the project to a private/public Git repository only after reviewing its contents and licensing.
2. Choose a Python-capable host that allows the required C binary/subprocess execution (for example, a container-based host). Confirm current free-tier, build and filesystem policies first.
3. A `Procfile` is included. It starts Gunicorn from the backend directory; `gunicorn` is listed in `backend/requirements.txt`.
4. Configure the build command to install Python dependencies and compile C:
   `pip install -r backend/requirements.txt && gcc -std=c11 -O2 -Wall -Wextra -pedantic dsa_engine/algobeats.c -o dsa_engine/algobeats`
5. Use the included start command `gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT` if supported by the host; otherwise use its equivalent command.
6. Upload licensed audio files via an appropriate persistent/static asset solution if the host does not preserve uploaded files. Do not assume local disk is persistent.
7. Test `/`, `/api/catalog`, both search methods and both sort endpoints on the deployed URL.

## Important limitations
- This is a course-project demo, not a streaming service. It does not authenticate users, store persistent playlists, provide a full media database or integrate with Spotify.
- Demo catalog is compiled into the C program. To change song metadata, edit `dsa_engine/algobeats.c` and recompile.
- Binary search is over IDs in ascending order. The sort endpoints return a sorted copy and do not change the original catalogue.
- The UI uses generated gradients rather than album artwork to avoid using unlicensed images.
- Do not deploy the Flask development server for production; use a production WSGI server.
