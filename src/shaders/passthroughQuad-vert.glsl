#version 300 es

in vec4 vs_Pos; 
out vec3 fs_Pos;

out vec2 fs_uv;


void main() {

    fs_uv = vs_Pos.xy * .5 + .5;
    gl_Position = vs_Pos;
}