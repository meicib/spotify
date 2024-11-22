const clientId = "715ff8c50ac249958a47d69e150e620c";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchWebApi("v1/me", "GET", accessToken);
    populateUI(profile);


    let timeRange = "medium_term";
    let typeSelect = "tracks";
    
    const hyrax = document.getElementById("hyrax");
    const timeRangeButtons = document.querySelectorAll('.time-range-selector');
    const typeSelector = document.getElementById("type-selector");

    async function display() {
        console.log("in display");
    
        typeSelect = typeSelector.value;
    
        console.log(timeRange);
        console.log(typeSelect);
    
    
        const limit = "10";
    
        console.log(`v1/me/top/${typeSelect}?time_range=${timeRange}&limit=${limit}`)
    
        const topDisplay = await fetchWebApi(`v1/me/top/${typeSelect}?time_range=${timeRange}&limit=${limit}`, "GET", accessToken);
        
        if (typeSelect == "tracks") {
            displayTracks(topDisplay);
        } else {
            displayArtists(topDisplay)
        }
    }

    timeRangeButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            timeRange = btn.value;
        });
        btn.addEventListener('click', display);
    });

    typeSelector.addEventListener("change", display);

    hyrax.addEventListener("click", function() {
        window.open('https://www.linkedin.com/in/amelie-cibulka/');
    });
}


export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}


function populateUI(profile) {
    document.getElementById("displayName").innerText = profile.display_name;
    // if (profile.images[0]) {
    //     const profileImage = new Image(200, 200);
    //     profileImage.src = profile.images[0].url;
    //     document.getElementById("avatar").appendChild(profileImage);
    //     document.getElementById("imgUrl").innerText = profile.images[0].url;
    // }
    // document.getElementById("id").innerText = profile.id;
    // document.getElementById("email").innerText = profile.email;
    // document.getElementById("uri").innerText = profile.uri;
    // document.getElementById("uri").setAttribute("href", profile.external_urls.spotify);
    // document.getElementById("url").innerText = profile.href;
    // document.getElementById("url").setAttribute("href", profile.href);
}

async function fetchWebApi(endpoint, method, token, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}

function displayTracks(tracksJSON) {
    const trackContainer = document.getElementById("tracks-container");
    removePrevious();
    for (let i = 0; i < tracksJSON.items.length; i++) {
        const track = document.createElement("li");
        console.log(tracksJSON.items[i]);
        let art = "";
        for(let a = 0; a < tracksJSON.items[i].artists.length; a++) {
            art = art.concat(tracksJSON.items[i].artists[a].name, " ");
        }
        track.textContent = tracksJSON.items[i].name + " - " + art;
        trackContainer.appendChild(track);
    }
}

function displayArtists(artistsJSON) {
    const artistContainer = document.getElementById("artists-container");
    removePrevious();
    for (let i = 0; i < artistsJSON.items.length; i++) {
        const artist = document.createElement("li");
        artist.textContent = artistsJSON.items[i].name;
        artistContainer.appendChild(artist);
    }
}

function removePrevious() {
    const trackContainer = document.getElementById("tracks-container");
    trackContainer.replaceChildren();

    const artistContainer = document.getElementById("artists-container");
    artistContainer.replaceChildren();
}