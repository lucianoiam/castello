#!/bin/sh

PKG_NAME=castello

if [[ $# -ne 1 ]]; then
    echo Usage: $0 version	
    exit 1
fi

echo "\033[0;33mNote: version must be manually updated in CastelloPlugin.cpp and ui.js\033[0m"
version=$1

case $(uname -s) in
    Linux*)
        arch=linux-x64
        ;;
    Darwin*)
        arch=macos-universal
        ;;
    MINGW*)
        arch=windows-x64
        ;;
esac

dist_dir=dist
rm -rf $dist_dir
mkdir $dist_dir

temp_bin_dir=/tmp/$PKG_NAME-bin
rm -rf $temp_bin_dir
mkdir -p $temp_bin_dir

echo "Building CLAP plugin"
make clean && make PLUGIN_FORMAT=clap
if [ $arch = macos-universal ]; then
    cp -r bin/* $temp_bin_dir
else
    mkdir $temp_bin_dir/CLAP
    cp -r bin/* $temp_bin_dir/CLAP
fi

echo "Building VST3 plugin"
make clean && make PLUGIN_FORMAT=vst3
cp -r bin/* $temp_bin_dir

echo "Building VST2 plugin"
make clean && make PLUGIN_FORMAT=vst
if [ $arch = macos-universal ]; then
    cp -r bin/* $temp_bin_dir
else
    mkdir $temp_bin_dir/VST2
    cp -r bin/* $temp_bin_dir/VST2
fi

repo_dir=$(pwd)
cd $temp_bin_dir
zip -r "$repo_dir/$dist_dir/$PKG_NAME-$arch-$version.zip" * -x "*.DS_Store"
cd $repo_dir

rm -rf $temp_bin_dir
