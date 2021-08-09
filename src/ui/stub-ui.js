/*
 * Hip-Hop / High Performance Hybrid Audio Plugins
 * Copyright (C) 2021 Luciano Iam <oss@lucianoiam.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with
 * or without fee is hereby granted, provided that the above copyright notice and this
 * permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD
 * TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN
 * NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
 * DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER
 * IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

class StubUI {

    static installIfNeeded() {
        if (typeof(DISTRHO_UI) == 'undefined') {
            console.log('DISTRHO_UI is not defined, installing stub')
            window.DISTRHO_UI = StubUI;
        }
    }

    constructor() {
        // no-op
    }

    async getWidth() {
        return document.body.clientWidth;
    }

    async getHeight() {
        return document.body.clientHeight;
    }

    setWidth(width) {
        console.log(`setWidth(${width})`);
    }

    setHeight(height) {
        console.log(`setHeight(${height})`);
    }

    async isResizable() {
        return true;
    }

    setSize(width, height) {
        console.log(`setSize(${width}, ${height})`);
    }

    sendNote(channel, note, velocity) {
        console.log(`sendNote(${channel}, ${note}, ${velocity})`);
    }

    editParameter(index, started) {
        console.log(`editParameter(${index}, ${started})`);
    }

    setParameterValue(index, value) {
        console.log(`setParameterValue(${index}, ${value})`);
    }

    setState(key, value) {
        console.log(`setState(${key}, ${value})`);
    }

    flushInitMessageQueue() {
        console.log('flushInitMessageQueue()');
    }

    setKeyboardFocus(focus) {
        console.log(`setKeyboardFocus(${focus}`);
    }

    async getInitWidth() {
        return document.body.clientWidth;
    }

    async getInitHeight() {
        return document.body.clientHeight;
    }

    async isStandalone() {
        return true;
    }

    postMessage(...args) {
        console.log(`postMessage(${args})`);
    }

}

StubUI.installIfNeeded();
