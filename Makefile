# === Configuration ===
# === Compiler ===
CC := gcc
CXX := g++
CXXFLAGS := -g -lm 

# === Paths ===
INCLUDES := -Iinclude -I. -Iengine
LDFLAGS := -Llib -lglfw3dll -lopenal32 -lfmod

# === Files ===
SRCS := src/example.c #$(wildcard src/*.c) 
ENGINE_SCRS := $(wildcard engine/*.c) $(wildcard engine/glad/*.c) $(wildcard engine/stb_image/*.c) $(wildcard engine/dr_wav/*.c)
NUKLEAR_SRC := $(wildcard include/nuklear/*.c)

ALL_SRCS:= $(SRCS) $(NUKLEAR_SRC) $(ENGINE_SCRS)

OUT := engine.exe

# === Targets ===

compile: test run

test:
	$(CC) $(CXXFLAGS) $(INCLUDES) $(ALL_SRCS) -o $(OUT) $(LDFLAGS)

build_exe:
	$(CC) -mwindows $(CXXFLAGS) $(INCLUDES) $(ALL_SRCS) -o $(OUT) $(LDFLAGS)
#	"C:/Program Files/Git/bin/git.exe" add .
#	"C:/Program Files/Git/bin/git.exe" restore --staged Makefile

library:
	$(CC) -c $(INCLUDES) engine/engine.c 
	ar rcs libengine.a engine.o

run:
	./$(OUT)

clean:
	rm -f $(OUT)

.PHONY: build run clean compile