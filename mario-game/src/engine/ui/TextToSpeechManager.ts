export class TextToSpeechManager {
  private synth: SpeechSynthesis | undefined
  private voices: SpeechSynthesisVoice[] = []
  private enabled = true
  private currentVoice: SpeechSynthesisVoice | null = null

  constructor() {
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.loadVoices()

      // Some browsers load voices asynchronously
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices()
        }
      }
    } else {
      console.warn('Text-to-speech not supported in this browser')
      this.enabled = false
    }
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices()

    // Try to find a good English voice
    this.currentVoice = this.voices.find(voice =>
      voice.lang.startsWith('en') && voice.name.toLowerCase().includes('google')
    ) || this.voices.find(voice =>
      voice.lang.startsWith('en') && voice.name.toLowerCase().includes('male')
    ) || this.voices.find(voice =>
      voice.lang.startsWith('en')
    ) || this.voices[0] || null
  }

  public speak(text: string, type: 'teasing' | 'story' | 'info' = 'teasing'): void {
    if (!this.enabled || !this.synth) {
      return
    }

    // Stop any current speech
    this.synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    // Set voice if available
    if (this.currentVoice) {
      utterance.voice = this.currentVoice
    }

    // Adjust speech properties based on dialog type
    switch (type) {
      case 'teasing':
        utterance.rate = 0.9 // Slightly slower for comedic effect
        utterance.pitch = 0.9 // Slightly lower pitch
        break
      case 'story':
        utterance.rate = 1.0 // Normal rate
        utterance.pitch = 1.0 // Normal pitch
        break
      case 'info':
        utterance.rate = 1.1 // Slightly faster for info
        utterance.pitch = 1.0 // Normal pitch
        break
      default:
        utterance.rate = 0.9
        utterance.pitch = 0.9
    }

    // Set volume (slightly reduced to not be too intrusive)
    utterance.volume = 0.7

    // Speak the text
    this.synth.speak(utterance)
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stop()
    }
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  public setVoice(voice: SpeechSynthesisVoice): void {
    this.currentVoice = voice
  }
}