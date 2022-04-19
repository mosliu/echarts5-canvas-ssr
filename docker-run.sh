#!/usr/bin/env bash

docker run -d -p 8081:8081 --name echarts-ssr-server --restart=always mosliu/echart5-canvars-ssr
