package release

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

const imagePrefix = "chamoouske/finance-tracker-"

type CommandRunner interface {
	Run(name string, args ...string) error
}

type DockerPublisher struct {
	runner CommandRunner
}

func NewDockerPublisher(runner CommandRunner) *DockerPublisher {
	return &DockerPublisher{runner: runner}
}

func (p *DockerPublisher) Publish(repositoryRoot string) error {
	for _, component := range []string{"backend", "frontend"} {
		image := imagePrefix + component + ":latest"
		contextPath := filepath.Join(repositoryRoot, component)
		if err := p.runner.Run("docker", "build", "-t", image, contextPath); err != nil {
			return fmt.Errorf("build %s: %w", image, err)
		}
		if err := p.runner.Run("docker", "push", image); err != nil {
			return fmt.Errorf("push %s: %w", image, err)
		}
	}
	return nil
}

type ExecRunner struct{}

func (ExecRunner) Run(name string, args ...string) error {
	command := exec.Command(name, args...)
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr
	command.Stdin = os.Stdin
	return command.Run()
}
