FROM node:21 as build

WORKDIR /app

COPY package.json .

COPY yarn.lock .

RUN yarn install

COPY . .

RUN yarn build

CMD ["npm", "run", "serve"]
