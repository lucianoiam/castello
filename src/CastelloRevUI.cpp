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

#include "CastelloRevUI.hpp"

#include <string>

#define BASE_WIDTH_PX  600
#define BASE_HEIGHT_PX 300

#define INIT_BACKGROUND_RGBA 0x000000ff

USE_NAMESPACE_DISTRHO

UI* DISTRHO::createUI()
{
    return new CastelloRevUI;
}

CastelloRevUI::CastelloRevUI()
    : ProxyWebUI(BASE_WIDTH_PX, BASE_HEIGHT_PX, INIT_BACKGROUND_RGBA)
{
    setGeometryConstraints(getWidth(), getHeight(), true, false);
}

void CastelloRevUI::uiReshape(uint width, uint height)
{
    ProxyWebUI::uiReshape(width, height);

    setState("ui_width", std::to_string(width).c_str());
    setState("ui_height", std::to_string(height).c_str());
}

void CastelloRevUI::stateChanged(const char* key, const char* value)
{
    if ((std::strcmp(key, "ui_width") == 0) && (value[0] != '\0')) {
        setWidth(static_cast<uint>(std::stoi(value)));
    } else if ((std::strcmp(key, "ui_height") == 0) && (value[0] != '\0')) {
        setHeight(static_cast<uint>(std::stoi(value)));
    }
}
