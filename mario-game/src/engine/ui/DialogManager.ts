export interface Dialog {
  text: string
  x: number
  y: number
  width: number
  height: number
  duration: number
  startTime: number
  type: 'teasing' | 'story' | 'info'
}

import { TextToSpeechManager } from './TextToSpeechManager'

export class DialogManager {
  private activeDialogs: Dialog[] = []
  private dialogQueue: Dialog[] = []
  private lastQuoteType: string | null = null
  private ttsManager: TextToSpeechManager

  constructor() {
    this.ttsManager = new TextToSpeechManager()
  }

  public addDialog(text: string, x: number, y: number, type: 'teasing' | 'story' | 'info' = 'teasing', duration: number = 3000): void {
    const dialog: Dialog = {
      text,
      x,
      y,
      width: 0, // Width and height will be calculated by renderer for captions
      height: 0,
      duration,
      startTime: Date.now(),
      type
    }

    this.dialogQueue.push(dialog)

    // Speak the dialog if TTS is enabled
    this.ttsManager.speak(text, type)
  }

  public update(): void {
    const currentTime = Date.now()

    // Add dialogs from queue if no active dialogs
    if (this.activeDialogs.length === 0 && this.dialogQueue.length > 0) {
      this.activeDialogs.push(this.dialogQueue.shift()!)
    }

    // Remove expired dialogs
    this.activeDialogs = this.activeDialogs.filter(dialog => {
      const elapsed = currentTime - dialog.startTime
      return elapsed < dialog.duration
    })
  }

  public getActiveDialogs(): Dialog[] {
    return this.activeDialogs
  }

  public clearDialogs(): void {
    this.activeDialogs = []
    this.dialogQueue = []
  }

  public getLastQuoteType(): string | null {
    return this.lastQuoteType
  }

  public setLastQuoteType(type: string | null): void {
    this.lastQuoteType = type
  }

  public hasActiveDialogs(): boolean {
    return this.activeDialogs.length > 0
  }

  // Text-to-speech control methods
  public setTTSEnabled(enabled: boolean): void {
    this.ttsManager.setEnabled(enabled)
  }

  public isTTSEnabled(): boolean {
    return this.ttsManager.isEnabled()
  }

  public stopTTS(): void {
    this.ttsManager.stop()
  }
}