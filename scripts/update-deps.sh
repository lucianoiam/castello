#!/bin/sh

git -C hiphop checkout master; git -C hiphop pull
git -C guinda checkout master; git -C guinda pull

cp hiphop/examples/webgain/ui/stub-ui.js src/ui/
cp guinda/guinda.js src/ui/
