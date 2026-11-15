import {makeHandle} from './util.js'

/*
Create a citation, optionally together with a new note.

`data` is the payload of grampsjs-form-new-citation; the note text
(StyledText) is in `_note`. Returns {handle} or {error}.
*/
export async function postCitationWithNote(appState, data, options = {}) {
  const {_note: noteText, ...citation} = data
  const citHandle = citation.handle || makeHandle()
  const newCitation = {_class: 'Citation', ...citation, handle: citHandle}
  if (noteText) {
    const noteHandle = makeHandle()
    const noteResp = await appState.apiPost(
      '/api/notes/',
      {_class: 'Note', handle: noteHandle, type: 'Citation', text: noteText},
      options
    )
    if ('error' in noteResp) {
      return {error: noteResp.error}
    }
    newCitation.note_list = [...(newCitation.note_list || []), noteHandle]
  }
  const citResp = await appState.apiPost(
    '/api/citations/',
    newCitation,
    options
  )
  if ('error' in citResp) {
    return {error: citResp.error}
  }
  return {handle: citHandle}
}
