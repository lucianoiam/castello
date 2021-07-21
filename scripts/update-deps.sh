#!/bin/sh

git -C hiphap checkout master; git -C hiphap pull
git -C guinda checkout master; git -C guinda pull

cp hiphap/examples/webgain/ui/stub-ui.js src/ui/
cp guinda/guinda.js src/ui/
