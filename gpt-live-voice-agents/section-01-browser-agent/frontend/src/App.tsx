import {
  useRef,
  useState,
} from "react"

function waitForIceGathering(
  peerConnection: RTCPeerConnection
) {
  if (
    peerConnection.iceGatheringState === "complete"
  ) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    function handleStateChange() {
      if (
        peerConnection.iceGatheringState ===
        "complete"
      ) {
        peerConnection.removeEventListener(
          "icegatheringstatechange",
          handleStateChange
        );

        resolve()
      }
    }

    peerConnection.addEventListener(
      "icegatheringstatechange",
      handleStateChange
    )
  })
}

function App() {
  const [status, setStatus] = useState("Disconnected")

  const [connected, setConnected] = useState(false)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  const dataChannelRef = useRef<RTCDataChannel | null>(null)

  const microphoneRef = useRef<MediaStream | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  function cleanup() {
    microphoneRef.current
      ?.getTracks()
      .forEach((track) => track.stop())

    dataChannelRef.current?.close()

    peerConnectionRef.current?.close()

    if (audioRef.current) {
      audioRef.current.srcObject = null
    }

    microphoneRef.current = null
    dataChannelRef.current = null
    peerConnectionRef.current = null

    setConnected(false)
  }

  async function startConversation() {
    try {
      setStatus("Requesting microphone...")

      const peerConnection = new RTCPeerConnection()

      peerConnectionRef.current = peerConnection

      peerConnection.ontrack = (event) => {
        if (!audioRef.current) {
          return
        }

        audioRef.current.srcObject = new MediaStream([event.track])
      }

      const microphone = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      microphoneRef.current = microphone

      for (
        const track of microphone.getAudioTracks()
      ) {
        peerConnection.addTrack(
          track,
          microphone
        )
      }

      const dataChannel = peerConnection.createDataChannel("oai-events")

      dataChannelRef.current = dataChannel

      dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);

        console.log(
          "GPT-Live event:",
          data
        )

        if (
          data.type === "session.started"
        ) {
          setConnected(true);
          setStatus("Connected")
        }

        if (
          data.type === "session.closed"
        ) {
          cleanup()
          setStatus("Disconnected")
        }
      }

      const offer = await peerConnection.createOffer()

      await peerConnection.setLocalDescription(offer)

      await waitForIceGathering(peerConnection)

      const sdp = peerConnection.localDescription?.sdp

      console.log(sdp)

      if (!sdp) {
        throw new Error(
          "Failed to create SDP offer"
        )
      }

      setStatus("Connecting...")

      const response = await fetch(
        "/api/session",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            sdp,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          "Failed to create session"
        )
      }

      const result = await response.json()

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: result.transport.sdp,
      })
    } catch (error) {
      console.error(error)

      cleanup()

      setStatus("Connection failed")
    }
  }

  function endConversation() {
    const dataChannel = dataChannelRef.current

    if (
      dataChannel?.readyState === "open"
    ) {
      setStatus("Ending...")

      dataChannel.send(
        JSON.stringify({
          type: "session.close",
        })
      )

      return
    }

    cleanup()

    setStatus("Disconnected")
    setConnected(false)
  }

  return (
    <main>
      <h1>GPT-Live Voice Assistant</h1>

      <p>Status: {status}</p>

      {!connected ? (
        <button
          onClick={startConversation}
          disabled={status !== "Disconnected"}
        >
          Start Conversation
        </button>
      ) : (
        <button onClick={endConversation}>
          End Conversation
        </button>
      )}

      <audio
        ref={audioRef}
        autoPlay
      />
    </main>
  );
}

export default App;