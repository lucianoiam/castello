#!/bin/sh

DPF_WEBUI=../dpf-webui
AWWW=../awww

git -C $DPF_WEBUI pull
cp $DPF_WEBUI/example/ui/stub-webui.js src/ui/

cp $AWWW/awww.js src/ui/
