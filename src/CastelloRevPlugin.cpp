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

#include "CastelloRevPlugin.hpp"

USE_NAMESPACE_DISTRHO

Plugin* DISTRHO::createPlugin()
{
    return new CastelloRevPlugin;
}

CastelloRevPlugin::CastelloRevPlugin()
    : Plugin(0 /* parameterCount */, 0 /* programCount */, 0 /* stateCount */)
{
    sp_create(&fSoundpipe);
    sp_revsc_create(&fReverb);
    sp_revsc_init(fSoundpipe, fReverb);

    // FIXME - for testing
    fReverb->feedback = 0.9f;
    fReverb->lpfreq = 4000.f;
}

CastelloRevPlugin::~CastelloRevPlugin()
{
    sp_revsc_destroy(&fReverb);
    sp_destroy(&fSoundpipe);
}

void CastelloRevPlugin::initParameter(uint32_t index, Parameter& parameter)
{
    // unused
    (void)index;
    (void)parameter;
}

float CastelloRevPlugin::getParameterValue(uint32_t index) const
{
    return 0;

    // unused
    (void)index;
}

void CastelloRevPlugin::setParameterValue(uint32_t index, float value)
{
    // unused
    (void)index;
    (void)value;
}

void CastelloRevPlugin::run(const float** inputs, float** outputs, uint32_t frames)
{
    float* inpL = (float *)inputs[0];
    float* inpR = (float *)inputs[1];
    float* outL = outputs[0];
    float* outR = outputs[1];

    for (uint32_t offset = 0; offset < frames; offset++) {
        sp_revsc_compute(fSoundpipe, fReverb, inpL + offset, inpR + offset,
                                                outL + offset, outR + offset);
    }
}
