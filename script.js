// clear settings and history on storage
// chrome.storage.sync.clear(() => {})

let settings = {
	length: 12,
	lowercase: true,
	uppercase: true,
	numbers: true,
	symbols: true,
	ambiguous: false,
	save: false,
	theme: !window.matchMedia('(prefers-color-scheme: dark)').matches,
};
let history = [];

let password = '';
let showFeedback;
let hideFeedback;

let length = document.getElementById("length");
let lengthValue = document.getElementById("length-value");
let passwordInput = document.getElementById('password');
let historyList = document.getElementById('history-list');

init();

// initialize app
function init() {
	chrome.storage.sync.get('settings', (data_settings) => {
		if (!isEmpty(data_settings.settings)) {
			settings = data_settings.settings;
		}
		chrome.storage.sync.get('history', (data_history) => {
			if (!isEmpty(data_history.history)) {
				history = data_history.history;
			}
            populateSettings();
			populateHistory();
            generate();
            applyTheme();
		});
	});
}

// populate settings checkboxes and slider
function populateSettings () {
    // length
    lengthValue.innerHTML = length.value = settings.length
    // checkboxes
    Object.keys(settings).forEach((item) => {
        if (item == 'length' || item == 'theme') return
        document.getElementById('button-'+item).firstElementChild.className = settings[item] ? 'checkbox active' : 'checkbox'
    })
    // save storage
    chrome.storage.sync.set({'settings': settings})
}

// generate password
function generate() {
	// filter allowed characters
	let characters = [
		settings.lowercase ? 'abcdefghjkmnpqrstuvwxyz' : '',
		settings.uppercase ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : '',
		settings.numbers ? '23456789' : '',
		settings.symbols ? '!?@#$%^&*+=' : '',
		settings.ambiguous ? 'iIl1oO0()[].`~;:_-' : '',
	].join('');
    // check
    if (characters.length < 1){
        characters = 'HAha'
    }
	// generate
	password = Array(settings.length)
		.fill(characters)
		.map(function (x) {
			return x[Math.floor(Math.random() * x.length)];
		})
		.join('');
	passwordInput.value = password;
	// copy to clipboard
	setTimeout(() => {
		copy();
	}, 200);
	// save to history
	if (settings.save) {
		history = [...history.slice(-19), [password, +new Date()]];
        chrome.storage.sync.set({'history': history})
	}
}

// copy to clipboard
function copy() {
	passwordInput.select();
	passwordInput.setSelectionRange(0, 99999);
	try {
		document.execCommand('copy');
		promptFeedback();
	} catch (e) {
		navigator.clipboard.writeText(passwordInput.value).then(() => {
			promptFeedback();
		});
	}
}

// copied to clipboard feedback
function promptFeedback() {
	clearTimeout(showFeedback);
	clearTimeout(hideFeedback);
	document.getElementById('feedback').className = '';
	showFeedback = setTimeout(() => {
		document.getElementById('feedback').className = 'show';
	}, 100);
	hideFeedback = setTimeout(() => {
		document.getElementById('feedback').className = '';
	}, 2000);
}

function applyTheme() {
	document.body.className = settings.theme ? '' : 'dark'
    chrome.storage.sync.set({'settings': settings})
}

function clearHistory() {
	chrome.storage.sync.remove('history', () => {
		history = [];
		populateHistory();
	});
}

function populateHistory() {
    let list = ''
    if (history.length > 0) {
        document.getElementById('button-clear').classList.remove('hidden')
        history.forEach((item) => {
            list = `<li>${item[0]}<span>${ago(item[1])}</span><li>` + list
        });
    }else{
        document.getElementById('button-clear').classList.add('hidden')
        list = 'Nothing has been saved yet!'
    }
    historyList.innerHTML = list;
}

function toggleCustomize() {
    document.getElementById('customize').classList.toggle('hidden');
}

function toggleHistory() {
    document.getElementById('main').classList.toggle('hidden');
    document.getElementById('history').classList.toggle('hidden');
    populateHistory()
}

// button click actions
function buttonClick(action) {
	switch (action) {
		case 'copy':
			copy();
			break;
		case 'generate':
			generate();
			break;
		case 'theme':
			settings.theme = !settings.theme;
			applyTheme();
			break;
		case 'customize':
			toggleCustomize();
			break;
        case 'history':
        case 'back':
			toggleHistory();
			break;
        case 'clear':
            clearHistory()
            break;
        case 'lowercase':
        case 'uppercase':
        case 'numbers':
        case 'symbols':
        case 'ambiguous':
        case 'save':
		default:
			settings[action] = !settings[action];
            populateSettings()
			break;
	}
}

// buttons and inputs listeners
['copy', 'generate', 'theme', 'customize', 'history', 'back', 'clear', 'lowercase', 'uppercase', 'numbers', 'symbols', 'ambiguous', 'save'].forEach((button) => {
    document.getElementById('button-' + button).addEventListener( 'click', () => {
        buttonClick(button);
    }, false);
});
length.oninput = function() {
    settings.length = +this.value
    populateSettings()
}

// helpers
function isEmpty(obj) {
	return typeof obj != 'object' || Object.keys(obj).length === 0;
}

function ago(time) {
    let seconds = Math.floor((+new Date() - time)/1000)
    let interval = Math.floor(seconds / 31536000)
    if (interval > 1) return suffix(interval, "year");
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return suffix(interval, "month");
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return suffix(interval, "day");
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return suffix(interval, "hour");
    interval = Math.floor(seconds / 60);
    if (interval > 1) return suffix(interval, "minute");
    return suffix(Math.floor(seconds), "second");
}

function suffix(value, fix){
    return value + ' ' + fix + (value > 1 ? 's': '') + ' ago'
}