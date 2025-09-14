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

export class OpenRouterClient {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'
  private model = 'meta-llama/llama-3.3-70b-instruct'

  constructor(apiKey: string) {
    this.apiKey = apiKey
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

      const request: OpenRouterRequest = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a witty, sarcastic AI that provides humorous teasing commentary for a Mario-style platformer game.
Your responses should be:
- Funny and witty, not mean-spirited
- Very brief (maximum 15-20 words, 1-2 short sentences)
- Relevant to the player's current situation
- In English
- Similar in tone to the examples provided
- Concise enough to fit on 2 lines as game captions

Respond with ONLY the teasing quote, no additional text or formatting.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 50
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Mario Game Dialog System'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
      }

      const data: OpenRouterResponse = await response.json()

      if (data.error) {
        throw new Error(`OpenRouter API error: ${data.error}`)
      }

      if (data.choices && data.choices.length > 0 && data.choices[0].message.content) {
        return data.choices[0].message.content.trim()
      }

      return null
    } catch (error) {
      console.error('Error generating teasing quote from OpenRouter:', error)
      return null
    }
  }

  async generateVictoryQuote(
    gameContext: {
      numDeaths: number
      timeElapsed: number
      coins: number
      isVictory: boolean
    }
  ): Promise<string | null> {
    try {
      const prompt = this.buildVictoryPrompt(gameContext)

      const request: OpenRouterRequest = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a witty, sarcastic AI that provides humorous victory congratulation commentary for a Mario-style platformer game.
Your responses should be:
- Funny and teasingly congratulatory, not mean-spirited
- Very brief (maximum 15-20 words, 1-2 short sentences)
- Relevant to the player's victory performance
- In English
- Similar in tone to the examples provided
- Concise enough to fit on 2 lines as game captions
- A backhanded compliment or teasing congratulation

Respond with ONLY the victory quote, no additional text or formatting.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 50
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Mario Game Dialog System'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
      }

      const data: OpenRouterResponse = await response.json()

      if (data.error) {
        throw new Error(`OpenRouter API error: ${data.error}`)
      }

      if (data.choices && data.choices.length > 0 && data.choices[0].message.content) {
        return data.choices[0].message.content.trim()
      }

      return null
    } catch (error) {
      console.error('Error generating victory quote from OpenRouter:', error)
      return null
    }
  }

  private buildTeasingPrompt(context: {
    numDeaths: number
    timeElapsed: number
    playerCoords: { x: number; y: number }
    finishCoords: { x: number; y: number }
    distanceFromGoal: number
    lastQuoteType?: string | null
  }): string {
    const { numDeaths, timeElapsed, playerCoords, finishCoords, distanceFromGoal, lastQuoteType } = context

    let situation = ''

    if (numDeaths >= 3) {
      situation = `The player has died ${numDeaths} times and is struggling badly.`
    } else if (timeElapsed > 30) {
      situation = `The player has been playing for ${Math.floor(timeElapsed)} seconds and is taking a long time.`
    } else if (distanceFromGoal > 500) {
      situation = `The player is ${Math.floor(distanceFromGoal)} pixels away from the goal and seems lost.`
    } else if (numDeaths >= 1) {
      situation = `The player has died ${numDeaths} time${numDeaths > 1 ? 's' : ''}.`
    } else {
      situation = `The player has been playing for ${Math.floor(timeElapsed)} seconds.`
    }

    const examples = `Examples of teasing quotes (similar tone):
- "Are you even trying, or is this just a new form of modern art?"
- "My grandma could do this. And she thinks 'Pong' is a high-tech marvel."
- "Don't worry, everyone's a winner! Just... not you."
- "I've seen slower progression in a snail race. And the snails were hibernating."
- "You've died so many times, I think you're getting a frequent flyer discount in the underworld."
- "That's a bold strategy, but it's not working. At all."
- "Did you get distracted by a butterfly? A digital one, I mean."
- "My circuits are getting dusty waiting for you. Maybe take a break and Google 'how to play video games'?"
- "Are you sure you're not trying to set a world record for the longest game ever?"
- "Are you lost? Or are you just trying to absorb the sheer beauty of this level?"
- "Hellooooo? The game is still on, you know."
- "I've had entire operating systems install faster than you're moving right now."
- "This isn't a museum tour; it's a video game. The 'Go' button is not just for decoration."
- "I appreciate your love for solitude, but the finish line is this way, not in the next time zone."
- "Lost your map, did we? The bad guys are getting restless; they miss you."
- "Helloooo? Earth to player! We've got a game to finish. I'll even buy you a virtual coffee."
- "You're a natural-born adventurer... at getting lost."
- "You're going the wrong way! Unless you're trying to find a secret level. If so, good luck with that."
- "This isn't 'Mario: The Existential Journey.' Just keep moving forward."`

    return `Current game situation: ${situation}
Player position: (${Math.floor(playerCoords.x)}, ${Math.floor(playerCoords.y)})
Goal position: (${Math.floor(finishCoords.x)}, ${Math.floor(finishCoords.y)})
Last quote type: ${lastQuoteType || 'none'}

Generate a witty, teasing quote in a similar style to these examples, but shorter:
${examples}

Provide a **brief**, funny teasing quote based on the current situation (within one sentence):`
  }

  private buildVictoryPrompt(context: {
    numDeaths: number
    timeElapsed: number
    coins: number
    isVictory: boolean
  }): string {
    const { numDeaths, timeElapsed, coins } = context

    let performance = ''
    
    if (numDeaths === 0) {
      performance = `The player completed the level without dying! Perfect run!`
    } else if (numDeaths === 1) {
      performance = `The player died once but still won.`
    } else if (numDeaths <= 3) {
      performance = `The player died ${numDeaths} times but managed to win.`
    } else {
      performance = `The player died ${numDeaths} times but somehow still won.`
    }

    performance += ` Time taken: ${Math.floor(timeElapsed)} seconds.`
    if (coins > 0) {
      performance += ` Coins collected: ${coins}.`
    }

    const examples = `Examples of teasing victory quotes (similar tone):
- "Well, well... I guess even a broken clock is right twice a day."
- "Congratulations! You managed to find the finish line. GPS would be proud."
- "Victory! Only took you... *checks watch* ...forever."
- "You did it! I was starting to think you'd taken up permanent residence here."
- "Finally! I was beginning to compose your eulogy."
- "Success! My circuits were getting worried about you."
- "You won! I suppose miracles do happen. Even digital ones."
- "Victory achieved! I'm updating my 'impossible things' database."
- "You made it! I was already planning your memorial service."
- "Success! Even a blind squirrel finds a nut sometimes."`

    return `Victory situation: ${performance}

Generate a witty, teasingly congratulatory quote similar to these examples:
${examples}

Provide a **brief**, funny victory quote that's a backhanded compliment (within one sentence):`
  }

  async testConnection(): Promise<boolean> {
    try {
      const request: OpenRouterRequest = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test. Please respond with "Test successful"'
          }
        ],
        max_tokens: 10
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Mario Game Dialog System'
        },
        body: JSON.stringify(request)
      })

      return response.ok
    } catch (error) {
      console.error('OpenRouter connection test failed:', error)
      return false
    }
  }
}