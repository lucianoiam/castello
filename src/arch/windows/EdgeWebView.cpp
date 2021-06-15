/*
 * dpf-webui
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

#include "EdgeWebView.hpp"

#include <cassert>
#include <codecvt>
#include <locale>
#include <sstream>
#include <winuser.h>

#include "base/Platform.hpp"
#include "base/macro.h"
#include "extra/cJSON.h"

#include "DistrhoPluginInfo.h"

#define WSTRING_CONVERTER std::wstring_convert<std::codecvt_utf8<wchar_t>>()
#define TO_LPCWSTR(s)     WSTRING_CONVERTER.from_bytes(s).c_str()
#define TO_LPCSTR(s)      WSTRING_CONVERTER.to_bytes(s).c_str()

#define JS_POST_MESSAGE_SHIM "window.webviewHost.postMessage = (args) => window.chrome.webview.postMessage(args);"

USE_NAMESPACE_DISTRHO

EdgeWebView::EdgeWebView(WebViewEventHandler& handler)
    : BaseWebView(handler)
    , fHelperHwnd(0)
    , fController(0)
    , fView(0)
    , fPBackgroundColor(0)
    , fPWindowId(0)
{
    // EdgeWebView works a bit different compared to the other platforms due to
    // the async nature of the native web view initialization process
    WCHAR className[256];
    ::swprintf(className, sizeof(className), L"DPF_Class_%d", std::rand());
    ::ZeroMemory(&fHelperClass, sizeof(fHelperClass));
    fHelperClass.lpszClassName = wcsdup(className);
    fHelperClass.lpfnWndProc = DefWindowProc;
    ::RegisterClass(&fHelperClass);
    fHelperHwnd = ::CreateWindowEx(
        WS_EX_TOOLWINDOW,
        fHelperClass.lpszClassName,
        L"WebView2 Init Helper",
        WS_POPUPWINDOW | WS_CAPTION,
        CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT,
        0, 0, 0, 0
    );
    ::ShowWindow(fHelperHwnd, SW_SHOWNOACTIVATE);
    String js = String(JS_POST_MESSAGE_SHIM);
    injectDefaultScripts(js);
    fHandler = new EdgeWebViewInternalEventHandler(this);
}

EdgeWebView::~EdgeWebView()
{
    fHandler->release();
    if (fController != 0) {
        ICoreWebView2Controller2_Close(fController);
        ICoreWebView2_Release(fController);
    }
    ::DestroyWindow(fHelperHwnd);
    ::UnregisterClass(fHelperClass.lpszClassName, 0);
    ::free((void*)fHelperClass.lpszClassName);
}

void EdgeWebView::setBackgroundColor(uint32_t rgba)
{
    if (fController == 0) {
        fPBackgroundColor = rgba;
        return; // later
    }
    // WebView2 currently only supports alpha=0 or alpha=1
    COREWEBVIEW2_COLOR color;
    color.A = static_cast<BYTE>(rgba & 0x000000ff);
    color.R = static_cast<BYTE>(rgba >> 24);
    color.G = static_cast<BYTE>((rgba & 0x00ff0000) >> 16);
    color.B = static_cast<BYTE>((rgba & 0x0000ff00) >> 8 );
    ICoreWebView2Controller2_put_DefaultBackgroundColor(
        reinterpret_cast<ICoreWebView2Controller2 *>(fController), color);
}

void EdgeWebView::reparent(uintptr_t windowId)
{
    if (fController == 0) {
        fPWindowId = windowId;
        return; // later
    }
    ICoreWebView2Controller2_put_ParentWindow(fController, (HWND)windowId);
}

void EdgeWebView::resize(const Size<uint>& size)
{
    if (fController == 0) {
        fPSize = size;
        return; // later
    }
    RECT bounds {};
    bounds.right = size.getWidth();
    bounds.bottom = size.getHeight();
    ICoreWebView2Controller2_put_Bounds(fController, bounds);
}

void EdgeWebView::navigate(String& url)
{
    if (fView == 0) {
        fPUrl = url;
        return; // later
    }
    ICoreWebView2_Navigate(fView, TO_LPCWSTR(url));
}

void EdgeWebView::runScript(String& source)
{
    // For the plugin specific use case fView==0 means a programming error.
    // There is no point in queuing these, just wait for the view to become ready.
    assert(fView != 0);
    ICoreWebView2_ExecuteScript(fView, TO_LPCWSTR(source), 0);
}

void EdgeWebView::injectScript(String& source)
{
    if (fController == 0) {
        fPInjectedScripts.push_back(source);
        return; // later
    }
    ICoreWebView2_AddScriptToExecuteOnDocumentCreated(fView, TO_LPCWSTR(source), 0);
}

void EdgeWebView::start()
{
    HRESULT result = ::CreateCoreWebView2EnvironmentWithOptions(0,
        TO_LPCWSTR(platform::getTemporaryPath()), 0, fHandler);
    if (FAILED(result)) {
        webViewLoaderErrorMessageBox(result);
    }
}

HRESULT EdgeWebView::handleWebView2EnvironmentCompleted(HRESULT result,
                                                        ICoreWebView2Environment* environment)
{
    if (FAILED(result)) {
        webViewLoaderErrorMessageBox(result);
        return result;
    }
    ICoreWebView2Environment_CreateCoreWebView2Controller(environment, fHelperHwnd, fHandler);
    // FIXME: handleWebView2ControllerCompleted() is never called when running standalone
    //        unless the app window border is clicked, looks like messages get stuck somewhere
    //        and does not seem related to the usage of the fHelperHwnd, passing fPWindowId
    //        above results in the same result
    return S_OK;
}

HRESULT EdgeWebView::handleWebView2ControllerCompleted(HRESULT result,
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
    // Call pending setters
    for (std::vector<String>::iterator it = fPInjectedScripts.begin(); it != fPInjectedScripts.end(); ++it) {
        injectScript(*it);
    }
    setBackgroundColor(fPBackgroundColor);
    resize(fPSize);
    navigate(fPUrl);
    // Cleanup, handleWebViewControllerCompleted() will not be called again anyways
    fPInjectedScripts.clear();
    fPBackgroundColor = 0;
    fPSize = {};
    fPUrl.clear();
    return S_OK;
}

HRESULT EdgeWebView::handleWebView2NavigationCompleted(ICoreWebView2 *sender,
                                                       ICoreWebView2NavigationCompletedEventArgs *eventArgs)
{
    (void)sender;
    (void)eventArgs;
    if (fController != 0) {
        handleLoadFinished();
        if (fPWindowId != 0) {
            reparent(fPWindowId);
            // handleWebViewNavigationCompleted() could be called again
            fPWindowId = 0;
        }
    }
    return S_OK;
}

HRESULT EdgeWebView::handleWebView2WebMessageReceived(ICoreWebView2 *sender,
                                                      ICoreWebView2WebMessageReceivedEventArgs *eventArgs)
{
    // Edge WebView2 does not provide access to JSCore values; resort to parsing JSON
    (void)sender;
    LPWSTR jsonStr;
    ICoreWebView2WebMessageReceivedEventArgs_get_WebMessageAsJson(eventArgs, &jsonStr);
    cJSON* jArgs = ::cJSON_Parse(TO_LPCSTR(jsonStr));
    ::CoTaskMemFree(jsonStr);
    ScriptValueVector args;
    if (::cJSON_IsArray(jArgs)) {
        int numArgs = ::cJSON_GetArraySize(jArgs);
        if (numArgs > 0) {
            for (int i = 0; i < numArgs; i++) {
                cJSON* jArg = ::cJSON_GetArrayItem(jArgs, i);
                if (::cJSON_IsFalse(jArg)) {
                    args.push_back(ScriptValue(false));
                } else if (::cJSON_IsTrue(jArg)) {
                    args.push_back(ScriptValue(true));
                } else if (::cJSON_IsNumber(jArg)) {
                    args.push_back(ScriptValue(::cJSON_GetNumberValue(jArg)));
                } else if (::cJSON_IsString(jArg)) {
                    args.push_back(ScriptValue(String(::cJSON_GetStringValue(jArg))));
                } else {
                    args.push_back(ScriptValue()); // null
                }
            }
        }
    }
    ::cJSON_free(jArgs);
    handleScriptMessage(args);
    return S_OK;
}

void EdgeWebView::webViewLoaderErrorMessageBox(HRESULT result)
{
    // TODO: Add clickable link to installer. It would be also better to display
    // a message and button in the native window using DPF drawing methods.
    std::wstringstream wss;
    wss << "Make sure you have installed the Microsoft Edge WebView2 Runtime. "
        << "Error 0x" << std::hex << result;
    std::wstring ws = wss.str();
    DISTRHO_LOG_STDERR_COLOR(TO_LPCSTR(ws));
    ::MessageBox(0, ws.c_str(), TEXT(DISTRHO_PLUGIN_NAME), MB_OK | MB_ICONSTOP);
}
