/* tslint:disable no-bitwise */
import * as twgl from "twgl.js";
import fragmentSource from "./fragment-basic.glsl";
import GlyphMap from "./GlyphMap";
import vertexSource from "./vertex.glsl";
import runes = require("runes");

export default class GlTerminal {
  private readonly gl: WebGL2RenderingContext;
  private programInfo!: twgl.ProgramInfo;
  private textures: { [key: string]: WebGLTexture };
  private buffers: twgl.BufferInfo;
  private texcoords: Float32Array;
  private texcolors: Float32Array;
  private bgcolors: Float32Array;
  private nrows: number;
  private ncols: number;
  private lastGen: number = 0;
  constructor(private cv: HTMLCanvasElement, private map: GlyphMap) {
    this.gl = cv.getContext("webgl2") as WebGL2RenderingContext;
    twgl.resizeCanvasToDisplaySize(this.gl.canvas);
    this.programInfo = twgl.createProgramInfo(
      this.gl,
      [vertexSource, fragmentSource],
      ["a_position", "a_texcoord", "a_texcolor", "a_bgcolor"],
    );
    this.textures = twgl.createTextures(this.gl, {
      glyphs: { src: this.map.canvas },
    });
    this.nrows = (this.cv.height / 32) | 0;
    this.ncols = (this.cv.width / this.map.emWidth) | 0;
    this.texcoords = new Float32Array(this.nrows * this.ncols * 6 * 2);
    this.texcolors = new Float32Array(this.nrows * this.ncols * 6 * 4);
    this.bgcolors = new Float32Array(this.nrows * this.ncols * 6 * 4);
    this.buffers = twgl.createBufferInfoFromArrays(this.gl, {
      a_position: { numComponents: 2, data: this.generateTriangles() },
      a_texcoord: { numComponents: 2, data: this.texcoords },
      a_texcolor: { numComponents: 4, data: this.texcolors },
      a_bgcolor: { numComponents: 4, data: this.bgcolors },
    });
  }
  public render() {
    if (this.lastGen !== this.map.generation) {
      this.textures = twgl.createTextures(this.gl, {
        glyphs: { src: this.map.canvas },
      });
      this.lastGen = this.map.generation;
    }
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    const uniforms = {
      u_resolution: [this.gl.canvas.width, this.gl.canvas.height],
      u_texture: this.textures.glyphs,
    };
    twgl.setAttribInfoBufferFromArray(
      this.gl,
      this.buffers.attribs.a_texcoord,
      this.texcoords,
    );
    twgl.setAttribInfoBufferFromArray(
      this.gl,
      this.buffers.attribs.a_texcolor,
      this.texcolors,
    );
    twgl.setAttribInfoBufferFromArray(
      this.gl,
      this.buffers.attribs.a_bgcolor,
      this.bgcolors,
    );
    this.gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.buffers);
    twgl.setUniforms(this.programInfo, uniforms);
    twgl.drawBufferInfo(this.gl, this.buffers, this.gl.TRIANGLES);
    // setTimeout(() => this.render(), 1000);
  }
  public setChar(x: number, y: number, ch: string, color?: number[], bgColor?: number[]) {
    const info = this.map.getGlyph(ch);
    const idx = (y * this.ncols + x) * 6 * 2;
    if (idx + 12 >= this.texcoords.length) {
      return;
    }
    const xs = info.x / 1024;
    const ys = info.y / 1024;
    const xe = xs + info.w / 1024;
    const ye = ys + 32 / 1024;
    // const xs = 0;
    // const ys = 0;
    // const xe = 1;
    // const ye = 1;
    this.texcoords.set(
      [
        // first tri
        xs,
        ye,
        xs,
        ys,
        xe,
        ys,
        // second tri
        xs,
        ye,
        xe,
        ye,
        xe,
        ys,
      ],
      idx,
    );
    if (color) {
      this.texcolors.set(color, idx * 2);
      this.texcolors.set(color, idx * 2 + 4);
      this.texcolors.set(color, idx * 2 + 8);

      this.texcolors.set(color, idx * 2 + 12);
      this.texcolors.set(color, idx * 2 + 16);
      this.texcolors.set(color, idx * 2 + 20);
    }
    if (bgColor) {
      this.bgcolors.set(bgColor, idx * 2);
      this.bgcolors.set(bgColor, idx * 2 + 4);
      this.bgcolors.set(bgColor, idx * 2 + 8);

      this.bgcolors.set(bgColor, idx * 2 + 12);
      this.bgcolors.set(bgColor, idx * 2 + 16);
      this.bgcolors.set(bgColor, idx * 2 + 20);
    }
  }
  public writeString(str: string, sx: number, sy: number, color?: number[]) {
    let x = sx;
    for (const ch of runes(str)) {
      this.setChar(x, sy, ch, color);
      x += 1;
    }
  }
  public scroll(n: number) {
    if (n > 0) {
      const start = n * this.ncols * 6 * 2;
      this.texcoords.copyWithin(0, start);
      this.texcolors.copyWithin(0, start * 2);
      this.bgcolors.copyWithin(0, start * 2);
      this.texcoords.fill(0, this.texcoords.length - start);
      // this.texcoords.fill(0);
    }
  }
  public get rows() {
    return this.nrows;
  }
  public get cols() {
    return this.ncols;
  }
  private generateTriangles(): Float32Array {
    const rows = (this.cv.height / 32) | 0;
    const cols = (this.cv.width / this.map.emWidth) | 0;
    const arr = new Float32Array(rows * cols * 6 * 2);
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const xs = x * this.map.emWidth;
        const ys = y * 32;
        const xe = xs + this.map.emWidth;
        const ye = ys + 32;
        arr.set(
          [
            // first tri
            xs,
            ys,
            xs,
            ye,
            xe,
            ye,
            // second tri
            xs,
            ys,
            xe,
            ys,
            xe,
            ye,
          ],
          ((rows - y - 1) * cols + x) * 6 * 2,
        );
      }
    }
    return arr;
  }
}
