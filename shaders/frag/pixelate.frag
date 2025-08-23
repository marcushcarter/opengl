
#version 460 core

out vec4 FragColor;
in vec2 texCoord;

uniform sampler2D screenTexture;

void main() {

    vec2 resolution = textureSize(screenTexture, 0);
    float pixelSize = 4;

    vec2 blockUV = vec2(
        floor(texCoord.x * resolution.x / pixelSize) * pixelSize / resolution.x,
        floor(texCoord.y * resolution.y / pixelSize) * pixelSize / resolution.y
    );

    vec3 color = texture(screenTexture, blockUV).rgb;

    FragColor = vec4(color, 1);
}