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
		const thisSpeaker = $(this).attr('id').replace(/^talk-/, '')
		// console.log(thisSpeaker)
		if ($(`#talk-${thisSpeaker}`).hasClass('selected')) {
			$(`#talk-${thisSpeaker}`).removeClass('selected')
			$(`#bio-${thisSpeaker}`).hide()
		} else {
			$(`#talk-${thisSpeaker}`).addClass('selected')
			$(`#bio-${thisSpeaker}`).show()
		}
	})
	$(document).on('click', '.section-selector li', function() {
		const thisSection = $(this).attr('id')
		// console.log(`thisSection: ${thisSection}`)
		switch(thisSection) {
			case 'talks-selector':
				$('#talks-container').show()
				$('#speakers-container').hide()
        $('#talk-filters').show()
        $('#speaker-filters').hide()
  			break
			case 'speakers-selector':
				$('#talks-container').hide()
				$('#speakers-container').show()
        $('#talk-filters').hide()
        $('#speaker-filters').show()
  			break
      default:
        console.error('Whaaaacha doing?')
        break
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
			$(`#${thisTalk}`).css('background-color', '#444')
			$(`#${thisTalk} .talk-info`).addClass('open')
			$(`#${thisTalk} .talk-location`).hide()
		}
	})
	let days = {}
  let letters = []
  let countTalks = {}
	if (window.conf) {
		const conference = JSON.parse(window.conf)
		// Build talks section
		const conferenceSorted = sortByDate(conference)
		// console.log(conference)
		let lastTime = ''
		let lastDate = ''
		for (const talk in conferenceSorted) {
			const thisTalk = conference.talks[conferenceSorted[talk]]

      thisTalk.speakers.forEach(function (speakerId) {
        if (!countTalks.hasOwnProperty(speakerId)) countTalks[speakerId] = []
        countTalks[speakerId].push(`${thisTalk.title} - ${thisTalk.fullDate}`)
      })

			// Display only unique dates
			const thisDate = thisTalk.date.replace(/2018\.0*/, '').replace(/\./, '/')
			let dateDivider = ''
			if (thisDate !== lastDate) {
				dateDivider = `<div class="divider date_divider date_${classify(thisDate)}">${thisTalk.day} ${thisDate}<span class="toTop"><a href="#">Back to top</a></span></div>`
				days[thisDate] = thisTalk.day
			}
			lastDate = thisDate

			// Display only unique times
			const thisTime = thisTalk.start
			let timeDivider = ''
			if (thisTime !== lastTime) timeDivider = `<div class="divider time_divider date_${classify(thisDate)} time_${classify(thisTime)}">${thisTime}</div>`
			lastTime = thisTime
			let category = (thisTalk.tags.length ? `<div class="details-categories"><strong>Categories:</strong> ${thisTalk.tags.join(', ')}</div>` : '')
			// Output
			$('#talks-container').append(`
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

    // console.log(JSON.stringify(countTalks, null, 2))

    // Build speakers section
    let lastLetter = ''
    let trig = false
    for (const speaker in conference.speakers) {
      const thisSpeaker = conference.speakers[speaker]
      // console.log(`${speaker}: ${JSON.stringify(thisSpeaker, null, 2)}`)
      // console.log(speaker.charAt(0))
      if (lastLetter !== speaker.charAt(0)) {
        lastLetter = speaker.charAt(0)
        $('#speakers-container').append(`<div class="letter-divider" id="letter-${lastLetter}">${lastLetter}<span class="toTop"><a href="#">Back to top</a></span></div>`)
        letters.push(`<li><a href="#letter-${lastLetter}">${lastLetter}</a></li>`)
        trig = true
      }

      $('#speakers-container').append(`
        <div class="speaker ${trig ? 'first-speaker' : ''}">
          <strong>${thisSpeaker.name}</strong> - ${thisSpeaker.title}
          <div class="bio" id="speaker-bio-${speaker}">${thisSpeaker.bio}</div>
          <br />
          <h4>Talk${countTalks[speaker].length > 1 ? 's' : ''}:</h4>
          <ul class="speaker-talks"><li>${countTalks[speaker].join('</li><li>')}</li></ul>
        </div>
      `)
      trig = false
    }
	} else { 
		console.log('could not load conference')
	}
	drawFilters(days, window.lastUpdated, letters)
})
function drawFilters(days, lastUpdated, letters) {
	// console.log(`days: ${JSON.stringify(days, null, 2)}`)
	let dayList = ''
	for (let date in days) {
		dayList += `<li id="day_filter_${classify(date)}">${days[date]} ${date}</li>`
	}
	$('#sidebar').append(`
    <h3>Sections</h3>

    <ul class="section-selector">
      <li id="talks-selector">Talks</li>
      <li id="speakers-selector">Speakers</li>
    </ul>
    <span id="talk-filters">
      <hr />
  		<h3>Talk Filters</h3>
  		<ul class="days_filter">
  			<li id="day_filter_all">all</li>
  			${dayList}
  		</ul>
    </span>
    <span id="speaker-filters">
      <hr />

      <h3>Jump To</h3>
      <ul class="speaker-jump">${letters.join('\n')}</ul>
    </span>
		<hr />
		<div class="last-updated">Last Updated: ${lastUpdated}</div>
		`
	)	
}
function getSpeakerInfo(speakerIds, conference) {
	// console.log(speakerIds)
	// return speakerIds.join(' ')
	let ret = ''
	speakerIds.forEach(function(speakerId) {
		const thisSpeaker = conference.speakers[speakerId]
		// console.log(speakerId)
		ret += `<li id="talk-${speakerId}">
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