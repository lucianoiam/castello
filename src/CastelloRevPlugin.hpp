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

#ifndef CASTELLOREVPLUGIN_HPP
#define CASTELLOREVPLUGIN_HPP

#include "DistrhoPlugin.hpp"
#include "DistrhoPluginInfo.h"

extern "C" {
#include "dsp/soundpipe.h"
}

START_NAMESPACE_DISTRHO

class CastelloRevPlugin : public Plugin
{
public:
    CastelloRevPlugin();
    ~CastelloRevPlugin();

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

    void  initParameter(uint32_t index, Parameter& parameter) override;
    float getParameterValue(uint32_t index) const override;
    void  setParameterValue(uint32_t index, float value) override;

    void  run(const float** inputs, float** outputs, uint32_t frames) override;

private:
    sp_data  *fSoundpipe;
    sp_revsc *fReverb;

};

END_NAMESPACE_DISTRHO

#endif  // CASTELLOREVPLUGIN_HPP
