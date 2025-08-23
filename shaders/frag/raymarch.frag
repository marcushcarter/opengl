#version 460 core

in vec4 v_color;
in vec2 v_texCoord;

uniform vec3 camPos;
uniform vec3 u_cameraOrientation;

out vec4 FragColor;

vec3 palette( float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);

    return a + b*cos( 6.28318*(c*t+d) );
}

float smin( float a, float b, float k ) {
    float h = max( k-abs(a-b), 0.0)/k;
    return min( a, b ) - h*h*h*(1./6.);
}

vec3 rot3D(vec3 p, vec3 axis, float angle) {
    // Rodrigues' rotation formula
    return mix(dot(axis, p) * axis, p, cos(angle)) + cross(axis, p) * sin(angle);
}

mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

float sdSphere( vec3 p, float s ) { return length(p)-s; }
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)), 0.0);
}
float sdOctahedron( vec3 p, float s ) {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}

float map(vec3 p) {

    float sphere = sdOctahedron(p - camPos - vec3(0, 0, -1), .15);

    p.xy = (fract(p.xy) - .5);
    p.z = mod(p.z, .25) - .125;

    float box = sdSphere(p, .15);

    return min(sphere, box);
}

void main() {

    vec2 fragCoord = gl_FragCoord.xy;
    vec2 iResolution = vec2(1600, 1000);
    vec2 uv = (fragCoord * 2. - iResolution.xy) / iResolution.y;

    uv = (fragCoord.xy / iResolution.xy) * 2. - 1.;
    uv.x *= iResolution.x / iResolution.y;

    vec3 forward = normalize(u_cameraOrientation);
    vec3 worldUp = vec3(0.0, 1., 0.);

    if (abs(dot(forward, worldUp)) > 0.999) { worldUp = vec3(0., 0., 1.); }

    vec3 right = normalize(cross(forward, worldUp));
    vec3 up = cross(right, forward);

    vec3 rd = normalize(forward + uv.x * right + uv.y * up);
    vec3 ro = camPos;
    
    //vec3 ro = vec3(0, 0, 3);
    //vec3 rd = normalize(vec3(uv*1.5, 1));
    vec3 col = vec3(0);

    float t = 0.;

    int i; // Raymarching
    for (i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;

        // p.xy *= rot2D(t*.2);
        // p.y += sin(t)*.35;

        float d = map(p);

        t += d;

        if (d < .001 || t > 100.) break;
    }

    // Colorizing
     col = palette(t*.04 + float(i)*.005);
    // col = vec3(t*.04);

    // FragColor = vec4(uv, 0, 1);
    FragColor = vec4(col, 1);
    // FragColor = vec4(rd * 0.5 + 0.5, 1.0);
}