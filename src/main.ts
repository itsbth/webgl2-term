import runes from "runes";
import GlTerminal from "./GlTerminal";
import GlyphMap from "./GlyphMap";
import TermWriter from "./TermWriter";
import typeSound from "../type.ogg";
import moveSound from "../move.ogg";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
const nextFrame = () => new Promise(res => requestAnimationFrame(res));

const termCv = document.querySelector("#term") as HTMLCanvasElement;
const glyphs =
  (document.querySelector("#glyphs") as HTMLCanvasElement | undefined) ||
  document.createElement("canvas");
const inp = document.querySelector("input") as HTMLInputElement;

function pullEvent<T extends Event>(
  target: EventTarget,
  name: string,
): Promise<T> {
  return new Promise(res => {
    const eh: EventListener = (evt: Event) => {
      target.removeEventListener(name, eh);
      res(evt as T);
    };
    target.addEventListener(name, eh);
  });
}

function select<R>(
  all: { [T in keyof R]: Promise<R[T]> },
): Promise<Partial<R>> {
  return Promise.race(
    Object.entries<Promise<{}>>(all).map(
      ([key, value]) =>
        (value.then((value: unknown) => ({
          [key as keyof R]: value,
        })) as unknown) as Partial<R>,
    ),
  );
}

((document.fonts && document.fonts.ready) || Promise.resolve()).then(
  async () => {
    const map = new GlyphMap(glyphs);
    map.getGlyph(""); // force load the font
    await delay(500);
    const term = new GlTerminal(termCv, map);
    const writer = new TermWriter(term, /* autoflush = */ true);
    writer.setFg([0, 1, 0, 1]);
    writer.writeLine("Type something");
    while (true) {
      const { press, down } = await select({
        down: pullEvent<KeyboardEvent>(window, "keydown"),
        press: pullEvent<KeyboardEvent>(window, "keypress"),
      });
      if (press) {
        if (press.key === "Enter") {
          new Audio(moveSound).play();
          continue;
        }
        new Audio(typeSound).play();
        writer
          .backspace(1)
          .write(press.key)
          // .flip()
          .write("_")
          // .flip()
          .flush();
      } else if (down) {
        switch (down.key) {
          case "Enter":
            writer.writeLine("");
            break;
          case "Backspace":
            writer
              .backspace(1)
              .write(" ")
              .backspace(1)
              .flush();
            break;
        }
      }
    }
  },
);
