import runes = require("runes");
import GlTerminal from "./GlTerminal";
type Color = [number, number, number, number];
export default class TermWriter {
  private fg: Color = [1, 1, 1, 1];
  private bg: Color = [0, 0, 0, 0];
  private col: number;
  private row: number;
  private pendingFlush: boolean = false;
  constructor(private term: GlTerminal, private autoFlush: boolean = false) {
    this.col = 0;
    this.row = term.rows - 1;
  }
  public write(what: string): this {
    for (const ch of runes(what)) {
      if (this.col >= this.term.cols - 1 || ch === "\n") {
        this.term.scroll(1);
        this.col = 0;
        if (ch === "\n") {
          if (this.autoFlush) {
            this.term.render();
          }
          continue;
        }
      }
      if (ch === "\r") {
        this.col = 0;
        continue;
      }
      this.term.setChar(this.col, this.row, ch, this.fg, this.bg);
      this.col += 1;
    }
    return this;
  }
  public writeLine(what: string): this {
    this.write(what + "\n");
    return this;
  }
  public backspace(n: number): this {
    this.col = Math.max(0, this.col - n);
    return this;
  }
  public setFg(col: Color): this {
    this.fg = col;
    return this;
  }
  public setBg(col: Color): this {
    this.bg = col;
    return this;
  }
  public flip(): this {
    const tmp = this.fg;
    this.fg = this.bg;
    this.bg = tmp;
    return this;
  }
  public flush(): this {
    if (!this.pendingFlush) {
      this.pendingFlush = true;
      requestAnimationFrame(() => {
        this.pendingFlush = false;
        this.term.render();
      });
    }
    return this;
  }
}
