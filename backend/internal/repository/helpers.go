package repository

import "time"

func parseTime(s string) (time.Time, error) {
	return time.Parse("2006-01-02 15:04:05", s)
}

func formatTime(t time.Time) string {
	return t.Format("2006-01-02 15:04:05")
}
