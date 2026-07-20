package main

import (
	"errors"
	"testing"
)

type publisherStub struct {
	root string
	err  error
}

func (p *publisherStub) Publish(root string) error {
	p.root = root
	return p.err
}

func TestExecuteUsesConfiguredRootAndPublishes(t *testing.T) {
	publisher := &publisherStub{}
	if err := execute([]string{"-root", "."}, publisher); err != nil {
		t.Fatalf("execute() error = %v", err)
	}
	if publisher.root != "." {
		t.Fatalf("publisher root = %q, want current directory", publisher.root)
	}
}

func TestExecutePropagatesPublisherFailure(t *testing.T) {
	want := errors.New("publish failed")
	publisher := &publisherStub{err: want}
	if err := execute(nil, publisher); !errors.Is(err, want) {
		t.Fatalf("execute() error = %v, want %v", err, want)
	}
}

func TestExecuteRejectsInvalidArgumentsAndEmptyRoot(t *testing.T) {
	for _, arguments := range [][]string{{"-unknown"}, {"-root", ""}} {
		if err := execute(arguments, &publisherStub{}); err == nil {
			t.Fatalf("execute(%v) expected error", arguments)
		}
	}
}

func TestMainHandlesSuccessAndFailure(t *testing.T) {
	originalArguments, originalPublisher, originalFatalf := commandArguments, newPublisher, fatalf
	t.Cleanup(func() { commandArguments, newPublisher, fatalf = originalArguments, originalPublisher, originalFatalf })
	commandArguments = func() []string { return []string{"-root", "."} }

	failed := false
	fatalf = func(string, ...interface{}) { failed = true }
	newPublisher = func() publisher { return &publisherStub{} }
	main()
	if failed {
		t.Fatal("main reported failure for successful publish")
	}

	newPublisher = func() publisher { return &publisherStub{err: errors.New("failed")} }
	main()
	if !failed {
		t.Fatal("main did not report publisher failure")
	}
}
