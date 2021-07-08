#!/bin/sh

git submodule update --recursive --remote

cp apices/example/ui/stub-webui.js src/ui/
cp guinda/guinda.js src/ui/
