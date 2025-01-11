FROM node:18-alpine

ENV LOGLEVEL="info"
ENV MQTT_BROKER_URL="mqtt://127.0.0.1"

WORKDIR /app
COPY package*.json /app
RUN npm ci

COPY . /app

CMD ["npm", "start"]