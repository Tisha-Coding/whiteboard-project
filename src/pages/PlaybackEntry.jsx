import { useEffect } from 'react'
import { EntryPage } from '../components/EntryPage'

const PlaybackEntry = () => {
  useEffect(() => { sessionStorage.removeItem('pb_locked_room') }, [])
  return (
    <EntryPage
      title="Playback"
      description="Replay the saved checkpoint timeline for any Collab room."
      buttonLabel="Open Playback"
      buttonColor="#22c55e"
      pathPrefix="/playback"
    />
  )
}

export default PlaybackEntry
