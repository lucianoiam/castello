#!/bin/sh

DPF_WEBUI=../dpf-webui
GUINDA=../guinda

git -C $DPF_WEBUI pull
cp $DPF_WEBUI/example/ui/stub-webui.js src/ui/

cp $GUINDA/guinda.js src/ui/
