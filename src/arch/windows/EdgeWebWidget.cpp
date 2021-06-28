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

#include "EdgeWebWidget.hpp"

#include <cassert>
#include <codecvt>
#include <locale>
#include <sstream>
#include <winuser.h>

#include "base/Platform.hpp"
#include "base/macro.h"
#include "extra/cJSON.h"

#include "DistrhoPluginInfo.h"

#define WSTR_CONVERTER std::wstring_convert<std::codecvt_utf8<wchar_t>>()
#define TO_LPCWSTR(s)  WSTR_CONVERTER.from_bytes(s).c_str()
#define TO_LPCSTR(s)   WSTR_CONVERTER.to_bytes(s).c_str()

#define JS_POST_MESSAGE_SHIM "window.webviewHost.postMessage = (args) => window.chrome.webview.postMessage(args);"

USE_NAMESPACE_DISTRHO

static int     gNumInstances;
static HHOOK   gKeyboardHook;
static void    handleKeyboardLowLevelHookEvent(EdgeWebWidget *lpWebWidget, HWND hTargetWnd, UINT message, KBDLLHOOKSTRUCT* lpData);
static LRESULT CALLBACK KeyboardProc (int nCode, WPARAM wParam, LPARAM lParam);
static BOOL    CALLBACK EnumChildProc(HWND hWnd, LPARAM lParam);

EdgeWebWidget::EdgeWebWidget(Window& windowToMapTo)
    : AbstractWebWidget(windowToMapTo)
    , fHelperHwnd(0)
    , fDisplayed(false)
    , fBackgroundColor(0)
    , fHandler(0)
    , fController(0)
    , fView(0)
{
    // Pass a hidden orphan window handle to CreateCoreWebView2Controller
    // for initializing Edge WebView2, instead of the plugin window handle that
    // causes some hosts to hang when opening the UI, e.g. Carla.
    WCHAR className[256];
    swprintf(className, sizeof(className), L"EdgeWebWidget_%s_%d", XSTR(PROJECT_ID_HASH), std::rand());
    ZeroMemory(&fHelperClass, sizeof(fHelperClass));
    fHelperClass.cbSize = sizeof(WNDCLASSEX);
    fHelperClass.cbClsExtra = sizeof(LONG_PTR);
    fHelperClass.lpszClassName = wcsdup(className);
    fHelperClass.lpfnWndProc = DefWindowProc;
    RegisterClassEx(&fHelperClass);
    fHelperHwnd = CreateWindowEx(
        WS_EX_TOOLWINDOW,
        fHelperClass.lpszClassName,
        L"EdgeWebWidget Helper",
        WS_POPUPWINDOW | WS_CAPTION,
        CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT,
        0, 0, 0, 0
    );
    SetClassLongPtr(fHelperHwnd, 0, (LONG_PTR)this);
    ShowWindow(fHelperHwnd, SW_SHOWNOACTIVATE);

    if (gNumInstances++ == 0) {
        // Passing GetCurrentThreadId() to dwThreadId results in the hook never being called
        gKeyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardProc, GetModuleHandle(NULL), 0);
    }

    fHandler = new InternalWebView2EventHandler(this);

    // This request is queued until Edge WebView2 initializes itself
    String js = String(JS_POST_MESSAGE_SHIM);
    injectDefaultScripts(js);
}

EdgeWebWidget::~EdgeWebWidget()
{
    fHandler->release();

    if (--gNumInstances == 0) {
        UnhookWindowsHookEx(gKeyboardHook);
    }

    if (fController != 0) {
        ICoreWebView2Controller2_Close(fController);
        ICoreWebView2Controller2_Release(fController);
    }

    DestroyWindow(fHelperHwnd);
    UnregisterClass(fHelperClass.lpszClassName, 0);
    free((void*)fHelperClass.lpszClassName);
}

void EdgeWebWidget::onDisplay()
{
    if (fDisplayed) {
        return;
    }
    fDisplayed = true;
    
    // Edge WebView2 initialization does not complete right away
    initWebView();
}

void EdgeWebWidget::onResize(const ResizeEvent& ev)
{
    (void)ev;
    if (fController == 0) {
        return; // does not make sense now, ignore
    }

    updateWebViewBounds();
}

void EdgeWebWidget::setBackgroundColor(uint32_t rgba)
{
    if (fController == 0) {
        fBackgroundColor = rgba;
        return; // keep it for later
    }

    // Edge WebView2 currently only supports alpha=0 or alpha=1
    COREWEBVIEW2_COLOR color;
    color.A = static_cast<BYTE>(rgba & 0x000000ff);
    color.R = static_cast<BYTE>(rgba >> 24);
    color.G = static_cast<BYTE>((rgba & 0x00ff0000) >> 16);
    color.B = static_cast<BYTE>((rgba & 0x0000ff00) >> 8 );
    ICoreWebView2Controller2_put_DefaultBackgroundColor(
        reinterpret_cast<ICoreWebView2Controller2 *>(fController), color);
}

void EdgeWebWidget::navigate(String& url)
{
    if (fView == 0) {
        fUrl = url;
        return; // keep it for later
    }

    ICoreWebView2_Navigate(fView, TO_LPCWSTR(url));
}

void EdgeWebWidget::runScript(String& source)
{
    // For the plugin specific use case fView==0 means a programming error.
    // There is no point in queuing these, just wait for the view to load its
    // contents before trying to run scripts. Otherwise use injectScript()
    assert(fView != 0);
    ICoreWebView2_ExecuteScript(fView, TO_LPCWSTR(source), 0);
}

void EdgeWebWidget::injectScript(String& source)
{
    if (fController == 0) {
        fInjectedScripts.push_back(source);
        return; // keep it for later
    }

    ICoreWebView2_AddScriptToExecuteOnDocumentCreated(fView, TO_LPCWSTR(source), 0);
}

void EdgeWebWidget::updateWebViewBounds()
{
    // WINSIZEBUG: this->getWidth() and this->getHeight() returning 0
    RECT bounds;
    bounds.left = 0;
    bounds.top = 0;
    bounds.right = bounds.left + (LONG)getWindow().getWidth();
    bounds.bottom = bounds.top + (LONG)getWindow().getHeight();
    ICoreWebView2Controller2_put_Bounds(fController, bounds);
}

void EdgeWebWidget::initWebView()
{    
    HRESULT result = CreateCoreWebView2EnvironmentWithOptions(0,
        TO_LPCWSTR(platform::getTemporaryPath()), 0, fHandler);
    if (FAILED(result)) {
        webViewLoaderErrorMessageBox(result);
    }
}

HRESULT EdgeWebWidget::handleWebView2EnvironmentCompleted(HRESULT result,
                                                        ICoreWebView2Environment* environment)
{
    if (FAILED(result)) {
        webViewLoaderErrorMessageBox(result);
        return result;
    }

    ICoreWebView2Environment_CreateCoreWebView2Controller(environment, fHelperHwnd, fHandler);
    
    // FIXME: handleWebView2ControllerCompleted() is never called when running
    //        standalone unless the app window border is clicked. Looks like
    //        window messages get stuck somewhere and does not seem related to
    //        the usage of the fHelperHwnd.
    
    return S_OK;
}

HRESULT EdgeWebWidget::handleWebView2ControllerCompleted(HRESULT result,
                                                       ICoreWebView2Controller* controller)
{
    if (FAILED(result)) {
        webViewLoaderErrorMessageBox(result);
        return result;
    }

    fController = controller;

    ICoreWebView2Controller2_AddRef(fController);
    ICoreWebView2Controller2_get_CoreWebView2(fController, &fView);
    ICoreWebView2_add_NavigationCompleted(fView, fHandler, 0);
    ICoreWebView2_add_WebMessageReceived(fView, fHandler, 0);

    // Run pending requests

    setBackgroundColor(fBackgroundColor);
    updateWebViewBounds();

    for (std::vector<String>::iterator it = fInjectedScripts.begin(); it != fInjectedScripts.end(); ++it) {
        injectScript(*it);
    }

    navigate(fUrl);

    fBackgroundColor = 0;
    fInjectedScripts.clear();
    fUrl.clear();
    
    return S_OK;
}

HRESULT EdgeWebWidget::handleWebView2NavigationCompleted(ICoreWebView2 *sender,
                                                       ICoreWebView2NavigationCompletedEventArgs *eventArgs)
{
    (void)sender;
    (void)eventArgs;

    if (fController != 0) {
        // Reparent here instead of handleWebView2ControllerCompleted() to avoid
        // flicker as much as possible. At this point the web contents are ready.
        HWND hWnd = reinterpret_cast<HWND>(getWindow().getNativeWindowHandle());
        SetParent(fHelperHwnd, hWnd); // Allow EnumChildProc() to find the helper window
        ShowWindow(fHelperHwnd, SW_HIDE);

        ICoreWebView2Controller2_put_ParentWindow(fController, hWnd);

        handleLoadFinished();
    }
    
    return S_OK;
}

HRESULT EdgeWebWidget::handleWebView2WebMessageReceived(ICoreWebView2 *sender,
                                                      ICoreWebView2WebMessageReceivedEventArgs *eventArgs)
{
    // Edge WebView2 does not provide access to JSCore values; resort to parsing JSON
    (void)sender;

    LPWSTR jsonStr;
    ICoreWebView2WebMessageReceivedEventArgs_get_WebMessageAsJson(eventArgs, &jsonStr);
    cJSON* jArgs = cJSON_Parse(TO_LPCSTR(jsonStr));
    CoTaskMemFree(jsonStr);

    ScriptValueVector args;
    
    if (cJSON_IsArray(jArgs)) {
        int numArgs = cJSON_GetArraySize(jArgs);

        if (numArgs > 0) {
            for (int i = 0; i < numArgs; i++) {
                cJSON* jArg = cJSON_GetArrayItem(jArgs, i);

                if (cJSON_IsFalse(jArg)) {
                    args.push_back(ScriptValue(false));
                } else if (cJSON_IsTrue(jArg)) {
                    args.push_back(ScriptValue(true));
                } else if (cJSON_IsNumber(jArg)) {
                    args.push_back(ScriptValue(cJSON_GetNumberValue(jArg)));
                } else if (cJSON_IsString(jArg)) {
                    args.push_back(ScriptValue(String(cJSON_GetStringValue(jArg))));
                } else {
                    args.push_back(ScriptValue()); // null
                }
            }
        }
    }

    cJSON_free(jArgs);

    handleScriptMessage(args);
    
    return S_OK;
}

void EdgeWebWidget::webViewLoaderErrorMessageBox(HRESULT result)
{
    // TODO: Add clickable link to installer. It would be also better to display
    //       a message and button in the native window using DPF drawing methods.
    std::wstringstream wss;
    wss << "Make sure you have installed the Microsoft Edge WebView2 Runtime. "
        << "Error 0x" << std::hex << result;
    std::wstring ws = wss.str();
    
    DISTRHO_LOG_STDERR_COLOR(TO_LPCSTR(ws));

    MessageBox(0, ws.c_str(), TEXT(DISTRHO_PLUGIN_NAME), MB_OK | MB_ICONSTOP);
}

static LRESULT CALLBACK KeyboardProc(int nCode, WPARAM wParam, LPARAM lParam)
{    
    // HC_ACTION means wParam & lParam contain info about keystroke message

    if (nCode == HC_ACTION) {
        // Traverse focused window ancestors until finding the one holding widget instance
        HWND hWnd = GetFocus();
        int level = 0;

        while (level++ < 5) {
            HWND hWndWithWebWidgetPtr = 0;
            EnumChildWindows(hWnd, EnumChildProc, (LPARAM)&hWndWithWebWidgetPtr);

            if (hWndWithWebWidgetPtr != 0) {
                ULONG_PTR ptr = GetClassLongPtr(hWndWithWebWidgetPtr, 0);
                HWND hPluginRootWnd = GetParent(hWndWithWebWidgetPtr);
                handleKeyboardLowLevelHookEvent((EdgeWebWidget *)ptr, hPluginRootWnd,
                    (UINT)wParam, (KBDLLHOOKSTRUCT *)lParam);
                break;
            }

            hWnd = GetParent(hWnd);
        }
    }

    return CallNextHookEx(NULL, nCode, wParam, lParam);
}

BOOL CALLBACK EnumChildProc(HWND hWnd, LPARAM lParam)
{
    (void)lParam;

    WCHAR className[256];
    GetClassName(hWnd, (LPWSTR)className, sizeof(className));

    if (wcswcs(className, L"EdgeWebWidget") && wcswcs(className, L"" XSTR(PROJECT_ID_HASH))) {
        *((HWND *)lParam) = hWnd;
        return FALSE;
    }

    return TRUE;
}

void handleKeyboardLowLevelHookEvent(EdgeWebWidget *lpWebWidget, HWND hTargetWnd, UINT message, KBDLLHOOKSTRUCT* lpData)
{    
    // Translate low level keyboard events into a format suitable for SendMessage()
    MSG msg;
    ZeroMemory(&msg, sizeof(MSG));
    msg.hwnd = hTargetWnd;
    msg.message = message;
    msg.wParam = lpData->vkCode;
    msg.lParam = /* scan code */ lpData->scanCode << 16 | /* repeat count */ 0x1;

    switch (message) {
        case WM_KEYDOWN:
            // Just forward a-z to allow playing with Live's virtual keyboard.
            // For everything else converting keyboard events is a complex task.
            lpWebWidget->keyboardHookEvent(&msg);

            if ((lpData->vkCode >= 'A') && (lpData->vkCode <= 'Z')) {
                msg.message = WM_CHAR;
                msg.wParam = lpData->vkCode | 0x20; // to lowercase
                lpWebWidget->keyboardHookEvent(&msg);
            }

            break;
        case WM_KEYUP:
            // bit 30: The previous key state. The value is always 1 for a WM_KEYUP message.
            // bit 31: The transition state. The value is always 1 for a WM_KEYUP message.
            msg.lParam |= 0xC0000000; 
            lpWebWidget->keyboardHookEvent(&msg);
            
            break;
    }
}
