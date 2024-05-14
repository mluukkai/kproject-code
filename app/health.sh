#!/bin/bash
var=$(curl -s -o /dev/null -w "%{http_code}" http://todo-backend-svc:80/todos)

if [[ $var -ne 200 ]]; then 
  echo "Curl request failed";
  exit 1
else 
  exit 0
fi