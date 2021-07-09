#!/usr/bin/make -f
# Makefile for DISTRHO Plugins #
# ---------------------------- #
# Created by falkTX
# Web UI by lucianoiam
#

## DEBUG
APX_PRINT_TRAFFIC = true

# --------------------------------------------------------------
# Project name, used for binaries

NAME = castello-rev

# --------------------------------------------------------------
# Project version, used for generating unique symbol names

APX_PROJECT_VERSION = 1

# --------------------------------------------------------------
# Web files location

APX_RESOURCES_DIR = src/ui

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

include apices/Makefile.plugins.mk

# --------------------------------------------------------------
# Enable all possible plugin types

ifneq ($(WINDOWS),true)
ifeq ($(HAVE_JACK),true)
ifeq ($(HAVE_OPENGL),true)
TARGETS += jack
endif
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

all: $(TARGETS) $(APX_TARGET)

# --------------------------------------------------------------