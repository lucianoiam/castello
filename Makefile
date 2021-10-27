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

HIPHOP_PROJECT_VERSION = 1

# --------------------------------------------------------------
# Web UI files location

HIPHOP_WEB_UI_PATH = src/ui

# -------------------------------------------------------------- 
# Only needed for the GTK web view on Linux, ignored otherwise
HIPHOP_MAX_BASE_WIDTH = 690 # 1.5*460
HIPHOP_MAX_BASE_HEIGHT = 300 # 1.5*200

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

TARGETS += lv2_sep vst vst3

BASE_FLAGS += -Isrc

# Required for soundpipe.h
BASE_FLAGS += -DNO_LIBSNDFILE -DSNDFILE=FILE -DSF_INFO=char -Wno-sign-compare -Wno-unused-parameter

all: $(TARGETS) $(HIPHOP_TARGET)

# --------------------------------------------------------------
