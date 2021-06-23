#!/bin/sh

DPF_WEBUI=../dpf-webui

if [ ! -d $DPF_WEBUI ]; then
   echo Could not find source directory
   exit 1
fi

cp -r $DPF_WEBUI/src/arch src/
cp -r $DPF_WEBUI/src/base src/

cp -r $DPF_WEBUI/src/ui/platform.js src/ui/
cp -r $DPF_WEBUI/src/ui/resize-handle.js src/ui/

cp $DPF_WEBUI/Makefile.base.mk .
cp $DPF_WEBUI/Makefile.plugins.mk .
cp $DPF_WEBUI/Makefile.support.mk .
