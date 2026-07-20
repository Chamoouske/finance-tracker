package main

import (
	"errors"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/chamoouske/finance-tracker/internal/release"
)

type publisher interface {
	Publish(repositoryRoot string) error
}

var (
	commandArguments = func() []string { return os.Args[1:] }
	newPublisher     = func() publisher { return release.NewDockerPublisher(release.ExecRunner{}) }
	fatalf           = log.Fatalf
)

func main() {
	if err := execute(commandArguments(), newPublisher()); err != nil {
		fatalf("publish Docker images: %v", err)
	}
}

func execute(arguments []string, imagePublisher publisher) error {
	flags := flag.NewFlagSet("publish-images", flag.ContinueOnError)
	root := flags.String("root", "..", "caminho da raiz do repositório")
	if err := flags.Parse(arguments); err != nil {
		return fmt.Errorf("parse arguments: %w", err)
	}
	if *root == "" {
		return errors.New("repository root is required")
	}
	return imagePublisher.Publish(*root)
}
