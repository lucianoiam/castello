/*
 * Castello Reverb
 * Copyright (C) 2021 Luciano Iam <oss@lucianoiam.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
