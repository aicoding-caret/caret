//go:build windows

package global

import (
	"os"
	"os/exec"
)

func setChildProcessGroup(cmd *exec.Cmd) {
	// Windows does not support Unix-style process groups.
}

func terminateProcess(pid int) error {
	proc, err := os.FindProcess(pid)
	if err != nil {
		return err
	}
	return proc.Kill()
}
