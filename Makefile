#!/usr/bin/make -f
# Makefile for DISTRHO Plugins #
# ---------------------------- #
# Created by falkTX
#

# --------------------------------------------------------------
# Project name, used for binaries

NAME = CastelloReverb

# --------------------------------------------------------------
# Project version, used for generating unique symbol names

HIPHOP_PROJECT_VERSION = 3

# --------------------------------------------------------------
# Automatically inject dpf.js

HIPHOP_INJECT_FRAMEWORK_JS = true

# Enable ARM and Intel fat binary for macOS

HIPHOP_MACOS_UNIVERSAL = true

# --------------------------------------------------------------
# Support macOS down to High Sierra

HIPHOP_MACOS_OLD = true

# --------------------------------------------------------------
# Enable Web UI by setting web files location

HIPHOP_WEB_UI_PATH = src/ui

# --------------------------------------------------------------
# Files to build

FILES_DSP = \
    src/CastelloReverbPlugin.cpp \
    src/dsp/base.c \
    src/dsp/revsc.c

FILES_UI  = \
    src/CastelloReverbUI.cpp

# --------------------------------------------------------------
# Do some magic

include hiphop/Makefile.plugins.mk

# --------------------------------------------------------------
# Enable all possible plugin types

ifeq ($(PLUGIN_FORMAT),)
TARGETS += lv2_sep clap vst3 vst
else
TARGETS += $(PLUGIN_FORMAT)
endif

LXHELPER_CPPFLAGS += -Isrc
BASE_FLAGS += -Isrc

# Required for soundpipe.h
BASE_FLAGS += -DNO_LIBSNDFILE -DSNDFILE=FILE -DSF_INFO=char \
			  -Wno-sign-compare -Wno-unused-parameter

all: $(TARGETS) $(HIPHOP_TARGET)

# --------------------------------------------------------------
