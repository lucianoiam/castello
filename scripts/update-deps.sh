#!/bin/sh

git submodule update --recursive --remote

git -C apices checkout master && git -C apices pull
git -C guinda checkout master && git -C guinda pull

cp apices/example/ui/stub-ui.js src/ui/
cp guinda/guinda.js src/ui/
