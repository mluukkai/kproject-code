FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV port=3000

EXPOSE 3000

CMD [ "node", "index.js" ]

# TAG=10 && docker build -t mluukkai/the-todo-backend:$TAG . && docker push mluukkai/the-todo-backend:$TAG