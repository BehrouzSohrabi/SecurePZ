let password = 'hi'
chrome.storage.sync.set({
	[password]: +new Date(),
}, () => {
    console.log('saved')
});
chrome.storage.sync.get(null, (obj) => {
	console.log(obj)
});
chrome.storage.sync.clear(() => {
    console.log('removed')
})