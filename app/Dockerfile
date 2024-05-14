FROM node:20

WORKDIR /app

RUN apt-get -y update; apt-get -y install curl

COPY package*.json ./

RUN npm install

COPY . .

ENV port=3000

EXPOSE 3000

CMD [ "node", "index.js" ]

# TAG=3 && docker build -t mluukkai/todo-app:$TAG . && docker push mluukkai/todo-app:$TAG
