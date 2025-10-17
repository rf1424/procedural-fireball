#version 300 es
precision highp float;

uniform sampler2D u_Scene; // original
uniform sampler2D u_Bloom; // extracted bright parts
uniform vec2 u_Resolution;
uniform float u_Time;
in vec2 fs_uv;
out vec4 out_Col;


vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), 
                         dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float voronoi(vec2 uv, float gridSize, out vec2 closestGrid) {

    vec2 st = uv * gridSize;

    vec2 i = floor(st);
    vec2 f = fract(st);


    float minDist = 1000000.;
    closestGrid = i;
    for (int x = -1; x <=1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 randomPt = random2(i + offset);
            
            float currDist = length(f - (randomPt + offset));

            if (currDist < minDist) {
                minDist = currDist;
                closestGrid = i + offset;
            }
        }
    }
    return minDist;
}

void main() {
    vec3 sceneColor = texture(u_Scene, fs_uv).rgb;
    

    // blurr the bloomColor
    float dist = sin(u_Time / 500.) * 0.5 + 0.5; // 0 to 1
    dist = dist * 0.6 + 0.4; // 0.7 to 1
    vec2 texel = vec2(1.) / (u_Resolution * dist);
    vec3 bloomColor = vec3(0.);

    int kernelRadius = 7;
    for (int x = - kernelRadius; x <= kernelRadius; x++) {
        for (int y = -kernelRadius; y <= kernelRadius; y++) {
            vec2 offset = texel * vec2(float(x), float(y));
            bloomColor += texture(u_Bloom, fs_uv + offset).rgb;
        }
    }
    bloomColor /= float(kernelRadius) * 2. + 1.;
    
    
    // mix with original
    vec3 color = sceneColor * 0.9 + bloomColor * 0.1;


    // voronoi noise
    vec2 closestGrid;
    //voronoi(fs_uv, 600., closestGrid);
    //vec2 voronoiSampler = closestGrid / vec2(600.);
    // color = texture(u_Scene, voronoiSampler).rgb;


    out_Col = vec4(color, 1.0);
}
