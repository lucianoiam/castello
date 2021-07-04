#!/usr/bin/make -f
# Makefile for DISTRHO Plugins #
# ---------------------------- #
# Created by falkTX
# Web UI by lucianoiam
#

# --------------------------------------------------------------
# Project name, used for binaries

NAME = castello-rev

# --------------------------------------------------------------
# Project version, used for generating unique symbol names

WEBUI_PROJECT_VERSION = 1

# --------------------------------------------------------------
# Web files location

WEBUI_RES_DIR = src/ui

# --------------------------------------------------------------
# Files to build

FILES_DSP = \
    src/CastelloRevPlugin.cpp \
    src/dsp/base.c \
    src/dsp/revsc.c

FILES_UI  = \
    src/CastelloRevUI.cpp

# --------------------------------------------------------------
# Do some magic

include dpf-webui/Makefile.plugins.mk

# --------------------------------------------------------------
# Enable all possible plugin types

ifeq ($(HAVE_JACK),true)
ifeq ($(HAVE_OPENGL),true)
TARGETS += jack
endif
endif

ifeq ($(HAVE_OPENGL),true)
TARGETS += lv2_sep
else
TARGETS += lv2_dsp
endif

TARGETS += vst

BASE_FLAGS += -Isrc

# Required for soundpipe.h
BASE_FLAGS += -DNO_LIBSNDFILE -DSNDFILE=FILE -DSF_INFO=char

all: $(TARGETS) $(WEBUI_TARGET)

# --------------------------------------------------------------