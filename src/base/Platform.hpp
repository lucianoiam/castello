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

#ifndef PLATFORM_HPP
#define PLATFORM_HPP

#include "extra/String.hpp"

#include "macro.h"

#ifdef DISTRHO_OS_LINUX
#include "arch/linux/ExternalGtkWebWidget.hpp"
typedef ExternalGtkWebWidget _WebWidget;
#endif
#ifdef DISTRHO_OS_MAC
#include "arch/macos/CocoaWebWidget.hpp"
typedef CocoaWebWidget _WebWidget;
#endif
#ifdef DISTRHO_OS_WINDOWS
#include "arch/windows/EdgeWebWidget.hpp"
typedef EdgeWebWidget _WebWidget;
#endif

START_NAMESPACE_DISTRHO

namespace platform {

	typedef _WebWidget WebWidget;

    // The following functions help locating resource files and helper binaries
    // during runtime. Location of such is relative to the running binary path. 

    String getBinaryPath();
    String getResourcePath();
    String getTemporaryPath();

    // Helps scaling the web view on high density displays

    float getSystemDisplayScaleFactor();

    const String kDefaultResourcesSubdirectory = String(XSTR(BIN_BASENAME) "_resources");

}

END_NAMESPACE_DISTRHO

#endif  // PLATFORM_HPP
