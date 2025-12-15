package auth

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/cline/grpc-go/caret"
	"github.com/cline/cli/pkg/cli/global"
)

func TestWaitForAuthenticationReturnsOnStreamAuth(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	listener := &CaretAuthStatusListener{
		updatesCh: make(chan *caret.CaretAuthState, 1),
		errCh:     make(chan error, 1),
		ctx:       ctx,
		cancel:    cancel,
	}

	// send an authenticated state
	listener.updatesCh <- &caret.CaretAuthState{
		User: &caret.CaretUserInfo{Uid: "user-123"},
	}

	if err := listener.WaitForAuthentication(200 * time.Millisecond); err != nil {
		t.Fatalf("expected authentication to succeed via stream update, got error: %v", err)
	}
}

func TestWaitForAuthenticationUsesPollingFallback(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	listener := &CaretAuthStatusListener{
		updatesCh: make(chan *caret.CaretAuthState, 1),
		errCh:     make(chan error, 1),
		ctx:       ctx,
		cancel:    cancel,
	}

	// Speed up polling for the test and stub the check function to avoid gRPC calls.
	originalInterval := caretAuthPollInterval
	originalCheck := caretAuthCheckFn
	caretAuthPollInterval = 10 * time.Millisecond
	caretAuthCheckFn = func(_ context.Context) (bool, error) {
		// first call returns false, second returns true
		if isCaretSessionAuthenticated {
			return true, nil
		}
		isCaretSessionAuthenticated = true
		return false, nil
	}
	defer func() {
		caretAuthPollInterval = originalInterval
		caretAuthCheckFn = originalCheck
		isCaretSessionAuthenticated = false
	}()

	if err := listener.WaitForAuthentication(200 * time.Millisecond); err != nil {
		t.Fatalf("expected polling fallback to detect authentication, got error: %v", err)
	}
}

func TestWaitForAuthenticationFailsAfterConsecutiveErrors(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	listener := &CaretAuthStatusListener{
		updatesCh: make(chan *caret.CaretAuthState, 1),
		errCh:     make(chan error, 1),
		ctx:       ctx,
		cancel:    cancel,
	}

	originalInterval := caretAuthPollInterval
	originalCheck := caretAuthCheckFn
	caretAuthPollInterval = 10 * time.Millisecond
	caretAuthCheckFn = func(_ context.Context) (bool, error) {
		return false, errors.New("backend unavailable")
	}
	defer func() {
		caretAuthPollInterval = originalInterval
		caretAuthCheckFn = originalCheck
	}()

	err := listener.WaitForAuthentication(60 * time.Millisecond)
	if err == nil {
		t.Fatalf("expected authentication to eventually timeout when backend stays unavailable")
	}
	if !errors.Is(err, context.DeadlineExceeded) && !strings.Contains(err.Error(), "timeout") {
		t.Fatalf("expected timeout-driven error, got: %v", err)
	}
}

func TestWaitForAuthenticationAllowsInternalFallbackOnlyDuringAuth(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	listener := &CaretAuthStatusListener{
		updatesCh: make(chan *caret.CaretAuthState, 1),
		errCh:     make(chan error, 1),
		ctx:       ctx,
		cancel:    cancel,
	}

	originalInterval := caretAuthPollInterval
	originalCheck := caretAuthCheckFn
	originalFlag := allowInternalAuthFallback
	caretAuthPollInterval = 5 * time.Millisecond
	caretAuthCheckFn = func(_ context.Context) (bool, error) {
		if allowInternalAuthFallback {
			return true, nil
		}
		return false, errors.New("backend unavailable")
	}
	defer func() {
		caretAuthPollInterval = originalInterval
		caretAuthCheckFn = originalCheck
		allowInternalAuthFallback = originalFlag
	}()

	if err := listener.WaitForAuthentication(200 * time.Millisecond); err != nil {
		t.Fatalf("expected authentication to succeed via internal fallback, got error: %v", err)
	}
	if allowInternalAuthFallback {
		t.Fatalf("expected internal fallback flag to be reset after auth flow")
	}
}

func TestClearCaretLocalSessionRemovesKeys(t *testing.T) {
	tmp := t.TempDir()
	oldCfg := global.Config
	global.Config = &global.GlobalConfig{ConfigPath: tmp}
	defer func() { global.Config = oldCfg }()

	dataDir := filepath.Join(tmp, "data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		t.Fatalf("failed to create data dir: %v", err)
	}

	secretsPath := filepath.Join(dataDir, "secrets.json")
	globalStatePath := filepath.Join(dataDir, "globalState.json")
	if err := os.WriteFile(secretsPath, []byte(`{"caret:caretAccountId":"abc","foo":1}`), 0644); err != nil {
		t.Fatalf("failed to write secrets: %v", err)
	}
	if err := os.WriteFile(globalStatePath, []byte(`{"userInfo":{"id":"123"},"bar":2}`), 0644); err != nil {
		t.Fatalf("failed to write globalState: %v", err)
	}

	clearCaretLocalSession()

	content, _ := os.ReadFile(secretsPath)
	if strings.Contains(string(content), "caret:caretAccountId") {
		t.Fatalf("expected caret:caretAccountId to be removed from secrets.json, got: %s", string(content))
	}

	content, _ = os.ReadFile(globalStatePath)
	if strings.Contains(string(content), "userInfo") {
		t.Fatalf("expected userInfo to be removed from globalState.json, got: %s", string(content))
	}
}
