jQuery(document).ready(function($) {
	if (window.conf) {
		const conference = JSON.parse(window.conf)
		const conferenceSorted = sortByDate(conference)
		console.log(conference)
		var lastTime = ''
		var lastDate = ''
		for (const talk in conferenceSorted) {
			const thisTalk = conference.talks[conferenceSorted[talk]]
			const thisTime = thisTalk.start
			const thisDate = thisTalk.date.replace(/2018\.0*/, '').replace(/\./, '/').replace(/09/, '9')
			var timeDivider = ''
			var dateDivider = ''
			if (thisTime !== lastTime) timeDivider = `<div class="divider">${thisTime}</div>`
			if (thisDate !== lastDate) dateDivider = `<div class="divider">${thisDate}</div>`
			lastTime = thisTime
			lastDate = thisDate
			$('#content').append(`
				${dateDivider}
				${timeDivider}
				<div class="talk" id="${talk}">
					<div class="talk-location">${thisTalk.location.replace(/^.*in 101/, '101').replace(/^.*in Octavius/, 'Octavius')}</div>
					<div class="talk-title">${thisTalk.title}</div>
				</div>
			`)
		}
	} else { 
		console.log('could not load conference')
	}
})
function sortByDate(conference) {
	let sorted = {}
	let unsorted = {}
	for (const talk in conference.talks) {
		const thisTalk = conference.talks[talk]
		const id = `${thisTalk.date}.${thisTalk.start.replace(/:/g, '.')}.${slug(thisTalk.location)}-${talk}` 
		unsorted[id] = talk
	}
	Object.keys(unsorted).sort().forEach(function(id) { sorted[id] = unsorted[id] })
	return sorted
}

function slug(name) {
  return name.toLowerCase()
    .replace(/^\s*/, '')
    .replace(/\s*$/, '')
    .replace(/&quot\;/g, ' ')
    .replace(/\s\s/g, ' ')
    .replace(/\s/g, '-')
    .replace(/[^0-9a-z-]/g, '')
    .replace(/-$/, '')
}