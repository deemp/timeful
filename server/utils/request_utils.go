package utils

import (
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"schej.it/server/logger"
)

func ParseArrayQueryParam(s string) []string {
	decoded, err := url.QueryUnescape(s)
	if err != nil {
		logger.StdErr.Panicln(err)
	}
	arr := strings.Split(decoded, ",")
	return arr
}

// GetOrigin returns the request Origin header.
func GetOrigin(c *gin.Context) string {
	return c.Request.Header.Get("Origin")
}
