FROM node:20

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY index.js .

CMD ["node", "index.js"]

# TAG=11 && docker build -t mluukkai/todo-wikipedia:$TAG . && docker push mluukkai/todo-wikipedia:$TAG
