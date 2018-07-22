'use strict'

const axios = require('axios')
const cheerio = require('cheerio')
const Log = require('debug-level')
const tz = require('timezone/loaded')
const format = require('date-format')
const fs = require('fs-extra')
const log = new Log('DC')

const url = (process.env.TARGET_URL ? process.env.TARGET_URL : 'https://www.defcon.org/html/defcon-26/dc-26-speakers.html')
// const updateCache = (process.env.UPDATE_CACHE ? process.env.UPDATE_CACHE : false)

log.log('Script started')

function getSchedule() {
  log.debug(`url: ${url}`)
  axios.get(url)
    .then((response) => {
      if(response.status === 200) {
        let conf = {
          'speakers': {},
          'talks': {}
        }
        const html = response.data
        //log.debug(html)
        const $ = cheerio.load(html)
        $('article').each((index, obj) => {
          if (index > -1) {
            log.debug(`index: ${index}`)
            log.debug(`name: ${obj.name}`)
            let processedTalk = processTalk($, obj)
            log.info(`return: ${JSON.stringify(processedTalk, null, 2)}`)
            conf.speakers = Object.assign(conf.speakers, processedTalk.speakers)
            let tmp = {}
            tmp[processedTalk.id] = processedTalk.talk
            conf.talks = Object.assign(conf.talks, tmp)
          }
        })
        let conference = {
          'speakers': {},
          'talks': {}
        }
        Object.keys(conf.speakers).sort().forEach(function(speakerId) {
          conference.speakers[speakerId] = conf.speakers[speakerId]
        })
        Object.keys(conf.talks).sort().forEach(function(talkId) {
          conference.talks[talkId] = conf.talks[talkId]
        })
        log.log(JSON.stringify(conference, null, 2))
        fs.writeFile('conference.json', JSON.stringify(conference), 'utf8')
        // return conference
      }
    }, (error) => { log.error(error) }
  )
}

function processTalk($, rawTalk) {
  if (typeof $(rawTalk).attr('id') === 'undefined') return {}
  // let talkId = $(rawTalk).attr('id')
  let talkId = ''
  let speakers = {}
  let talk = {'speakers': []}
  let name = ''
  let title = ''
  let nameId = ''
  let bio = ''
  let lastId = ''
  // log.info(`id: ${talkId}`)
  for(let i = 0; i < $(rawTalk).children().length; i++) {
    //console.log($(rawTalk).children().eq(i).text())
    let that = $(rawTalk).children().eq(i)
    log.debug(`${that.attr('class')}: ${that.html()}`)
    switch (that.attr('class')) {
      case 'talkTitle':
        talkId = slug(that.text())
        talk['title'] = sanitize(that.html())
        break
      case 'abstract':
        talk[that.attr('class')] = sanitize(that.html())
        break
      case 'details':
        let details = parseDetails(sanitize(that.text()))
        log.debug(`details: ${JSON.stringify(details, null, 2)}`)
        // talk[that.attr('class')] = details
        talk = Object.assign(talk, details)
        break
      case 'speaker':
        name = sanitize(that.html().replace(/<span.*$/, ''))
        nameId = slug(lastFirst(name))
        title = that.html().replace(/^.*speakerTitle\">\s*(.*)<\/span>.*/, '$1')
        speakers[nameId] = {
          'name': name,
          'title': title
        }
        talk['speakers'].push(nameId)
        break
      case 'speakerBio':
        name = sanitize(that.html()).replace(/^<strong>(.*)<\/strong>.*$/, '$1')
        // console.log(name)
        log.info(`name extracted: ${name}`)
        nameId = slug(lastFirst(name))
        log.info(`name id0: ${nameId}`)
        bio = sanitize(that.html()).replace(/^.*<\/strong>\s*<br>\s*/, '')
        if (!nameId) {
          nameId = lastId
          log.info(`nameId1: ${nameId}`)
          if (speakers.hasOwnProperty(nameId)) {
            speakers[nameId].bio += bio
          } else {
            log.error(`nameId3: ${nameId}`)
            log.warn(`that.html(): ${that.html()}`)
            log.warn(`bio: ${bio}`)
            log.warn(`speakers: ${JSON.stringify(speakers, null, 2)}`)
          }
        } else {
          lastId = nameId
          log.info(`nameId2: ${nameId}`)
          if (speakers.hasOwnProperty(nameId)) {
            speakers[nameId].bio = bio
          } else {
            log.error(`nameId4: ${nameId}`)
            log.warn(`that.html(): ${that.html()}`)
            log.warn(`bio: ${bio}`)
            log.warn(`speakers: ${JSON.stringify(speakers, null, 2)}`)
          }
        }
        break
      default:
        talk['abstract'] = sanitize(that.html())
        // console.log(`that.html(): ${that.html()}`)
        // log.error(`Unhandled variable: ${that.attr('class')}`)
        break
    }
  }
  return { 'id': talkId, 'talk': talk, 'speakers': speakers } 
}
function parseDetails(details) {
  let ret = {
    'fullDate': '',
    'date': '',
    'day': '',
    'start': '',
    'duration': 0,
    'location': '',
    'tags': [],
    'rawDetails': details
  }
  // Thursday 8/9
  // Friday 8/10
  // Saturday 8/11
  // Sunday 8/12
  log.debug(`details: ${details}`)

  // Get date variables from details
  // Noon workaroud
  details = details.replace(/at 12 /, 'at 12:00 ')
  let thisDate = details.replace(/^.*at (\d\d:\d\d).*/g, '$1')
  log.debug(`thisDate: ${thisDate}`)
  switch(true) {
    case /Thursday/.test(details):
      ret.date = new Date(`08/09/2018 ${thisDate}`)
      ret.day = 'Thursday'
      break
    case /Friday/.test(details):
      ret.date = new Date(`08/10/2018 ${thisDate}`)
      ret.day = 'Friday'
      break
    case /Saturday/.test(details):
      ret.date = new Date(`08/11/2018 ${thisDate}`)
      ret.day = 'Saturday'
      break
    case /Sunday/.test(details):
      ret.date = new Date(`08/12/2018 ${thisDate}`)
      ret.day = 'Sunday'
      break
  }
  if (ret.date) {
    ret.fullDate = tz(ret.date, '%c', 'en_US', 'America/Los_Angeles')
    ret.start = format('hh:mm', ret.date)
    ret.date = format('yyyy.MM.dd', ret.date)
  }

  // Get duration from details
  ret.duration = parseInt(details
    .replace(/^.*([0-9]{3}) minutes.*$/, '$1')
    .replace(/^.*([0-9]{2}) minutes.*$/, '$1')
  )
  if (!ret.duration) ret.duration = 0
  log.debug(`duration: ${ret.duration}`)

  // Get location from details
  if (details.match(/in/)) {
    ret.location = trim(details.replace(/^.*in (.*)\|.*$/, '$1').replace(/ \d* minutes.*/, ''))
  }

  // Get category "tags" from details
  if (details.match(/\|/) && !details.match(/\|$/)) {
    ret.tags = details.replace(/^.*\| /, '').split(/, */)
  }

  // Print return variable
  log.debug(JSON.stringify(ret, null, 2))
  return ret
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
function lastFirst(name) {
  name = trim(edgeCases(name))
  let nameSpl = name.split(/ /)
  let last = nameSpl.pop()
  nameSpl.unshift(last)
  if (last.match(/md/i) || last.match(/phd/i)) {
    last = nameSpl.pop()
    nameSpl.unshift(last)    
  }
  return trim(nameSpl.join(' '))
}
function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '')
}
function removeNewlinesAndTabs(str) {
  return removeDupSpaces(str
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
  )
}
function striptags(str) {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<br><br>/gi, '<br />')
}
function removeDupSpaces(str) {
  return str.replace(/\s\s*/g, ' ')
}
function sanitize(str) {
  return trim(
    removeDupSpaces(
      removeNewlinesAndTabs(
        striptags(str)
      )
    )
  )
}
function edgeCases(name) {
  return name
    .replace(/, a\.k\.a\. neural cowboy/, '')
    .replace(/.*Till Krause.*/, 'Till Krause')
    .replace(/.*suggy.*/i, 'suggy')
    .replace(/.*eckert.*/i, 'eckert')
}

getSchedule()

module.exports = getSchedule
