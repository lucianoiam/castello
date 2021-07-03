/*
 * Castello Reverb
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

class CastelloRevUI extends DISTRHO_WebUI {

    constructor() {
        super();

        // Add a connectToParameter() method to widgets, see definition below.
        ParameterControlTrait.apply(RangeInputWidget, [this]);

        // Connect widgets to parameters and other targets
        this._connectWidgets();

        // Flush queue after connecting widgets to set their initial values,
        // and before calling any async methods otherwise those never complete.
        this.flushInitMessageQueue();

        // Setting up resize handle needs calling async methods
        (async () => {
            const k = window.devicePixelRatio;
            widget('resize').opt.minWidth = await this.getInitWidth() / k;
            widget('resize').opt.minHeight = await this.getInitHeight() / k;
        }) ();

        // Always unhide because stateChanged() is not called for standalone
        document.body.style.visibility = 'visible';
    }

    stateChanged(key, value) {
        if (key == 'ui_size') {
            const wh = value.split('x');

            if (wh.length == 2) {
                this.setSize(parseInt(wh[0]), parseInt(wh[1]));
            }

            // Do not unhide UI until window size is restored
            //document.body.style.visibility = 'visible';
        }
    }

    parameterChanged(index, value) {
        // Host informs a parameter has changed, update its associated widget.

        switch (index) {
            case 0:
                widget('p-feedback').value = value;
                break;

            case 1:
                widget('p-lpfreq').value = value;
                break;
        }
    }

    _connectWidgets() {
        // Feedback knob
        widget('p-feedback').connectToParameter(0);

        // LPF cutoff frequency knob
        widget('p-lpfreq').connectToParameter(1);

        // Resize handle
        widget('resize').addEventListener('input', (ev) => {
            const k = window.devicePixelRatio;
            const width = ev.value.width * k;
            const height = ev.value.height * k; 
            this.setSize(width, height);
            this.setState('ui_size', `${width}x${height}`);
        });
    }

}


/**
 * Support code for writing less widget handling code
 */

function widget(id) {
    return document.getElementById(id);
}

function ParameterControlTrait(ui) {
    this.prototype.connectToParameter = function(index) {
        this.addEventListener('input', (ev) => {
            ui.setParameterValue(index, ev.target.value);
        });
    }
}
