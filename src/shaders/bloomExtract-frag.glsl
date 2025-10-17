#version 300 es
precision highp float;

uniform sampler2D u_Scene;

in vec3 fs_Pos;

out vec4 out_Col;

in vec2 fs_uv;




void main() {

    // extract the brightest parts
    vec3 color = texture(u_Scene, fs_uv).rgb;

    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float threshold = 0.1;
    float mask = step(threshold, luminance);
    // mask = smoothstep(threshold, threshold + 0.2, luminance);

    float intensity = 0.5;
    vec3 brightest = color * mask * intensity;





    out_Col = vec4(brightest, 1.);
}
