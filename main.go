package main

import (
	"context" // Add this import
	"embed"
	"syscall"
	"time"

	"github.com/lxn/win"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/wailsapp/wails/v2/pkg/runtime" // Add this import
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "myproject",
		Width:  324,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},

		AlwaysOnTop:      true,
		Frameless:        true,                                  // Ensure the window is frameless
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 0}, // Try Alpha 1 for better results

		Windows: &windows.Options{
			WebviewIsTransparent: true,

			DisablePinchZoom:                  false,
			DisableWindowIcon:                 false,
			DisableFramelessWindowDecorations: true,
			WebviewUserDataPath:               "",
			WebviewBrowserPath:                "",
			Theme:                             windows.SystemDefault,
		},
		OnStartup: func(ctx context.Context) { // Replace app.startup with this
			// Store context in your app struct
			app.ctx = ctx
			// First center the window
			runtime.WindowCenter(ctx)

			// Wait a moment for the window to settle
			time.Sleep(100 * time.Millisecond)

			// Then apply your custom position
			runtime.WindowSetPosition(ctx, 889, 44)
			runtime.WindowSetSize(ctx, 104, 40)

			// Now add back the transparency code
			go func() {
				time.Sleep(100 * time.Millisecond)
				hwnd := win.FindWindow(nil, syscall.StringToUTF16Ptr("myproject"))
				exStyle := win.GetWindowLong(hwnd, win.GWL_EXSTYLE)
				win.SetWindowLong(hwnd, win.GWL_EXSTYLE, exStyle|win.WS_EX_LAYERED)
			}()

		},
		Bind: []interface{}{
			app, // This stays the same to bind your app methods
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
