package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"syscall"
	"time"

	"github.com/lxn/win"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.design/x/hotkey"
	"golang.design/x/hotkey/mainthread"
)

// App struct
type App struct {
	ctx         context.Context
	isMinimized bool
	lastToggle  time.Time
}

// SetWindowPosition sets the window position (exposed to frontend)
func (a *App) SetWindowPosition(x int, y int) {
	runtime.WindowSetPosition(a.ctx, x, y)
}

// SetWindowSize sets the window size (exposed to frontend)
func (a *App) SetWindowSize(width int, height int) {
	runtime.WindowSetSize(a.ctx, width, height)
}

// CenterWindow centers the window on screen
func (a *App) CenterWindow() {
	runtime.WindowCenter(a.ctx)
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.isMinimized = false
	a.lastToggle = time.Now()
	// register hotkey on the app startup
	mainthread.Init(a.RegisterHotKey)
	go func() {
		// Sleep briefly to ensure window is created
		time.Sleep(100 * time.Millisecond)

		// Find the window by title
		hwnd := win.FindWindow(nil, syscall.StringToUTF16Ptr("myproject"))

		// Set the layered window style (allows transparency)
		exStyle := win.GetWindowLong(hwnd, win.GWL_EXSTYLE)
		win.SetWindowLong(hwnd, win.GWL_EXSTYLE, exStyle|win.WS_EX_LAYERED)
		// Get current window style and remove resizing capabilities
		style := win.GetWindowLong(hwnd, win.GWL_STYLE)

		// Remove these style flags to disable resizing:
		// WS_THICKFRAME (sizing border)
		// WS_MAXIMIZEBOX (maximize button)
		// WS_MINIMIZEBOX (minimize button) - optional, remove if you want to disable minimize too
		newStyle := style &^ (win.WS_THICKFRAME | win.WS_MAXIMIZEBOX)

		win.SetWindowLong(hwnd, win.GWL_STYLE, newStyle)
	}()
}

func (a *App) RegisterHotKey() {
	registerHotkey(a)
}

// SaveContent saves the text content to a file
func (a *App) SaveContent(content string) error {
	// Get the executable directory
	dir, err := os.Executable()
	if err != nil {
		return err
	}

	// Create notes directory if it doesn't exist
	notesDir := filepath.Join(filepath.Dir(dir), "notes")
	if err := os.MkdirAll(notesDir, 0755); err != nil {
		return err
	}

	// Save to notes.txt in the notes directory
	filename := filepath.Join(notesDir, "notes.txt")
	return os.WriteFile(filename, []byte(content), 0644)
}

// LoadContent loads the text content from file
func (a *App) LoadContent() (string, error) {
	dir, err := os.Executable()
	if err != nil {
		return "", err
	}

	filename := filepath.Join(filepath.Dir(dir), "notes", "notes.txt")
	content, err := os.ReadFile(filename)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil // Return empty string if file doesn't exist
		}
		return "", err
	}

	return string(content), nil
}

func registerHotkey(a *App) {
	// Register Ctrl + T
	hk := hotkey.New([]hotkey.Modifier{hotkey.ModCtrl}, hotkey.KeyT)
	err := hk.Register()
	if err != nil {
		fmt.Printf("Failed to register hotkey: %v\n", err)
		return
	}

	fmt.Printf("hotkey: %v is registered\n", hk)

	// Start listening for hotkey in a goroutine
	go func() {
		for {
			<-hk.Keydown()

			// Debounce the toggle to prevent double triggers
			now := time.Now()
			if now.Sub(a.lastToggle) < 300*time.Millisecond {
				fmt.Println("Debouncing toggle - too soon")
				continue
			}
			a.lastToggle = now

			// Toggle window state
			if a.isMinimized {
				runtime.WindowUnminimise(a.ctx)
				runtime.WindowShow(a.ctx)
				a.isMinimized = false
			} else {
				runtime.WindowMinimise(a.ctx)
				a.isMinimized = true
			}
		}
	}()
}
