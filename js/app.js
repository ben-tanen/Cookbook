/***** SPOTIFY INITIALIZATION *******/
// initialize spotify stuff
var spotify = new SpotifyAPI();
spotify.login.setClientId('7501ca235761432fac0f01e5d91cee1d');
if (location.hostname == 'localhost') spotify.login.setRedirect('http://localhost:8000/');
else spotify.login.setRedirect('http://ben-tanen.com/Cookbook/');



/******** FUNCTIONS ***************/
// blank function that does nothing
function none() { };

// called by getTracks as callback
function buildSongList(r) {
    getSongData(r.items);
    if (r.next) {
        spotify.general.getURL(r.next, buildSongList, null);
    } else {
        spotify.track.getTracks(playlist_tracks, function(r) {
            var time_sum = 0;
            r.tracks.forEach(function(t) {
                time_sum += t.duration_ms;

                var output_str = '<tr><td><i class="fa fa-play-circle fa-lg" aria-hidden="true"></i><audio class="audio-sample"><source src="' + t.preview_url + '" type="audio/mpeg">Your browser does not support the audio element.</audio></td><td>' + t.name + '</td><td>';
                for (var i = 0; i < t.artists.length; i++) {
                    output_str += t.artists[i].name + (i < t.artists.length - 1 ? ', ' : '');
                }
                output_str += '<td><i class="fa fa-times fa-lg" aria-hidden="true"></i></td></tr>';
                $('#playlist-table').append(output_str);
            });

            $('p.duration').html(Math.floor(time_sum / 60000) + 'm ' + Math.floor(time_sum / 1000) % 60 + 's');

            // enable audio player
            $('#playlist-table tr').click(function(d) { 
                if (sample) {
                    sample.pause();
                    $('.fa-pause-circle').removeClass('fa-pause-circle').addClass('fa-play-circle');
                }
                if (sample == null || sample != d.currentTarget.children[0].children[1]) {
                    $(d.currentTarget.children[0].children[0]).addClass('fa-pause-circle').removeClass('fa-play-circle');
                    sample = d.currentTarget.children[0].children[1];
                    sample.play();
                }
            });
        });
    }
}

// called by buildSongList to start the song filtering process
function getSongData(tracks) {
    uris = [ ];
    for (var i = 0; i < tracks.length; i++) {
        uris.push(tracks[i].track.uri.replace('spotify:track:',''));
    }
    spotify.track.getMultipleAudioFeatures(uris, filterSongs, null);
}

function filterSongs(r) {
    var tracks = r.audio_features;

    for (var i = 0; i < tracks.length; i++) {
        var goodSong = true;
        for (var k in preset_params) {
            param = preset_params[k];
            track_val = tracks[i][k];

            if (track_val < param.min || track_val > param.max) {
                goodSong = false;
                break;
            }
        }
        if (goodSong) playlist_tracks.push(tracks[i].id);
    }
}



/****** GLOBAL VARS *********/
var preset_params = {
    danceability: {
        min: 0.8,
        max: 1
    },
    liveness: {
        min: 0,
        max: 0.1
    }
};

var playlist_tracks = [ ];

var scopes = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-read-private',
    // 'user-library-modify',
    // 'user-read-birthdate',
    // 'user-read-email',
    // 'user-follow-read',
    // 'user-follow-modify',
    // 'user-top-read'
];

var logged_in = spotify.login.pullAccessToken(none, false);

// hash of page names and their corresponding id values
var PAGES = {
    login: 'login',
    presets: 'preset-select',
}

var sample = null;



/******* RUNNING CODE ********/
$(document).ready(function() {

    // log in code
    $('#login').click(function() {
        spotify.login.openLogin(scopes);
    });

    if (logged_in) {
        console.log('user logged in');
        spotify.login.getUserInfo(none, 'yes');
        setPage(PAGES['presets']);
    } else {
        setPage(PAGES['login']);
    }

    $('button#build').click(function() {
        console.log('you clicked the button');
        spotify.library.getTracks('US', buildSongList, null);
    });


    // In order to setup a page change on click in html, add a data-dest
    // attribute to the link or button, where the value of data-dest is the id
    // of the page you want to show.

    $('.page a, .page button').filter('[data-dest]').click(function() {
        setPage($(this).data('dest'));
    });

    // hides all pages, and then shows the page with id = newPage
    function setPage(newPage) {
        $('.page').hide();
        if (newPage != PAGES['presets'] || logged_in) {
            $('#' + newPage).show();
        }
    }
});


