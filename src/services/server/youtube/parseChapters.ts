/**
 * Interface for a chapter object
 */
export interface Chapter {
  start: number;
  title: string;
}

/**
 * Make a chapter parser. Looks for the `startRx`, and then matches chapters with support for empty lines between them.
 *
 * @param {RegExp} startRx - A regular expression matching the start of a chapter list. This does not have to contain any capture groups.
 * @param {RegExp} lineRx - A regular expression to match each chapter line. This should have four capture groups, in two sections:
 *   The timestamp:
 *   - hours
 *   - minutes
 *   - seconds
 *
 *   The title:
 *   - text
 *
 * @param {number} timestampIndex - The index of the start of the timestamp capture group.
 * @param {number} textIndex - The index of the text capture group.
 */
function makeChapterParser(startRx: RegExp, lineRx: RegExp, timestampIndex: number, textIndex: number): (description: string) => Chapter[] {
    // The first match element is the input, which will never be either the full timestamp or full title
    timestampIndex += 1
    textIndex += 1

    return function (description: string): Chapter[] {
        const chapters: Chapter[] = []

        const firstTimestamp = description.search(startRx)
        if (firstTimestamp === -1) {
            return chapters
        }

        const chapterLines = description.slice(firstTimestamp).split('\n')
        for (let i = 0; i < chapterLines.length; i += 1) {
            const line = chapterLines[i].trim()
            
            // Skip empty lines instead of breaking
            if (!line) {
                continue
            }

            const match = lineRx.exec(line)
            if (!match) {
                // Only break if it's not an empty line and doesn't match
                break
            }

            const hours = match[timestampIndex] !== undefined ? parseInt(match[timestampIndex], 10) : 0
            const minutes = parseInt(match[timestampIndex + 1], 10)
            const seconds = parseInt(match[timestampIndex + 2], 10)
            const title = match[textIndex].trim()

            chapters.push({
                start: hours * 60 * 60 + minutes * 60 + seconds,
                title: title.trim()
            })
        }

        return chapters
    }
}

/**
 * Add the /m regex flag.
 * @param {RegExp} regex - The regular expression to modify
 * @returns {RegExp} - The modified regular expression with the 'm' flag
 */
function addM(regex: RegExp): RegExp {
    if (regex.flags.indexOf('m') === -1) {
        return new RegExp(regex.source, regex.flags + 'm')
    }
    return regex
}

// $timestamp $title
const lawfulParser = makeChapterParser(/^0?0:00/m, /^(?:(\d+):)?(\d+):(\d+)\s+(.*?)$/, 0, 3)
// [$timestamp] $title
const bracketsParser = makeChapterParser(/^\[0?0:00\]/m, /^\[(?:(\d+):)?(\d+):(\d+)\]\s+(.*?)$/, 0, 3)
// ($timestamp) $title
const parensParser = makeChapterParser(/^\(0?0:00\)/m, /^\((?:(\d+):)?(\d+):(\d+)\)\s+(.*?)$/, 0, 3)
// $timestamp-$title (hyphen separator)
const hyphenParser = makeChapterParser(/^0?0:00:00-/m, /^(?:(\d+):)?(\d+):(\d+)-(.*?)$/, 0, 3)
// ($track_id. )$title $timestamp
const postfixRx = /^(?:\d+\.\s+)?(.*)\s+(?:(\d+):)?(\d+):(\d+)$/
const postfixParser = makeChapterParser(addM(postfixRx), postfixRx, 1, 0)
// ($track_id. )$title ($timestamp)
const postfixParenRx = /^(?:\d+\.\s+)?(.*)\s+\(\s*(?:(\d+):)?(\d+):(\d+)\s*\)$/
const postfixParenParser = makeChapterParser(addM(postfixParenRx), postfixParenRx, 1, 0)
// $track_id. $timestamp $title
const prefixRx = /^\d+\.\s+(?:(\d+):)?(\d+):(\d+)\s+(.*)$/
const prefixParser = makeChapterParser(addM(prefixRx), prefixRx, 0, 3)

/**
 * Parse YouTube chapters from a video description
 * @param {string} description - The YouTube video description
 * @returns {Chapter[]} - Array of parsed chapters
 */
export default function parseYouTubeChapters(description: string): Chapter[] {
    let chapters = lawfulParser(description)
    if (chapters.length === 0) chapters = bracketsParser(description)
    if (chapters.length === 0) chapters = parensParser(description)
    if (chapters.length === 0) chapters = hyphenParser(description)
    if (chapters.length === 0) chapters = postfixParser(description)
    if (chapters.length === 0) chapters = postfixParenParser(description)
    if (chapters.length === 0) chapters = prefixParser(description)

    return chapters
}
