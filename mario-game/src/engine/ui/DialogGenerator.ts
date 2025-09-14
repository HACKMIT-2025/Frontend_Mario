import { DialogManager } from './DialogManager'
import { OpenRouterClient } from '../api/OpenRouterClient'

export interface DialogQuote {
  failure: string[]
  time: string[]
  distance: string[]
  victory: string[]
}

export class DialogGenerator {
  private dialogManager: DialogManager
  private openRouterClient: OpenRouterClient | null = null
  private useAI = false
  private lastAIQuote = ''

  // Fallback quotes for when AI is not available
  private quotes: DialogQuote = {
    failure: [
      "Are you even trying, or is this just a new form of modern art?",
      "My grandma could do this. And she thinks 'Pong' is a high-tech marvel.",
      "Don't worry, everyone's a winner! Just... not you.",
      "I've seen slower progression in a snail race. And the snails were hibernating.",
      "You've died so many times, I think you're getting a frequent flyer discount in the underworld.",
      "That's a bold strategy, but it's not working. At all.",
      "Did you get distracted by a butterfly? A digital one, I mean."
    ],
    time: [
      "My circuits are getting dusty waiting for you. Maybe take a break and Google 'how to play video games'?",
      "Are you sure you're not trying to set a world record for the longest game ever?",
      "Are you lost? Or are you just trying to absorb the sheer beauty of this level?",
      "Hellooooo? The game is still on, you know.",
      "I've had entire operating systems install faster than you're moving right now.",
      "This isn't a museum tour; it's a video game. The 'Go' button is not just for decoration."
    ],
    distance: [
      "I appreciate your love for solitude, but the finish line is this way, not in the next time zone.",
      "Lost your map, did we? The bad guys are getting restless; they miss you.",
      "Helloooo? Earth to player! We've got a game to finish. I'll even buy you a virtual coffee.",
      "You're a natural-born adventurer... at getting lost.",
      "You're going the wrong way! Unless you're trying to find a secret level. If so, good luck with that.",
      "This isn't 'Mario: The Existential Journey.' Just keep moving forward."
    ],
    victory: [
      "Well, well... I guess even a broken clock is right twice a day.",
      "Congratulations! You managed to find the finish line. GPS would be proud.",
      "Victory! Only took you... *checks watch* ...forever.",
      "You did it! I was starting to think you'd taken up permanent residence here.",
      "Finally! I was beginning to compose your eulogy.",
      "Success! My circuits were getting worried about you.",
      "You won! I suppose miracles do happen. Even digital ones."
    ]
  }

  constructor(dialogManager: DialogManager) {
    this.dialogManager = dialogManager
  }

  // Configure OpenRouter API
  public configureOpenRouter(apiKey: string): void {
    if (apiKey && apiKey.trim()) {
      this.openRouterClient = new OpenRouterClient(apiKey.trim())
      this.useAI = true
      console.log('OpenRouter AI teasing system configured successfully!')
    } else {
      console.warn('Invalid OpenRouter API key provided')
    }
  }

  // Test OpenRouter connection
  public async testOpenRouterConnection(): Promise<boolean> {
    if (!this.openRouterClient) {
      console.warn('OpenRouter client not configured')
      return false
    }

    try {
      const isConnected = await this.openRouterClient.testConnection()
      if (isConnected) {
        console.log('OpenRouter connection test successful!')
      } else {
        console.warn('OpenRouter connection test failed')
      }
      return isConnected
    } catch (error) {
      console.error('OpenRouter connection test error:', error)
      return false
    }
  }

  // Disable AI and use fallback quotes
  public disableAI(): void {
    this.useAI = false
    this.openRouterClient = null
    console.log('AI teasing system disabled, using fallback quotes')
  }

  // Enable AI (requires configured API key)
  public enableAI(): boolean {
    if (this.openRouterClient) {
      this.useAI = true
      console.log('AI teasing system enabled')
      return true
    } else {
      console.warn('Cannot enable AI: OpenRouter client not configured')
      return false
    }
  }

  public isAIEnabled(): boolean {
    return this.useAI
  }

  private calculateDistance(playerX: number, playerY: number, finishX: number, finishY: number): number {
    const distance = Math.sqrt((playerX - finishX) ** 2 + (playerY - finishY) ** 2)
    return Math.floor(distance)
  }

  private getRandomQuote(type: keyof DialogQuote): string {
    const quotes = this.quotes[type]
    return quotes[Math.floor(Math.random() * quotes.length)]
  }

  public getLastAIQuote(): string {
    return this.lastAIQuote
  }

  public async generateTeasingQuote(
    numDeaths: number,
    timeElapsed: number,
    playerCoords: { x: number, y: number },
    finishCoords: { x: number, y: number }
  ): Promise<string | null> {
    // Define thresholds for each condition
    const DEATH_THRESHOLD = 3
    const TIME_THRESHOLD = 10 // seconds
    const DISTANCE_THRESHOLD = 500 // pixels

    // Calculate distance using the helper function
    const distanceFromGoal = this.calculateDistance(
      playerCoords.x, playerCoords.y,
      finishCoords.x, finishCoords.y
    )

    const lastQuoteType = this.dialogManager.getLastQuoteType()

    // Check conditions in order of priority
    let quoteType: keyof DialogQuote | null = null
    if (numDeaths >= DEATH_THRESHOLD && lastQuoteType !== 'failure') {
      quoteType = 'failure'
    } else if (timeElapsed > TIME_THRESHOLD && lastQuoteType !== 'time') {
      quoteType = 'time'
    } else if (distanceFromGoal > DISTANCE_THRESHOLD && lastQuoteType !== 'distance') {
      quoteType = 'distance'
    }

    if (!quoteType) {
      return null
    }

    this.dialogManager.setLastQuoteType(quoteType)

    // Try AI-generated quote first if enabled
    if (this.useAI && this.openRouterClient) {
      try {
        const gameContext = {
          numDeaths,
          timeElapsed,
          playerCoords,
          finishCoords,
          distanceFromGoal,
          lastQuoteType: quoteType
        }

        const aiQuote = await this.openRouterClient.generateTeasingQuote(gameContext)
        if (aiQuote && aiQuote.trim()) {
          this.lastAIQuote = aiQuote
          console.log('Generated AI teasing quote:', aiQuote)
          return aiQuote
        }
      } catch (error) {
        console.warn('Failed to generate AI quote, falling back to static quotes:', error)
      }
    }

    // Fallback to static quotes
    const quote = this.getRandomQuote(quoteType)
    return quote
  }

  public async showTeasingQuote(
    numDeaths: number,
    timeElapsed: number,
    playerCoords: { x: number, y: number },
    finishCoords: { x: number, y: number }
  ): Promise<void> {
    const quote = await this.generateTeasingQuote(numDeaths, timeElapsed, playerCoords, finishCoords)
    if (quote) {
      // Position dialog at bottom of screen (captions will position themselves)
      // x and y are ignored by the caption renderer, but we pass them for API consistency
      this.dialogManager.addDialog(quote, 0, 0, 'teasing', 4000)
    }
  }

  public async generateVictoryQuote(
    numDeaths: number,
    timeElapsed: number,
    coins: number
  ): Promise<string | null> {
    // Try AI-generated quote first if enabled
    if (this.useAI && this.openRouterClient) {
      try {
        const gameContext = {
          numDeaths,
          timeElapsed,
          coins,
          isVictory: true
        }

        const aiQuote = await this.openRouterClient.generateVictoryQuote(gameContext)
        if (aiQuote && aiQuote.trim()) {
          this.lastAIQuote = aiQuote
          console.log('Generated AI victory quote:', aiQuote)
          return aiQuote
        }
      } catch (error) {
        console.warn('Failed to generate AI victory quote, falling back to static quotes:', error)
      }
    }

    // Fallback to static quotes
    const quote = this.getRandomQuote('victory')
    return quote
  }

  public async showVictoryQuote(
    numDeaths: number,
    timeElapsed: number,
    coins: number
  ): Promise<void> {
    const quote = await this.generateVictoryQuote(numDeaths, timeElapsed, coins)
    if (quote) {
      // Display victory quote for longer duration
      this.dialogManager.addDialog(quote, 0, 0, 'info', 6000)
    }
  }
}