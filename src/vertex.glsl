#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;
in vec2 a_texcoord;
in vec4 a_texcolor;
in vec4 a_bgcolor;

uniform vec2 u_resolution;

out vec2 v_texcoord;
out vec4 v_texcolor;
out vec4 v_bgcolor;
// all shaders have a main function
void main() {
  vec2 tr_q = a_position / u_resolution;
  vec2 tr_d = tr_q * 2.0;
  vec2 cl = tr_d - 1.0;
  v_texcoord = a_texcoord;
  v_texcolor = a_texcolor;
  v_bgcolor = a_bgcolor;
  gl_Position = vec4(cl, 0, 1);
}
