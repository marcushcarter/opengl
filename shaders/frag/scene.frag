#version 460 core

out vec4 FragColor;

in vec3 crntPos;
in vec3 Normal;
in vec3 color;
in vec2 texCoord;

uniform sampler2D diffuse0;
uniform sampler2D specular0;
uniform vec3 camPos;
uniform float ambient;
uniform int sampleRadius;

struct DirectLight {
    vec3 direction;
    vec4 color;
    float specular;

    mat4 lightSpaceMatrix;
};

struct PointLight {
    vec3 position;
    vec4 color;
    float a;
    float b;
    float specular;

    mat4 lightSpaceMatrix;
};

struct SpotLight {
    vec3 position;
    vec3 direction;
    vec4 color;

    float innerCone;
    float outerCone;
    float specular;

    mat4 lightSpaceMatrix;
};

uniform int numDirects;
uniform DirectLight directlights[10];
uniform sampler2DArray directShadowMapArray;

uniform int numPoints;
uniform PointLight pointlights[10];
uniform sampler2DArray pointShadowMapArray;

uniform int numSpots;
uniform SpotLight spotlights[10];
uniform sampler2DArray spotShadowMapArray;

vec3 calcDirectLight(DirectLight light, vec3 normal, vec3 viewDirection, int index) {

    vec3 lightDirection = normalize(-light.direction);

    float diffuse = max(dot(normal, lightDirection), 0.0f);

    float specular = 0.0f;
    if (diffuse != 0.0f) {
		float specularLight = light.specular;
		vec3 halfwayVec = normalize(viewDirection + lightDirection);
		float specAmount = pow(max(dot(normal, halfwayVec), 0.0f), 16);
		specular = specAmount * specularLight;
    };

    vec4 fragPosLight = light.lightSpaceMatrix * vec4(crntPos, 1.0);

    float shadow = 0.0f;
    vec3 lightCoords = fragPosLight.xyz / fragPosLight.w;
    if(lightCoords.z <= 1.0f) {
        lightCoords = (lightCoords + 1.0f) / 2.0f;

        float closestDepth = texture(directShadowMapArray, vec3(lightCoords.xy, index)).r;
        float currentDepth = lightCoords.z;
        float bias = max(0.002f * (1.0f - dot(normal, lightDirection)), 0.00002f);

        vec2 pixelSize = 1.0 / vec2(textureSize(directShadowMapArray, index).xy);
        for (int y = -sampleRadius; y <= sampleRadius; y++) {
            for (int x = -sampleRadius; x <= sampleRadius; x++) {
                closestDepth = texture(directShadowMapArray, vec3(lightCoords.xy + vec2(x, y) * pixelSize, index)).r;
                if (currentDepth > closestDepth + bias) {
                    shadow += 1.0f;
                }
            
            }
        }

        shadow /= pow((sampleRadius * 2. + 1.), 2);
    }

    return (texture(diffuse0, texCoord) * diffuse * (1.0f - shadow) + texture(specular0, texCoord).r * specular * (1.0f - shadow)) * light.color;
}

vec3 calcPointLight(PointLight light, vec3 normal, vec3 viewDirection, int index) {
    
    float dist = length(light.position - crntPos);
    float inten = 1.0f / (light.a * dist * dist + light.b * dist + 1.0f); 

    vec3 lightDirection = normalize(light.position - crntPos);
    float diffuse = max(dot(normal, lightDirection), 0.0f);

    float specular = 0.0f;
    if (diffuse != 0.0f) {
		float specularLight = light.specular;
        vec3 reflectionDirection = reflect(-light.position, normal);
        vec3 halfwayVec = normalize(viewDirection + lightDirection);
        float specAmount = pow(max(dot(normal, halfwayVec), 0.0f), 16);
        specular = specAmount * specularLight;
    };

    return (texture(diffuse0, texCoord) * (diffuse * inten) + texture(specular0, texCoord).r * specular * inten) * light.color;
}

vec3 calcSpotLight(SpotLight light, vec3 normal, vec3 viewDirection, int index) { 
    
    vec3 lightDirection = normalize(light.position - crntPos);

    float diffuse = max(dot(normal, lightDirection), 0.0f);

    float specular = 0.0f;
    if (diffuse != 0.0f) {
        float specularLight = light.specular;


        vec3 halfwayVec = normalize(viewDirection + lightDirection);
        float specAmount = pow(max(dot(normal, halfwayVec), 0.0f), 8);
        specular = specAmount * specularLight;
    };

    float angle = dot(normalize(-light.direction), lightDirection);
    float inten = clamp((angle - light.outerCone) / (light.outerCone - light.innerCone), 0.0f, 1.0f);
    
    vec4 fragPosLight = light.lightSpaceMatrix * vec4(crntPos, 1.0);

    float shadow = 0.0f;
    vec3 lightCoords = fragPosLight.xyz / fragPosLight.w;
    if(lightCoords.z <= 1.0f) {
        lightCoords = (lightCoords + 1.0f) / 2.0f;

        float closestDepth = texture(spotShadowMapArray, vec3(lightCoords.xy, index)).r;
        float currentDepth = lightCoords.z;
        float bias = max(0.005f * (1.0f - dot(normal, lightDirection)), 0.002f);

        vec2 pixelSize = 1.0 / vec2(textureSize(spotShadowMapArray, index).xy);
        for (int y = -sampleRadius; y <= sampleRadius; y++) {
            for (int x = -sampleRadius; x <= sampleRadius; x++) {
                float closestDepth = texture(spotShadowMapArray, vec3(lightCoords.xy + vec2(x, y) * pixelSize, index)).r;
                if (currentDepth > closestDepth + bias) {
                    shadow += 1.0f;
                }
            
            }
        }

        shadow /= pow((sampleRadius * 2. + 1.), 2);
    }

    // return (texture(diffuse0, texCoord) * diffuse * (1.0f - shadow) + texture(specular0, texCoord).r * specular * (1.0f - shadow)) * light.color;

    // return (texture(diffuse0, texCoord) * (diffuse * (1.0f - shadow) * inten) + texture(specular0, texCoord).r * specular * (1.0f - shadow) * inten) * light.color;
    return (texture(diffuse0, texCoord) * (diffuse * inten) + texture(specular0, texCoord).r * specular * inten) * light.color;
}

float near = 0.1f;
float far = 100.0f;

float linearizeDepth(float depth) {
    return (2.0 * near * far) / (far + near - (depth * 2.0 - 1.0) * (far - near));
}

float logisticDepth(float depth) {
    float steepness = 0.5f;
    float offset = 5.0f;
    float zVal = linearizeDepth(depth);
    return (1/ (1 + exp(-steepness * (zVal - offset))));
}

void main() {
    vec3 normal = normalize(Normal);
    vec3 viewDir = normalize(camPos - crntPos);

    vec3 result = texture(diffuse0, texCoord).rgb * ambient;

    for (int i = 0; i < numDirects; i++) {
        result += calcDirectLight(directlights[i], normal, viewDir, i);   
    }

    for (int i = 0; i < numPoints; i++) {
        result += calcPointLight(pointlights[i], normal, viewDir, i);   
    }
    
    for (int i = 0; i < numSpots; i++) {
        result += calcSpotLight(spotlights[i], normal, viewDir, i); 
    }
    
    FragColor = vec4(result, 1.0);
    
    // float depth = logisticDepth(gl_FragCoord.z);
    // FragColor = vec4(result, 1.0f) * (1.0f - depth) + vec4(depth * vec3(0.85f, 0.85f, 0.90f), 1.0f);
}