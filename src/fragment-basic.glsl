#version 300 es
 
precision mediump float;

in vec2 v_texcoord;
in vec4 v_texcolor;
in vec4 v_bgcolor;
uniform sampler2D u_texture;
 
out vec4 outColor;
 
void main() {
  /* outColor = vec4(1, 0, 0.5, 1); */
  vec4 clr = texture(u_texture, v_texcoord);
  float tm = (clr.r + clr.g + clr.b) / 3.0;
  outColor = mix(v_bgcolor, v_texcolor * clr, clr.a);
  /* outColor = clr; */
}
