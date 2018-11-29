export interface IGlyphEntry {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default class GlyphMap {
  private readonly ctx: CanvasRenderingContext2D;
  private map: { [key: string]: IGlyphEntry } = {};
  private next: number = 0;
  private lx: number = 0;
  private ly: number = 0;
  private readonly em: number;
  constructor(private cv: HTMLCanvasElement) {
    this.cv.width = 1024;
    this.cv.height = 1024;
    this.ctx = this.cv.getContext("2d")!;
    this.ctx.font = '30px "Glass TTY", monospace';
    this.ctx.fillStyle = "white"; // we only care about alpha channel
    const emi = this.ctx.measureText("M");
    this.em = emi.width;
  }
  public getGlyph(glyph: string): IGlyphEntry {
    if (this.map[glyph]) {
      return this.map[glyph];
    }
    return this.renderGlyph(glyph);
  }
  private renderGlyph(glyph: string): IGlyphEntry {
    // const xp = (this.next % 32) * 32;
    // // tslint:disable-next-line:no-bitwise
    // const yp = ((this.next / 32) | 0) * 32;
    this.next += 1;
    // this.ctx.textBaseline = "bottom";
    const inf = this.ctx.measureText(glyph);
    let w = this.em;
    if (inf.width > 1.5 * this.em) {
      this.next += 1;
      w *= 2;
    }
    if (this.lx + inf.width > 1024) {
      this.lx = 0;
      this.ly += 32;
    }
    const xp = this.lx;
    const yp = this.ly
    this.lx += inf.width + 2;
    this.ctx.fillText(glyph, xp, yp + (inf.fontBoundingBoxAscent || 30));
    return (this.map[glyph] = {
      x: xp,
      y: yp,
      // w: inf.actualBoundingBoxLeft + inf.actualBoundingBoxRight,
      w: inf.width,
      h: inf.fontBoundingBoxAscent + inf.fontBoundingBoxDescent,
    });
  }
  get canvas(): HTMLCanvasElement {
    return this.cv;
  }
  get emWidth(): number {
    return this.em;
  }
  get generation(): number {
    return this.next;
  }
}
