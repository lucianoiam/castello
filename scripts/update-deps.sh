#!/bin/sh

APICES=../apices
GUINDA=../guinda

git -C $APICES pull
cp $APICES/example/ui/stub-webui.js src/ui/

cp $GUINDA/guinda.js src/ui/
