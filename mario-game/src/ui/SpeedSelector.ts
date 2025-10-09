/**
 * Speed Selector UI Component
 * Allows players to select their movement speed before starting the game
 */

export interface SpeedOption {
  name: string
  multiplier: number
  description: string
  emoji: string
}

export class SpeedSelector {
  private container: HTMLDivElement
  private onSelectCallback: ((multiplier: number) => void) | null = null

  private speedOptions: SpeedOption[] = [
    {
      name: 'Slow',
      multiplier: 0.7,
      description: 'Perfect for beginners',
      emoji: '🐢'
    },
    {
      name: 'Normal',
      multiplier: 1.0,
      description: 'Standard game speed',
      emoji: '🏃'
    },
    {
      name: 'Fast',
      multiplier: 1.3,
      description: 'Challenge your reflexes',
      emoji: '⚡'
    },
    {
      name: 'Extreme',
      multiplier: 1.6,
      description: 'For expert players',
      emoji: '🚀'
    }
  ]

  constructor() {
    this.container = this.createContainer()
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div')
    container.id = 'speed-selector-modal'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `

    const modal = document.createElement('div')
    modal.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.3s ease-out;
    `

    // Title
    const title = document.createElement('h2')
    title.textContent = '🎮 Select Game Speed'
    title.style.cssText = `
      color: white;
      font-size: 32px;
      font-weight: bold;
      margin: 0 0 10px 0;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    `

    const subtitle = document.createElement('p')
    subtitle.textContent = 'Choose your preferred movement speed and start playing!'
    subtitle.style.cssText = `
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      margin: 0 0 30px 0;
      text-align: center;
    `

    // Speed options grid
    const optionsGrid = document.createElement('div')
    optionsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    `

    this.speedOptions.forEach((option) => {
      const optionCard = this.createOptionCard(option)
      optionsGrid.appendChild(optionCard)
    })

    // Keyboard hint
    const hint = document.createElement('p')
    hint.textContent = '💡 Tip: Use arrow keys ← → to select, press Enter to confirm'
    hint.style.cssText = `
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      text-align: center;
      margin: 20px 0 0 0;
    `

    modal.appendChild(title)
    modal.appendChild(subtitle)
    modal.appendChild(optionsGrid)
    modal.appendChild(hint)
    container.appendChild(modal)

    // Add CSS animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .speed-option-card {
        transition: all 0.2s ease;
      }
      .speed-option-card:hover {
        transform: translateY(-5px) scale(1.05);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      }
      .speed-option-card:active {
        transform: scale(0.95);
        opacity: 0.8;
      }
      .speed-option-card.selected {
        transform: scale(1.08);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.8), 0 10px 30px rgba(0, 0, 0, 0.4);
      }
      @media (max-width: 768px) {
        .speed-option-card {
          min-height: 140px;
        }
      }
    `
    document.head.appendChild(style)

    return container
  }

  private createOptionCard(option: SpeedOption): HTMLDivElement {
    const card = document.createElement('div')
    card.className = 'speed-option-card'
    card.dataset.multiplier = option.multiplier.toString()
    card.style.cssText = `
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 15px;
      padding: 30px 20px;
      cursor: pointer;
      text-align: center;
      backdrop-filter: blur(10px);
      touch-action: manipulation;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    `

    const emoji = document.createElement('div')
    emoji.textContent = option.emoji
    emoji.style.cssText = `
      font-size: 48px;
      margin-bottom: 10px;
    `

    const name = document.createElement('div')
    name.textContent = option.name
    name.style.cssText = `
      color: white;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    `

    const description = document.createElement('div')
    description.textContent = option.description
    description.style.cssText = `
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      margin-bottom: 10px;
    `

    const multiplierText = document.createElement('div')
    multiplierText.textContent = `${option.multiplier}x Speed`
    multiplierText.style.cssText = `
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      font-weight: 500;
    `

    card.appendChild(emoji)
    card.appendChild(name)
    card.appendChild(description)
    card.appendChild(multiplierText)

    // Prevent double-click/double-tap
    let isProcessing = false

    const handleSelection = (e: Event) => {
      if (isProcessing) return
      isProcessing = true

      e.preventDefault()
      e.stopPropagation()

      // Visual feedback
      card.style.transform = 'scale(0.95)'
      setTimeout(() => {
        card.style.transform = ''
      }, 100)

      this.selectOption(option.multiplier)

      // Reset after selection completes
      setTimeout(() => {
        isProcessing = false
      }, 500)
    }

    // Touch events for mobile (better responsiveness)
    card.addEventListener('touchstart', (e) => {
      e.preventDefault()
      card.style.transform = 'scale(0.95)'
      card.style.opacity = '0.8'
    }, { passive: false })

    card.addEventListener('touchend', (e) => {
      card.style.transform = ''
      card.style.opacity = '1'
      handleSelection(e)
    }, { passive: false })

    // Click event for desktop
    card.addEventListener('click', handleSelection)

    return card
  }

  private selectOption(multiplier: number) {
    // Visual feedback
    const cards = this.container.querySelectorAll('.speed-option-card')
    cards.forEach(card => {
      if ((card as HTMLElement).dataset.multiplier === multiplier.toString()) {
        card.classList.add('selected')
      } else {
        card.classList.remove('selected')
      }
    })

    // Wait a bit for visual feedback, then trigger callback
    setTimeout(() => {
      if (this.onSelectCallback) {
        this.onSelectCallback(multiplier)
      }
      this.hide()
    }, 300)
  }

  public show(): Promise<number> {
    return new Promise((resolve) => {
      // Set default selection to normal speed
      const normalCard = this.container.querySelector('[data-multiplier="1"]')
      if (normalCard) {
        normalCard.classList.add('selected')
      }

      this.onSelectCallback = (multiplier: number) => {
        resolve(multiplier)
      }

      document.body.appendChild(this.container)

      // Keyboard navigation
      let currentIndex = 1 // Start at normal speed
      const updateSelection = () => {
        const cards = Array.from(this.container.querySelectorAll('.speed-option-card'))
        cards.forEach((card, index) => {
          if (index === currentIndex) {
            card.classList.add('selected')
          } else {
            card.classList.remove('selected')
          }
        })
      }

      const keyHandler = (e: KeyboardEvent) => {
        const cards = Array.from(this.container.querySelectorAll('.speed-option-card'))

        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            currentIndex = Math.max(0, currentIndex - 1)
            updateSelection()
            e.preventDefault()
            break
          case 'ArrowRight':
          case 'ArrowDown':
            currentIndex = Math.min(cards.length - 1, currentIndex + 1)
            updateSelection()
            e.preventDefault()
            break
          case 'Enter':
          case ' ':
            const selectedCard = cards[currentIndex] as HTMLElement
            if (selectedCard) {
              const multiplier = parseFloat(selectedCard.dataset.multiplier || '1')
              this.selectOption(multiplier)
              document.removeEventListener('keydown', keyHandler)
            }
            e.preventDefault()
            break
        }
      }

      document.addEventListener('keydown', keyHandler)
    })
  }

  public hide() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
  }
}
