# Deye Microinverter Cloud-Free Docker Image

This is a fork of the [original Deye Microinverter Cloud-Free project](https://github.com/Hypfer/deye-microinverter-cloud-free) that automatically builds and publishes the dummycloud as a Docker image to GitHub Container Registry.

## Features

- Automated Docker image builds and pushes to GitHub Container Registry
- Weekly automatic builds every Monday at 00:00 UTC
- Based on Node.js 18 Alpine for minimal image size

## Quick Start

The easiest way to use the dummycloud is via Docker. Example `docker-compose.yml`:

```yml
---
services:
  deye-dummycloud:
    image: ghcr.io/vordenken/deye-microinverter-cloud-free/deye-dummycloud:latest 
    container_name: deye-dummycloud
    restart: unless-stopped
    environment:
      - "LOGLEVEL=info"
      - "MQTT_BROKER_URL=mqtt://foobar.example"
      # Optional for MQTT authentication:
      # - "MQTT_USERNAME=example-user"
      # - "MQTT_PASSWORD=example-password"
    ports:
      - "10000:10000"
```

For more information on the service take a look [here](https://github.com/vordenken/deye-microinverter-cloud-free/blob/main/dummycloud/README.md)
