FROM node:14-bullseye

WORKDIR /app

COPY . . 

RUN pwd && \
    ls -lh && \
    npm install --global @angular/cli && \
    npm ci && \
    ng build --output-path=dist || cat /root/.npm/_logs/* && \
    ls -lh dist

