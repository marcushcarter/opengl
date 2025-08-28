#include "engine/engine.h"

#include <stdio.h>
#include <math.h>
#include <time.h>

int main() {

    BE_Engine engine = BE_EngineStart(1440, 900, "Engine");

    BE_Engine* p_engine = &engine;
    BE_BindEngine(&engine);
    printf("After Binding: engine=%p, g_engine=%p\n", p_engine, g_engine);
    
    BE_LoadShader("scene1", "shaders/vert/scene.vert", "shaders/frag/scene.frag", NULL, NULL);

    BE_LoadMesh("scene", "res/models/scene.obj");

    BE_SceneAddModel("model1", "scene", (vec3){0.0f, 0.0f, 0.0f}, (vec3){0.0f, 0.0f, 0.0f}, (vec3){1.0f, 1.0f, 1.0f});
    BE_SceneAddLight("sun", LIGHT_DIRECT, (vec3){0,0,0}, (vec3){0.5f, -0.4f, 0.5f}, (vec4){1.0f, 1.0f, 1.0f, 1.0f}, 0.5f, 0, 0, 0, 0);
    BE_SceneAddLight("rainbow light", LIGHT_POINT, (vec3){0,0,0}, (vec3){0,0,0}, (vec4){1.0f, 1.0f, 1.0f, 1.0f}, 0.5f, 1.0f, 0.04f, 0, 0);
    BE_SceneAddCamera("donut camera", (vec3){-1.93f, 0.73f, -1.75f}, (vec3){0.67f, -0.12f, 0.f}, 0, 0, 45.0f, 0.1f, 100.0f);

    BE_LoadSound("music1", "res/sounds/breakout.wav", true, 1.0f, 10.0f);
    BE_AddEmitter("speaker1", true);
    BE_SetEmitterPosition("speaker1", BE_vec3(0,1,0));
    BE_PlayEmitter("speaker1", "music1");

    fprintf(stdout, "Time to load scene -> %.2fs\n", glfwGetTime());

    while(!glfwWindowShouldClose(engine.window)) {

        BE_BeginFrame();
        BE_CameraInputs(engine.activeCamera, engine.window, engine.timer.dt);

        glm_vec3_copy((vec3){cosf(glfwGetTime()/25), -0.4f, sinf(glfwGetTime()/25)}, engine.activeScene->lights.data[0].direction);
        glm_vec3_copy((vec3){sin(glfwGetTime()), 0.5f, cos(glfwGetTime())}, engine.activeScene->lights.data[1].position);
        vec4 rainbowColor = {sinf(glfwGetTime()*0.5f) * 0.5f + 0.5f, sinf(glfwGetTime()*0.5f + 2.0943951f) * 0.5f + 0.5f, sinf(glfwGetTime()*0.5f + 4.1887902f) * 0.5f + 0.5f, 1.0f};
        glm_vec4_copy(rainbowColor, engine.activeScene->lights.data[1].color);

        float temp;
        // BE_SetEmitterLooping("speaker1", true);
        // BE_SetEmitterSeek(temp, -5.0);
        // BE_PauseEmitter(speaker, true);

        BE_MakeShadows(!glfwGetKey(engine.window, GLFW_KEY_3));
        BE_BeginRender();
        BE_DrawModels(NULL);
        BE_DrawLights(NULL);
        // BE_DrawCameras(NULL);
        BE_DrawSprites(NULL);
        BE_DrawEmitters(NULL);

        BE_EndFrame();

    }

    BE_EngineShutdown(&engine);
    return 0;
}