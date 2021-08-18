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

#include <string>
#include <unordered_map>

#include "DistrhoPlugin.hpp"
#include "DistrhoPluginInfo.h"

extern "C" {
#include "dsp/soundpipe.h"
}

#define PARAMETER_COUNT 3
#define PROGRAM_COUNT   0
#define STATE_COUNT     1

START_NAMESPACE_DISTRHO

enum ParameterIndex {
    kParameterMix,
    kParameterFeedback,
    kParameterBrightness
};

class CastelloReverbPlugin : public Plugin
{
public:
    CastelloReverbPlugin()
        : Plugin(PARAMETER_COUNT, PROGRAM_COUNT, STATE_COUNT)
        , fSoundpipe(0)
        , fReverb(0)
        , fMix(0)
    {
        sp_create(&fSoundpipe);
        sp_revsc_create(&fReverb);
        sp_revsc_init(fSoundpipe, fReverb);
    }

    ~CastelloReverbPlugin()
    {
        sp_revsc_destroy(&fReverb);
        sp_destroy(&fSoundpipe);
    }

    const char* getLabel() const override
    {
        return DISTRHO_PLUGIN_NAME;
    }

    const char* getMaker() const override
    {
        return "Luciano Iam";
    }

    const char* getLicense() const override
    {
        return "ISC";
    }

    uint32_t getVersion() const override
    {
        return d_version(1, 0, 0);
    }

    int64_t getUniqueId() const override
    {
        return d_cconst('L', 'I', 'c', 'r');
    }

    void initParameter(uint32_t index, Parameter& parameter) override
    {
        parameter.hints = kParameterIsAutomable;

        switch (index)
        {
        case kParameterMix:
            parameter.name = "Mix";
            parameter.symbol = "mix";
            parameter.ranges.min = 0.f;
            parameter.ranges.max = 1.f;
            parameter.ranges.def = 0.25f;
            break;
        case kParameterFeedback:
            parameter.name = "Feedback";
            parameter.symbol = "feedback";
            parameter.ranges.min = 0.f;
            parameter.ranges.max = 1.f;
            parameter.ranges.def = 0.5f;
            break;
        case kParameterBrightness:
            parameter.name = "Brightness";
            parameter.symbol = "brightness";
            parameter.ranges.min = 0.f;
            parameter.ranges.max = 1.f;
            parameter.ranges.def = 0.75f;
            break;
        }

        setParameterValue(index, parameter.ranges.def);
    }

    float getParameterValue(uint32_t index) const override
    {
        switch (index)
        {
        case kParameterMix:
            return fMix;
        case kParameterFeedback:
            return (fReverb->feedback - 0.5f) * 2.f;
        case kParameterBrightness:
            return (fReverb->lpfreq - 400.f) / 10000.f;
        }

        return 0;
    }

    void setParameterValue(uint32_t index, float value) override
    {
        switch (index)
        {
        case kParameterMix:
            fMix = value;
            break;
        case kParameterFeedback:
            fReverb->feedback = 0.5f + value / 2.f;
            break;
        case kParameterBrightness:
            fReverb->lpfreq = 400.f + 10000.f * value;
            break;
        }
    }

    void initState(uint32_t index, String& stateKey, String& defaultStateValue) override
    {
        switch (index)
        {
        case 0:
            stateKey = "ui_size";
            break;
        }

        defaultStateValue = "";
    }

    void setState(const char* key, const char* value) override
    {
        fState[key] = value;
    }

    String getState(const char* key) const override
    {
        StateMap::const_iterator it = fState.find(key);

        if (it == fState.end()) {
            return String();
        }
        
        return String(it->second.c_str());
    }

    void run(const float** inputs, float** outputs, uint32_t frames) override
    {
        float* inpL = (float *)inputs[0];
        float* inpR = (float *)inputs[1];
        float* outL = outputs[0];
        float* outR = outputs[1];
        float dry = 1.f - fMix;

        for (uint32_t i = 0; i < frames; ++i) {
            // inpX and outX can point to the same memory address
            float l = inpL[i];
            float r = inpR[i];
            
            sp_revsc_compute(fSoundpipe, fReverb, inpL + i, inpR + i, outL + i, outR + i);

            outL[i] = dry * l + fMix * outL[i];
            outR[i] = dry * r + fMix * outR[i];
        }
    }

private:
    typedef std::unordered_map<std::string,std::string> StateMap;

    sp_data*  fSoundpipe;
    sp_revsc* fReverb;
    float     fMix;
    StateMap  fState;

};

Plugin* createPlugin()
{
    return new CastelloReverbPlugin;
}

END_NAMESPACE_DISTRHO
