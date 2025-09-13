export class Polygon {
  public contours: number[][] // Array of [x, y] points in world coordinates
  public type: string
  public solid = true
  public breakable = false
  public isGoal = false

  constructor(contours: number[][], type = 'polygon') {
    this.contours = contours
    this.type = type
  }

  public getBounds() {
    if (this.contours.length === 0) {
      return { left: 0, right: 0, top: 0, bottom: 0 }
    }

    let minX = this.contours[0][0]
    let maxX = this.contours[0][0]
    let minY = this.contours[0][1]
    let maxY = this.contours[0][1]

    for (let i = 1; i < this.contours.length; i++) {
      const pointX = this.contours[i][0]
      const pointY = this.contours[i][1]

      minX = Math.min(minX, pointX)
      maxX = Math.max(maxX, pointX)
      minY = Math.min(minY, pointY)
      maxY = Math.max(maxY, pointY)
    }

    return {
      left: minX,
      right: maxX,
      top: minY,
      bottom: maxY
    }
  }

  public contains(x: number, y: number): boolean {
    return this.pointInPolygon(x, y)
  }

  private pointInPolygon(px: number, py: number): boolean {
    let inside = false
    const n = this.contours.length

    if (n < 3) return false

    let p1x = this.contours[0][0]
    let p1y = this.contours[0][1]

    for (let i = 1; i <= n; i++) {
      const p2x = this.contours[i % n][0]
      const p2y = this.contours[i % n][1]

      if (py > Math.min(p1y, p2y)) {
        if (py <= Math.max(p1y, p2y)) {
          if (px <= Math.max(p1x, p2x)) {
            if (p1y !== p2y) {
              const xinters = (py - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
              if (p1x === p2x || px <= xinters) {
                inside = !inside
              }
            }
          }
        }
      }
      p1x = p2x
      p1y = p2y
    }

    return inside
  }

  public intersects(other: Polygon): boolean {
    const thisBounds = this.getBounds()
    const otherBounds = other.getBounds()

    if (thisBounds.right < otherBounds.left ||
        otherBounds.right < thisBounds.left ||
        thisBounds.bottom < otherBounds.top ||
        otherBounds.bottom < thisBounds.top) {
      return false
    }

    return true
  }

  public getSegments() {
    const segments = []
    const n = this.contours.length

    for (let i = 0; i < n; i++) {
      const p1 = this.contours[i]
      const p2 = this.contours[(i + 1) % n]
      segments.push({
        x1: p1[0],
        y1: p1[1],
        x2: p2[0],
        y2: p2[1]
      })
    }

    return segments
  }
}