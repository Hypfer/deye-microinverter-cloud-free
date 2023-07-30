FROM node:lts-alpine

WORKDIR /app
ENV LOGLEVEL="info"
ENV MQTT_BROKER_URL="mqtt://127.0.0.1"

COPY package.json /app
COPY package-lock.json /app

RUN npm ci
COPY . /app

CMD ["npm", "start"]