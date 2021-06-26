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

// FIXME - this is still a very naive implementation, turning on/off the plugin
//         produces clicks, dry/wet control is lacking, lpfreq range is not
//         very useful, parameters need better names, and so on...

CastelloRevPlugin::CastelloRevPlugin()
    : Plugin(2 /* parameterCount */, 0 /* programCount */, 2 /* stateCount */)
{
    sp_create(&fSoundpipe);
    sp_revsc_create(&fReverb);
    sp_revsc_init(fSoundpipe, fReverb);
}

CastelloRevPlugin::~CastelloRevPlugin()
{
    sp_revsc_destroy(&fReverb);
    sp_destroy(&fSoundpipe);
}

void CastelloRevPlugin::initParameter(uint32_t index, Parameter& parameter)
{
    parameter.hints = kParameterIsAutomable;

    switch (index)
    {
    case 0:
        parameter.name = "feedback";
        parameter.ranges.min = 0.f;
        parameter.ranges.max = 1.f;
        parameter.ranges.def = 0.5f;
        break;
    case 1:
        parameter.name = "lpfreq";
        parameter.ranges.min = 0.f;    // TODO
        parameter.ranges.max = 10000.f;  // TODO
        parameter.ranges.def = 4000.f;
        break;
    }

    // TODO - are defaults set somewhere? can this be omitted by using programs?
    setParameterValue(index, parameter.ranges.def);
}

float CastelloRevPlugin::getParameterValue(uint32_t index) const
{
    switch (index)
    {
    case 0:
        return fReverb->feedback;
    case 1:
        return fReverb->lpfreq;
    }

    return 0;
}

void CastelloRevPlugin::setParameterValue(uint32_t index, float value)
{
    switch (index)
    {
    case 0:
        fReverb->feedback = value;
        break;
    case 1:
        fReverb->lpfreq = value;
        break;
    }
}

void CastelloRevPlugin::initState(uint32_t index, String& stateKey, String& defaultStateValue)
{
    switch (index)
    {
    case 0:
        stateKey = "ui_width";
        break;
    case 1:
        stateKey = "ui_height";
        break;
    }

    defaultStateValue = "";
}

void CastelloRevPlugin::setState(const char* key, const char* value)
{
    fState[key] = value;
}

String CastelloRevPlugin::getState(const char* key) const
{
    StateMap::const_iterator it = fState.find(key);
    if (it == fState.end()) {
        return String();
    }
    
    return String(it->second.c_str());
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
