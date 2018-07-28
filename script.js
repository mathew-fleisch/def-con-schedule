jQuery(document).ready(function($) {
	$(document).on('click', '.days_filter li', function() {
		// console.log($(this).attr('id'))
		const selectedDay = $(this).attr('id').replace(/day_filter_/, '')
		if (selectedDay.match(/all/)) {
			$('.divider, .talk').show()
		} else {
			$('.divider, .talk').hide()
			$(`.date_${selectedDay}`).show()
		}
	})
	$(document).on('click', '.talk-speakers li', function() {
		const thisSpeaker = $(this).attr('id')
		// console.log(thisSpeaker)
		if ($(`#${thisSpeaker}`).hasClass('selected')) {
			$(`#${thisSpeaker}`).removeClass('selected')
			$(`#bio-${thisSpeaker}`).hide()
		} else {
			$(`#${thisSpeaker}`).addClass('selected')
			$(`#bio-${thisSpeaker}`).show()
		}
	})
	$(document).on('click', '.talk-title', function() {
		const thisTalk = $(this).parent().parent().attr('id')
		// console.log(`thisTalk: ${thisTalk}`)

		if ($(this).hasClass('selected')) {
			// Talk open... close it
			$(this).removeClass('selected')
			$(`#${thisTalk} .talk-details`).hide()
			$(`#${thisTalk}`).css('background-color', 'transparent')
			$(`#${thisTalk} .talk-info`).removeClass('open')
			$(`#${thisTalk} .talk-location`).show()
		} else {
			// Talk closed... open it
			$(this).addClass('selected')
			$(`#${thisTalk} .talk-details`).show()
			$(`#${thisTalk}`).css('background-color', '#aaa')
			$(`#${thisTalk} .talk-info`).addClass('open')
			$(`#${thisTalk} .talk-location`).hide()
		}
	})
	var days = {}
	if (window.conf) {
		const conference = JSON.parse(window.conf)
		const conferenceSorted = sortByDate(conference)
		console.log(conference)
		var lastTime = ''
		var lastDate = ''
		for (const talk in conferenceSorted) {
			const thisTalk = conference.talks[conferenceSorted[talk]]

			// Display only unique dates
			const thisDate = thisTalk.date.replace(/2018\.0*/, '').replace(/\./, '/')
			var dateDivider = ''
			if (thisDate !== lastDate) {
				dateDivider = `<div class="divider date_divider date_${classify(thisDate)}">${thisDate}</div>`
				days[thisDate] = thisTalk.day
			}
			lastDate = thisDate

			// Display only unique times
			const thisTime = thisTalk.start
			var timeDivider = ''
			if (thisTime !== lastTime) timeDivider = `<div class="divider time_divider date_${classify(thisDate)} time_${classify(thisTime)}">${thisTime}</div>`
			lastTime = thisTime
			var category = (thisTalk.tags.length ? `<div class="details-categories"><strong>Categories:</strong> ${thisTalk.tags.join(', ')}</div>` : '')
			// Output
			$('#content').append(`
				${dateDivider}
				${timeDivider}
				<div class="talk date_${classify(thisDate)} time_${classify(thisTime)}" id="${idify(talk)}">
					<div class="talk-location">${clearWorkaround(thisTalk.location)}</div>
					<div class="talk-info">
						<div class="talk-title">${thisTalk.title}</div>
					</div>
					<div class="talk-details">
						<div class="details-location"><strong>Location:</strong> ${clearWorkaround(thisTalk.location)}</div>
						${category}
						<div class="details-duration"><strong>Duration:</strong> ${thisTalk.duration} minutes</div>
						<ul class="talk-speakers">${getSpeakerInfo(thisTalk.speakers, conference)}</ul>
						<div class="talk-abstract">${thisTalk.abstract}</div>
					</div>
				</div>
			`)
		}
	} else { 
		console.log('could not load conference')
	}
	drawFilters(days, window.lastUpdated)
})
function drawFilters(days, lastUpdated) {
	// console.log(`days: ${JSON.stringify(days, null, 2)}`)
	var dayList = ''
	for (var date in days) {
		dayList += `<li id="day_filter_${classify(date)}">${days[date]} ${date}</li>`
	}
	$('#sidebar').append(`
		<h3>Filters</h3>
		<ul class="days_filter">
			<li id="day_filter_all">all</li>
			${dayList}
		</ul>

		<hr />
		<div class="last-updated">Last Updated: ${lastUpdated}</div>
		`
	)	
}
function getSpeakerInfo(speakerIds, conference) {
	// console.log(speakerIds)
	// return speakerIds.join(' ')
	var ret = ''
	speakerIds.forEach(function(speakerId) {
		const thisSpeaker = conference.speakers[speakerId]
		// console.log(speakerId)
		ret += `<li id="${speakerId}">
			<strong>${thisSpeaker.name}</strong>
			${thisSpeaker.title}
			<div class="speaker-bio" id="bio-${speakerId}">${thisSpeaker.bio}</div>
		</li>`
	})
	return ret
}
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
function classify(str) {
	return str.replace(/\./g, '').replace(/^.*\//, '').replace(/\:/g, '')
}
function idify(str) {
	return str.replace(/\./g, '-')
}
function clearWorkaround(str) {
	return str.replace(/^.*in 101/, '101').replace(/^.*in Octavius/, 'Octavius')
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