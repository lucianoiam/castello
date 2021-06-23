/*
 * dpf-webui
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

// For some yet unknown reason REAPER/Mac makes the resize handle react slowly.
// Behavior not reproducible on standalone application or plugin running on Live.
// Allow pressing shift when dragging the handle to resize in larger steps.
const ResizeHandle_SHIFT_ACCELERATION = 4;

const ResizeHandle_SVG = `
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <line stroke="#000000" stroke-opacity="0.75" x1="0" y1="100" x2="100" y2="0"/>
    <line stroke="#000000" stroke-opacity="0.75" x1="100" y1="25" x2="25" y2="100"/>
    <line stroke="#000000" stroke-opacity="0.75" x1="50" y1="100" x2="100" y2="50"/>
    <line stroke="#000000" stroke-opacity="0.75" x1="75" y1="100" x2="100" y2="75"/>
</svg>
`;

class ResizeHandle {

    constructor(callback, options) {
        this.callback = callback; 

        options = options || {};

        // Default minimum size is the current content size
        this.minWidth = options.minWidth || document.body.clientWidth;
        this.minHeight = options.minHeight || document.body.clientHeight;

        if (options.maxScale) {
            // Set the maximum size to maxScale times the minimum size 
            this.maxWidth = options.maxScale * this.minWidth;
            this.maxHeight = options.maxScale * this.minHeight;
        } else {
            // Default maximum size is the device screen size
            this.maxWidth = options.maxWidth || window.screen.width;
            this.maxHeight = options.maxHeight || window.screen.height;
        }

        // Keep aspect ratio while resizing, default to yes
        this.keepAspect = options.keepAspect || true;

        this.width = 0;
        this.height = 0;
        
        this.resizing = false;

        this.linux = /linux/i.test(window.navigator.platform);
        this.mac = /macintosh/i.test(window.navigator.platform);

        this.handle = document.createElement('div');
        this.handle.innerHTML = ResizeHandle_SVG;
        this.handle.style.position = 'fixed';
        this.handle.style.zIndex = '1000';
        this.handle.style.right = '0px';
        this.handle.style.bottom = '0px';
        this.handle.style.width = '24px';
        this.handle.style.height = '24px';

        this.handle.addEventListener('mousedown', (ev) => {
            this.resizing = true;

            this.width = document.body.clientWidth;
            this.height = document.body.clientHeight;

            if (this.linux) {
                this.x = ev.clientX;
                this.y = ev.clientY;
            }
        });

        window.addEventListener('mouseup', (ev) => {
            this.resizing = false;
        });

        window.addEventListener('mousemove', (ev) => {
            if (!this.resizing) {
                return
            }

            let dx, dy;

            if (this.linux) {
                // Is WebKitGTK returning absolute values for ev.movementX/Y ?
                dx = ev.clientX - this.x;
                this.x = ev.clientX;
                dy = ev.clientY - this.y;
                this.y = ev.clientY;
            } else {
                dx = ev.movementX;
                dy = ev.movementY;
            }

            const accel = this.mac && ev.shiftKey ? ResizeHandle_SHIFT_ACCELERATION : 1;

            let newWidth = this.width + accel * dx;
            newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));

            let newHeight = this.height + accel * dy;
            newHeight = Math.max(this.minHeight, Math.min(this.maxHeight, newHeight));

            // FIXME - aspect ratio lock

            if ((this.width != newWidth) || (this.height != newHeight)) {
                this.width = newWidth;
                this.height = newHeight;
                const k = window.devicePixelRatio;
                this.callback(k * this.width, k * this.height);
                //console.log(`${this.width}x${this.height}`);
            }
        });
    }

    get element() {
    	return this.handle;
    }

}
