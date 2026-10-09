# GPT-Live 1 Voice Agents

Course examples for building browser and phone voice agents with GPT-Live.

## Requirements

- [Bun](https://bun.sh/docs/installation).
- An OpenAI API key with access to `gpt-live-1`; Sections 2 and 3 also use `gpt-5.6-luna`.
- A microphone for browser examples; a voice-enabled Twilio number and ngrok for the phone example.

## Run a section

Follow the setup and run commands in each section's README:

| Section | Example |
| --- | --- |
| [Section 1](gpt-live-voice-agents/section-01-browser-agent/README.md) | Browser voice agent |
| [Section 2](gpt-live-voice-agents/section-02-tools-and-agents/README.md) | Tools and specialist agents |
| [Section 3](gpt-live-voice-agents/section-03-phone-agent/README.md) | Twilio phone agent |

Run one section at a time: all backends use port `3000` by default. Install dependencies in the application folders; there is no root start command.
