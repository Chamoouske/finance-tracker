package release

import (
	"errors"
	"os/exec"
	"reflect"
	"testing"
)

type runnerStub struct {
	commands [][]string
	failAt   int
}

func TestExecRunnerReturnsCommandStatus(t *testing.T) {
	runner := ExecRunner{}
	goExecutable, err := exec.LookPath("go")
	if err != nil {
		t.Fatalf("find go: %v", err)
	}
	if err := runner.Run(goExecutable, "version"); err != nil {
		t.Fatalf("valid command: %v", err)
	}
	if err := runner.Run(goExecutable, "invalid-command"); err == nil {
		t.Fatal("invalid command should fail")
	}
}

func (r *runnerStub) Run(name string, args ...string) error {
	command := append([]string{name}, args...)
	r.commands = append(r.commands, command)
	if r.failAt > 0 && len(r.commands) == r.failAt {
		return errors.New("docker failed")
	}
	return nil
}

func TestPublisherBuildsAndPushesAllImages(t *testing.T) {
	runner := &runnerStub{}
	publisher := NewDockerPublisher(runner)

	if err := publisher.Publish(`C:\repo`); err != nil {
		t.Fatalf("Publish() error = %v", err)
	}

	want := [][]string{
		{"docker", "build", "-t", "chamoouske/finance-tracker-backend:latest", `C:\repo\backend`},
		{"docker", "push", "chamoouske/finance-tracker-backend:latest"},
		{"docker", "build", "-t", "chamoouske/finance-tracker-frontend:latest", `C:\repo\frontend`},
		{"docker", "push", "chamoouske/finance-tracker-frontend:latest"},
		{"docker", "build", "-t", "chamoouske/finance-tracker-mcp:latest", `C:\repo\mcp`},
		{"docker", "push", "chamoouske/finance-tracker-mcp:latest"},
	}
	if !reflect.DeepEqual(runner.commands, want) {
		t.Fatalf("commands = %#v, want %#v", runner.commands, want)
	}
}

func TestPublisherStopsAfterFirstFailure(t *testing.T) {
	for _, failAt := range []int{1, 2, 3, 4, 5, 6} {
		runner := &runnerStub{failAt: failAt}
		publisher := NewDockerPublisher(runner)
		if err := publisher.Publish(`C:\repo`); err == nil {
			t.Fatalf("Publish() expected error at command %d", failAt)
		}
		if len(runner.commands) != failAt {
			t.Fatalf("executed %d commands after failure, want %d", len(runner.commands), failAt)
		}
	}
}
