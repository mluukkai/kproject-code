FROM postgres:16.2-bullseye

WORKDIR /usr/src/app

RUN apt-get -y update; apt-get -y install curl
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash
RUN apt install -y nodejs
RUN mkdir /etc/secrets

COPY . .

RUN npm install

CMD /usr/src/app/script.sh

# TAG=10 && docker build --platform linux/amd64 -t mluukkai/backup:$TAG . && docker push mluukkai/backup:$TAG