//go:build !windows

package global

import (
	"os/exec"
	"syscall"
)

func setChildProcessGroup(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true,
	}
}

func terminateProcess(pid int) error {
	return syscall.Kill(pid, syscall.SIGTERM)
}
