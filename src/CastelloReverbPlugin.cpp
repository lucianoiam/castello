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

#define PARAMETER_COUNT 2
#define PROGRAM_COUNT   0
#define STATE_COUNT     1

START_NAMESPACE_DISTRHO

// FIXME - this is still a very naive implementation, turning on/off the plugin
//         produces clicks, dry/wet control is lacking, lpfreq range is not
//         very useful, parameters need better names, and so on...

class CastelloReverbPlugin : public Plugin
{
public:
    CastelloReverbPlugin() : Plugin(PARAMETER_COUNT, PROGRAM_COUNT, STATE_COUNT)
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
        return 0;
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

    float getParameterValue(uint32_t index) const override
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

    void setParameterValue(uint32_t index, float value) override
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

        for (uint32_t offset = 0; offset < frames; offset++) {
            sp_revsc_compute(fSoundpipe, fReverb, inpL + offset, inpR + offset,
                                                    outL + offset, outR + offset);
        }
    }

private:
    sp_data*  fSoundpipe;
    sp_revsc* fReverb;

    typedef std::unordered_map<std::string,std::string> StateMap;

    StateMap fState;

};

Plugin* createPlugin()
{
    return new CastelloReverbPlugin;
}

END_NAMESPACE_DISTRHO
