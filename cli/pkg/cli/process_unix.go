//go:build !windows

package cli

import "syscall"

func terminateProcess(pid int) error {
	return syscall.Kill(pid, syscall.SIGTERM)
}
