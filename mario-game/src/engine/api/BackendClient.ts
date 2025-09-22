export interface OpenRouterRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  error?: string
}

export class BackendClient {
  private backendUrl: string

  constructor() {
    // Get backend URL from environment, fallback to local development
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  }

  async generateTeasingQuote(
    gameContext: {
      numDeaths: number
      timeElapsed: number
      playerCoords: { x: number; y: number }
      finishCoords: { x: number; y: number }
      distanceFromGoal: number
      lastQuoteType?: string | null
    }
  ): Promise<string | null> {
    try {
      const prompt = this.buildTeasingPrompt(gameContext)


      // Use the backend's game dialog endpoint
      const response = await fetch(`${this.backendUrl}/api/chat/openrouter/game-dialog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context: prompt,
          dialog_type: 'teaser',
          player_state: gameContext,
          max_length: 100
        })
      })

      if (!response.ok) {
        console.error('Backend request failed:', response.status, response.statusText)
        return this.getFallbackQuote(gameContext)
      }

      const data = await response.json()
      return data.dialog || this.getFallbackQuote(gameContext)

    } catch (error) {
      console.error('Error generating teasing quote via backend:', error)
      return this.getFallbackQuote(gameContext)
    }
  }

  async generateVictoryMessage(
    gameStats: {
      totalDeaths: number
      timeElapsed: number
      completionPercentage: number
    }
  ): Promise<string | null> {
    try {
      const context = `Player completed the level! Deaths: ${gameStats.totalDeaths}, Time: ${Math.floor(gameStats.timeElapsed / 1000)}s, Completion: ${gameStats.completionPercentage}%`

      const response = await fetch(`${this.backendUrl}/api/chat/openrouter/game-dialog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context: context,
          dialog_type: 'victory',
          player_state: gameStats,
          max_length: 80
        })
      })

      if (!response.ok) {
        console.error('Backend request failed:', response.status, response.statusText)
        return this.getFallbackVictoryMessage()
      }

      const data = await response.json()
      return data.dialog || this.getFallbackVictoryMessage()

    } catch (error) {
      console.error('Error generating victory message via backend:', error)
      return this.getFallbackVictoryMessage()
    }
  }

  private buildTeasingPrompt(gameContext: any): string {
    const { numDeaths, timeElapsed, distanceFromGoal, lastQuoteType } = gameContext
    const timeSeconds = Math.floor(timeElapsed / 1000)

    let contextualInfo = []

    if (numDeaths > 0) {
      contextualInfo.push(`died ${numDeaths} times`)
    }

    if (timeSeconds > 30) {
      contextualInfo.push(`been playing for ${timeSeconds} seconds`)
    }

    if (distanceFromGoal > 0) {
      contextualInfo.push(`still ${Math.floor(distanceFromGoal)} units from the goal`)
    }

    const context = contextualInfo.length > 0 ? contextualInfo.join(', ') : 'just started playing'

    let avoidanceNote = ''
    if (lastQuoteType) {
      avoidanceNote = ` Don't repeat the same style as last time (${lastQuoteType}).`
    }

    return `Player has ${context}. Generate a brief, witty teasing comment to motivate them.${avoidanceNote}`
  }

  private getFallbackQuote(gameContext: any): string {
    const fallbackQuotes = [
      "Come on, you can do better than that!",
      "The princess is getting impatient!",
      "Maybe try jumping next time?",
      "Bowser is laughing at you right now!",
      "That was... interesting.",
      "Did you forget how to run?",
      "The goombas called, they want their walking skills back!",
      "Even Luigi could do better!",
      "Are you playing with your feet?",
      "The finish line isn't going anywhere!"
    ]

    // Select based on number of deaths for some variety
    const index = gameContext.numDeaths % fallbackQuotes.length
    return fallbackQuotes[index]
  }

  private getFallbackVictoryMessage(): string {
    const fallbackMessages = [
      "Finally! Well done!",
      "About time! Congratulations!",
      "You did it! Only took you forever!",
      "Victory at last! The princess is saved!",
      "Not bad... for a human!",
      "Congratulations! Bowser is defeated!"
    ]

    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]
  }

  // Health check method
  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/`)
      const data = await response.json()
      return data.status === 'healthy'
    } catch (error) {
      console.error('Backend health check failed:', error)
      return false
    }
  }

  // Update backend URL if needed
  updateBackendUrl(url: string): void {
    this.backendUrl = url
  }

  getBackendUrl(): string {
    return this.backendUrl
  }
}